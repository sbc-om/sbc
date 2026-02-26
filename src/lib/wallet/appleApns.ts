import fs from "node:fs";
import http2 from "node:http2";
import tls from "node:tls";

import { importPKCS8, SignJWT } from "jose";
import { SocksClient } from "socks";

import { deleteAppleWalletRegistrationsByPushTokens, listAppleWalletPushTokensForSerial } from "@/lib/db/loyalty";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function isAppleWalletEnabled(): boolean {
  return String(process.env.APPLE_WALLET_ENABLED || "").toLowerCase() === "true";
}

function getApplePassTypeIdentifier(): string {
  const v = env("APPLE_PASS_TYPE_ID");
  if (!v) throw new Error("MISSING_ENV_APPLE_PASS_TYPE_ID");
  return v;
}

function isSandbox(): boolean {
  // Support both APPLE_APNS_ENV and APNS_SANDBOX
  const apnsEnv = env("APPLE_APNS_ENV");
  if (apnsEnv) {
    return apnsEnv.toLowerCase() === "sandbox";
  }
  // APNS_SANDBOX=false means production, APNS_SANDBOX=true means sandbox
  const sandbox = env("APNS_SANDBOX");
  return sandbox?.toLowerCase() === "true";
}

export function isAppleApnsConfigured(): boolean {
  if (!isAppleWalletEnabled()) return false;
  const p8Path = env("APPLE_APNS_AUTH_KEY_P8_PATH");
  const kid = env("APPLE_APNS_KEY_ID");
  const teamId = env("APPLE_TEAM_ID");
  return Boolean(p8Path && kid && teamId && fs.existsSync(p8Path));
}

let cachedJwt: { value: string; expMs: number } | null = null;

async function getApnsJwt(): Promise<string> {
  const now = Date.now();
  if (cachedJwt && cachedJwt.expMs > now + 30_000) return cachedJwt.value;

  const p8Path = env("APPLE_APNS_AUTH_KEY_P8_PATH");
  const kid = env("APPLE_APNS_KEY_ID");
  const teamId = env("APPLE_TEAM_ID");

  if (!p8Path) throw new Error("MISSING_ENV_APPLE_APNS_AUTH_KEY_P8_PATH");
  if (!kid) throw new Error("MISSING_ENV_APPLE_APNS_KEY_ID");
  if (!teamId) throw new Error("MISSING_ENV_APPLE_TEAM_ID");

  const keyPem = fs.readFileSync(p8Path, "utf8");
  const key = await importPKCS8(keyPem, "ES256");

  const iat = Math.floor(now / 1000);
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid })
    .setIssuer(teamId)
    .setIssuedAt(iat)
    // Keep it short-lived; APNs allows up to 60 minutes.
    .setExpirationTime(iat + 55 * 60)
    .sign(key);

  cachedJwt = { value: jwt, expMs: now + 55 * 60 * 1000 };
  return jwt;
}

// SOCKS5 proxy configuration for restricted networks (e.g., Iran)
function getSocks5Config(): { host: string; port: number } | null {
  const host = env("APNS_SOCKS5_HOST");
  const port = env("APNS_SOCKS5_PORT");
  if (host && port) {
    return { host, port: parseInt(port, 10) };
  }
  return null;
}

/**
 * Connect to APNs through SOCKS5 proxy
 */
async function connectThroughSocks5(targetHost: string, targetPort: number): Promise<tls.TLSSocket> {
  const socks5 = getSocks5Config();
  if (!socks5) throw new Error("SOCKS5 not configured");

  const { socket } = await SocksClient.createConnection({
    proxy: {
      host: socks5.host,
      port: socks5.port,
      type: 5,
    },
    command: "connect",
    destination: {
      host: targetHost,
      port: targetPort,
    },
    timeout: 10000,
  });

  // Upgrade to TLS with ALPN for HTTP/2
  const tlsSocket = tls.connect({
    socket: socket,
    servername: targetHost,
    ALPNProtocols: ["h2"],
  });

  return new Promise((resolve, reject) => {
    tlsSocket.on("secureConnect", () => resolve(tlsSocket));
    tlsSocket.on("error", reject);
  });
}

function isSocks5ConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = String(error.message || "").toUpperCase();
  return (
    message.includes("ECONNREFUSED")
    || message.includes("ETIMEDOUT")
    || message.includes("EHOSTUNREACH")
    || message.includes("ENETUNREACH")
    || message.includes("SOCKS")
  );
}

