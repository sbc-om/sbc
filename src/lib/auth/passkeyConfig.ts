/**
 * Resolve WebAuthn expected origins from the request.
 *
 * Priority:
 *  1. PASSKEY_ORIGIN env override (single or comma-separated list)
 *  2. Request Origin header
 *  3. Forwarded headers (X-Forwarded-Proto + X-Forwarded-Host / Host)
 *  4. NEXT_PUBLIC_SITE_URL env fallback
 *  5. req.url origin
 */
function unique(values: Array<string | undefined | null>) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function parseOrigin(value: string | undefined | null) {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function parseHostnameFromUrl(value: string | undefined | null) {
  if (!value) return undefined;
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function headerValue(req: Request, key: string) {
  return req.headers.get(key)?.split(",")[0]?.trim() || undefined;
}

function reqUrlProtocol(req: Request) {
  try {
    return new URL(req.url).protocol.replace(":", "");
  } catch {
    return undefined;
  }
}

function reqUrlOrigin(req: Request) {
  try {
    return new URL(req.url).origin;
  } catch {
    return undefined;
  }
}

function reqUrlHostname(req: Request) {
  try {
    return new URL(req.url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function forwardedOrigin(req: Request) {
  const proto = headerValue(req, "x-forwarded-proto") || reqUrlProtocol(req) || "https";
  const rawHost = headerValue(req, "x-forwarded-host") || headerValue(req, "host");
  if (!rawHost) return undefined;

  const host = rawHost.replace(/^https?:\/\//, "");
  const cleanHost =
    proto === "https"
      ? host.replace(/:443$/, "")
      : proto === "http"
      ? host.replace(/:80$/, "")
      : host.replace(/:443$/, "").replace(/:80$/, "");
  return `${proto}://${cleanHost}`;
}

function requestHostname(req: Request) {
  const rawHost = headerValue(req, "x-forwarded-host") || headerValue(req, "host");
  if (rawHost) {
    return rawHost.replace(/^https?:\/\//, "").split(":")[0]?.toLowerCase();
  }
  return reqUrlHostname(req);
}

function envSiteOrigin() {
  return parseOrigin(process.env.NEXT_PUBLIC_SITE_URL);
}

function envSiteHostname() {
  return parseHostnameFromUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

function isSubdomainOrSame(hostname: string, domain: string) {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function resolvePasskeyExpectedOrigins(req: Request): string[] {
  const explicit = process.env.PASSKEY_ORIGIN;
  if (explicit) {
    const list = unique(
      explicit
        .split(",")
        .map((value) => parseOrigin(value.trim()))
    );
    if (list.length > 0) return list;
  }

  return unique([
    parseOrigin(headerValue(req, "origin")),
    forwardedOrigin(req),
    envSiteOrigin(),
    reqUrlOrigin(req),
  ]);
}

export function resolvePasskeyOrigin(req: Request): string {
  const expected = resolvePasskeyExpectedOrigins(req);
  if (expected.length > 0) return expected[0];

  const fallback = reqUrlOrigin(req);
  if (fallback) return fallback;

  return "http://localhost:3000";
}

/**
 * Resolve WebAuthn expected RP IDs from request/env.
 *
 * Priority:
 *  1. PASSKEY_RP_ID env override (single or comma-separated list)
 *  2. Origin/header-derived hostname (or env apex if origin is env subdomain)
 *  3. Request host / NEXT_PUBLIC_SITE_URL / req.url hostname fallbacks
 */
export function resolvePasskeyExpectedRpIds(req: Request): string[] {
  const explicit = process.env.PASSKEY_RP_ID;
  if (explicit) {
    const list = unique(
      explicit
        .split(",")
        .map((value) => {
          const trimmed = value.trim().toLowerCase();
          if (!trimmed) return undefined;
          if (trimmed.includes("://")) return parseHostnameFromUrl(trimmed);
          return trimmed.replace(/^https?:\/\//, "").split(":")[0] || undefined;
        })
    );
    if (list.length > 0) return list;
  }

  const originHostname = parseHostnameFromUrl(headerValue(req, "origin"));
  const hostFromReq = requestHostname(req);
  const envHostname = envSiteHostname();
  const urlHostname = reqUrlHostname(req);

  let primary: string | undefined;

  if (originHostname && envHostname && isSubdomainOrSame(originHostname, envHostname)) {
    primary = envHostname;
  } else if (originHostname) {
    primary = originHostname;
  } else if (hostFromReq && envHostname && isSubdomainOrSame(hostFromReq, envHostname)) {
    primary = envHostname;
  } else if (hostFromReq) {
    primary = hostFromReq;
  } else if (envHostname) {
    primary = envHostname;
  } else if (urlHostname) {
    primary = urlHostname;
  }

  return unique([primary, envHostname, originHostname, hostFromReq, urlHostname]);
}

/**
 * Resolve the WebAuthn primary RP ID used in options generation.
 * For verification, prefer `resolvePasskeyExpectedRpIds()` which returns all accepted IDs.
 */
export function resolvePasskeyRpId(req: Request): string {
  const expected = resolvePasskeyExpectedRpIds(req);
  if (expected.length > 0) return expected[0];

  const fallback = reqUrlHostname(req);
  return fallback || "localhost";
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
