export function resolvePasskeyOrigin(req: Request) {
  const envOrigin = process.env.PASSKEY_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL;
  if (envOrigin) return envOrigin;
  return new URL(req.url).origin;
}

export function resolvePasskeyRpId(req: Request) {
  if (process.env.PASSKEY_RP_ID) return process.env.PASSKEY_RP_ID;
  const origin = resolvePasskeyOrigin(req);
  try {
    return new URL(origin).hostname;
  } catch {
    return new URL(req.url).hostname;
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
