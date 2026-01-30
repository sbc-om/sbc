import fs from "node:fs";
import http2 from "node:http2";

import { importPKCS8, SignJWT } from "jose";

import { listAppleWalletPushTokensForSerial } from "@/lib/db/loyalty";

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
  return (env("APPLE_APNS_ENV") || "production").toLowerCase() === "sandbox";
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

async function sendOnePushToken(input: { token: string; passTypeIdentifier: string }): Promise<{ ok: true } | { ok: false; status: number; body: string }> {
  const jwt = await getApnsJwt();
  const origin = isSandbox() ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
  const client = http2.connect(origin);

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
  if (!isAppleApnsConfigured()) return { attempted: 0, ok: 0, failed: 0 };

  const passTypeIdentifier = getApplePassTypeIdentifier();
  const tokens = await listAppleWalletPushTokensForSerial(passTypeIdentifier, input.cardId);

  if (!tokens.length) return { attempted: 0, ok: 0, failed: 0 };

  const results = await Promise.all(
    tokens.map(async (t) => {
      try {
        return await sendOnePushToken({ token: t, passTypeIdentifier });
      } catch (e) {
        return { ok: false as const, status: 0, body: e instanceof Error ? e.message : "APNS_FAILED" };
      }
    })
  );

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  return { attempted: results.length, ok, failed };
}
