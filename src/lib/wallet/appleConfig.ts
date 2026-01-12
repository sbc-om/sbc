import fs from "node:fs";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function isAppleWalletEnabled(): boolean {
  return String(process.env.APPLE_WALLET_ENABLED || "").toLowerCase() === "true";
}

export function getApplePassTypeIdentifier(): string {
  const v = env("APPLE_PASS_TYPE_IDENTIFIER");
  if (!v) throw new Error("MISSING_ENV_APPLE_PASS_TYPE_IDENTIFIER");
  return v;
}

export function getAppleTeamIdentifier(): string {
  const v = env("APPLE_TEAM_IDENTIFIER");
  if (!v) throw new Error("MISSING_ENV_APPLE_TEAM_IDENTIFIER");
  return v;
}

export function getAppleOrganizationName(): string {
  const v = env("APPLE_ORGANIZATION_NAME");
  if (!v) throw new Error("MISSING_ENV_APPLE_ORGANIZATION_NAME");
  return v;
}

export function getAppleWebServiceUrl(): string {
  const v = env("APPLE_WEB_SERVICE_URL");
  if (!v) throw new Error("MISSING_ENV_APPLE_WEB_SERVICE_URL");
  return v.replace(/\/$/, "");
}

export function getAppleAuthSeed(): string {
  const v = env("APPLE_AUTH_TOKEN");
  if (!v) throw new Error("MISSING_ENV_APPLE_AUTH_TOKEN");
  return v;
}

function readFileIfExists(p?: string): Buffer | null {
  if (!p) return null;
  const path = p.trim();
  if (!path) return null;
  if (!fs.existsSync(path)) return null;
  return fs.readFileSync(path);
}

export function getApplePassSigningCerts(): {
  wwdr: Buffer;
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase?: string;
} {
  const wwdr = readFileIfExists(env("APPLE_WWDR_CERT_PEM_PATH"));
  const signerCert = readFileIfExists(env("APPLE_SIGNER_CERT_PEM_PATH"));
  const signerKey = readFileIfExists(env("APPLE_SIGNER_KEY_PEM_PATH"));
  const signerKeyPassphrase = env("APPLE_SIGNER_KEY_PASSPHRASE");

  if (!wwdr) throw new Error("MISSING_FILE_APPLE_WWDR_CERT_PEM_PATH");
  if (!signerCert) throw new Error("MISSING_FILE_APPLE_SIGNER_CERT_PEM_PATH");
  if (!signerKey) throw new Error("MISSING_FILE_APPLE_SIGNER_KEY_PEM_PATH");

  return { wwdr, signerCert, signerKey, signerKeyPassphrase: signerKeyPassphrase || undefined };
}

export function isApplePassGenerationConfigured(): boolean {
  if (!isAppleWalletEnabled()) return false;
  try {
    getApplePassTypeIdentifier();
    getAppleTeamIdentifier();
    getAppleOrganizationName();
    getAppleWebServiceUrl();
    getAppleAuthSeed();
    getApplePassSigningCerts();
    return true;
  } catch {
    return false;
  }
}
