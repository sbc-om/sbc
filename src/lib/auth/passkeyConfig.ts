/**
 * Resolve the WebAuthn expected origin from the request.
 *
 * Priority:
 *  1. PASSKEY_ORIGIN env override
 *  2. Forwarded headers (X-Forwarded-Proto + X-Forwarded-Host / Host)
 *     – this correctly handles reverse-proxied and subdomain requests
 *  3. NEXT_PUBLIC_SITE_URL env fallback
 *  4. req.url (last resort, mainly for local dev without a proxy)
 */
export function resolvePasskeyOrigin(req: Request): string {
  if (process.env.PASSKEY_ORIGIN) return process.env.PASSKEY_ORIGIN;

  // Derive from forwarded headers so the origin matches
  // what the browser actually reports in clientDataJSON.
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.split(",")[0]?.trim();

  if (host) {
    // Strip default ports – origins never include :443 / :80
    const cleanHost = host.replace(/:443$/, "").replace(/:80$/, "");
    return `${proto}://${cleanHost}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return new URL(req.url).origin;
}

/**
 * Resolve the WebAuthn Relying-Party ID.
 *
 * The RP ID should be the *registrable domain* so that passkeys registered on
 * the main domain (e.g. sbc.om) also work on subdomains (e.g. shop.sbc.om).
 *
 * Priority:
 *  1. PASSKEY_RP_ID env override
 *  2. Hostname derived from NEXT_PUBLIC_SITE_URL (always the main domain)
 *  3. Hostname from request headers
 *  4. req.url hostname (last resort)
 */
export function resolvePasskeyRpId(req: Request): string {
  if (process.env.PASSKEY_RP_ID) return process.env.PASSKEY_RP_ID;

  // Prefer the main-site URL so RP ID stays the top-level domain even when
  // the request arrives via a subdomain.
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    try {
      return new URL(envUrl).hostname;
    } catch { /* fall through */ }
  }

  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.split(",")[0]?.trim();
  if (host) return host.split(":")[0];

  try {
    return new URL(req.url).hostname;
  } catch {
    return "localhost";
  }
}

export function resolvePasskeyRpName() {
  return process.env.PASSKEY_RP_NAME || "SBC";
}

export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function base64UrlToBuffer(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

export function toCredentialIdBuffer(value: string | ArrayBuffer | Uint8Array | Buffer) {
  if (typeof value === "string") {
    return base64UrlToBuffer(value);
  }
  if (value instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(value));
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  return value;
}