async function sendOnePushToken(input: { token: string; passTypeIdentifier: string }): Promise<{ ok: true } | { ok: false; status: number; body: string }> {
  const jwt = await getApnsJwt();
  const apnsHost = isSandbox() ? "api.sandbox.push.apple.com" : "api.push.apple.com";
  const apnsPort = 443;
  const socks5 = getSocks5Config();

  console.log(`[APNs] Sending push to ${apnsHost} (sandbox: ${isSandbox()}, socks5: ${socks5 ? `${socks5.host}:${socks5.port}` : "none"})`);

  let client: http2.ClientHttp2Session;

  if (socks5) {
    try {
      // Connect through SOCKS5 proxy
      const tlsSocket = await connectThroughSocks5(apnsHost, apnsPort);
      client = http2.connect(`https://${apnsHost}`, {
        createConnection: () => tlsSocket,
      });
    } catch (error) {
      if (!isSocks5ConnectionError(error)) {
        throw error;
      }
      console.warn(`[APNs] SOCKS5 failed (${socks5.host}:${socks5.port}), falling back to direct connection`);
      client = http2.connect(`https://${apnsHost}`);
    }
  } else {
    // Direct connection
    client = http2.connect(`https://${apnsHost}`);
  }

  try {
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${input.token}`,
      "authorization": `bearer ${jwt}`,
      "apns-topic": input.passTypeIdentifier,
      "apns-push-type": "background",
      "content-type": "application/json",
    });

    req.end("{}");

    const chunks: Buffer[] = [];

    return await new Promise((resolve, reject) => {
      req.on("response", (headers) => {
        const status = Number(headers[":status"] ?? 0);
        req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))));
        req.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if (status >= 200 && status < 300) resolve({ ok: true });
          else resolve({ ok: false, status, body });
        });
      });
      req.on("error", reject);
    });
  } finally {
    client.close();
  }
}

export async function notifyAppleWalletPassUpdated(input: { cardId: string }): Promise<{ attempted: number; ok: number; failed: number }> {
  if (!isAppleApnsConfigured()) {
    console.log("[APNs] Not configured, skipping push notification");
    return { attempted: 0, ok: 0, failed: 0 };
  }

  const passTypeIdentifier = getApplePassTypeIdentifier();
  const tokens = await listAppleWalletPushTokensForSerial(passTypeIdentifier, input.cardId);

  console.log(`[APNs] Found ${tokens.length} push token(s) for card ${input.cardId}`);

  if (!tokens.length) return { attempted: 0, ok: 0, failed: 0 };

  const results = await Promise.all(
    tokens.map(async (t) => {
      try {
        const result = await sendOnePushToken({ token: t, passTypeIdentifier });
        console.log(`[APNs] Push result for token ${t.slice(0, 8)}...: ${result.ok ? "OK" : `FAILED (${(result as { status: number; body: string }).status}: ${(result as { body: string }).body})`}`);
        return { token: t, ...result };
      } catch (e) {
        console.error(`[APNs] Push error for token ${t.slice(0, 8)}...:`, e);
        return { token: t, ok: false as const, status: 0, body: e instanceof Error ? e.message : "APNS_FAILED" };
      }
    })
  );

  // Auto-purge tokens that APNs reports as permanently invalid
  const PURGE_REASONS = ["BadDeviceToken", "Unregistered", "DeviceTokenNotForTopic"];
  const badTokens = results.filter((r) => {
    if (r.ok) return false;
    const body = (r as { body?: string }).body ?? "";
    return PURGE_REASONS.some((reason) => body.includes(reason));
  }).map((r) => r.token);

  if (badTokens.length) {
    try {
      const purged = await deleteAppleWalletRegistrationsByPushTokens(badTokens);
      console.log(`[APNs] Auto-purged ${purged} registration(s) with invalid token(s): ${badTokens.map((t) => t.slice(0, 8) + "...").join(", ")}`);
    } catch (e) {
      console.error("[APNs] Failed to purge bad tokens:", e);
    }
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  console.log(`[APNs] Push summary: ${ok} ok, ${failed} failed out of ${results.length} attempted`);
  return { attempted: results.length, ok, failed };
}
