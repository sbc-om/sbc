import { getCurrentUser } from "@/lib/auth/currentUser";
import { getWalletStatus } from "@/lib/wallet/walletUpdates";

export const runtime = "nodejs";

/**
 * Wallet Configuration Status Endpoint
 * 
 * This endpoint helps diagnose wallet update issues by checking:
 * - Apple Wallet APNS configuration
 * - Google Wallet API configuration
 * 
 * Use this to verify that wallet updates are properly configured.
 */
export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const status = getWalletStatus();

    return Response.json({
      ok: true,
      wallet: status,
      envCheck: {
        // Google Wallet checks
        googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        googleIssuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
        
        // Apple Wallet checks
        appleEnabled: process.env.APPLE_WALLET_ENABLED,
        applePassTypeId: process.env.APPLE_PASS_TYPE_ID ? "✓" : "✗",
        appleTeamId: process.env.APPLE_TEAM_ID ? "✓" : "✗",
        appleApnsKeyId: process.env.APPLE_APNS_KEY_ID ? "✓" : "✗",
        appleApnsKeyPath: process.env.APPLE_APNS_AUTH_KEY_P8_PATH ? "✓" : "✗",
        appleApnsEnv: process.env.APPLE_APNS_ENV || "production",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "STATUS_CHECK_FAILED";
    return Response.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
