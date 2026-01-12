import { isGoogleWalletEnabled } from "@/lib/wallet/googleWallet";

export const runtime = "nodejs";

function hasEnv(name: string): boolean {
  const v = process.env[name];
  return Boolean(v && v.trim());
}

export async function GET() {
  const enabled = isGoogleWalletEnabled();

  // Note: do not leak secrets; only report presence.
  const issuerId = hasEnv("GOOGLE_WALLET_ISSUER_ID");
  const email = hasEnv("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL");
  const privateKey = hasEnv("GOOGLE_WALLET_PRIVATE_KEY");

  const inlineJson = hasEnv("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON");
  const jsonPath = hasEnv("GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_PATH");
  const applicationCreds = hasEnv("GOOGLE_APPLICATION_CREDENTIALS");

  const configured =
    enabled &&
    issuerId &&
    (inlineJson || jsonPath || applicationCreds || (email && privateKey));

  return Response.json({
    ok: true,
    enabled,
    configured,
    env: {
      GOOGLE_WALLET_ISSUER_ID: issuerId,
      GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL: email,
      GOOGLE_WALLET_PRIVATE_KEY: privateKey,
      GOOGLE_WALLET_SERVICE_ACCOUNT_JSON: inlineJson,
      GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_PATH: jsonPath,
      GOOGLE_APPLICATION_CREDENTIALS: applicationCreds,
    },
  });
}
