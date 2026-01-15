import { isSbcwalletGoogleConfigured } from "@/lib/wallet/sbcwallet";

export const runtime = "nodejs";

function hasEnv(name: string): boolean {
  const v = process.env[name];
  return Boolean(v && v.trim());
}

function isEnabled(): boolean {
  const raw = String(process.env.GOOGLE_WALLET_ENABLED || "").trim().toLowerCase();
  if (!raw) return isSbcwalletGoogleConfigured();
  return ["1", "true", "yes", "on"].includes(raw);
}

export async function GET() {
  const enabled = isEnabled();
  const configured = enabled && isSbcwalletGoogleConfigured();

  // Note: do not leak secrets; only report presence.
  const issuerId = hasEnv("GOOGLE_ISSUER_ID");
  const saJsonPath = hasEnv("GOOGLE_SA_JSON");

  return Response.json({
    ok: true,
    enabled,
    configured,
    env: {
      GOOGLE_ISSUER_ID: issuerId,
      GOOGLE_SA_JSON: saJsonPath,
    },
  });
}
