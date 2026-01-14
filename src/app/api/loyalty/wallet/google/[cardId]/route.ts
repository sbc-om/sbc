import { getLoyaltyCardById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { createGoogleWalletSaveJwt, getGoogleWalletSaveUrl } from "@/lib/wallet/googleWallet";

export const runtime = "nodejs";

function isEnabled() {
  return String(process.env.GOOGLE_WALLET_ENABLED || "").toLowerCase() === "true";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  const card = getLoyaltyCardById(cardId);
  if (!card || card.status !== "active") {
    return new Response("Not found", { status: 404 });
  }

  const profile = getLoyaltyProfileByUserId(card.userId);

  if (!isEnabled()) {
    return Response.json(
      {
        ok: false,
        error: "GOOGLE_WALLET_DISABLED",
        hint: "Set GOOGLE_WALLET_ENABLED=true to enable Google Wallet",
        business: profile?.businessName ?? null,
      },
      { status: 501 }
    );
  }

  try {
    const origin = new URL(req.url).origin;
    const jwt = await createGoogleWalletSaveJwt({ cardId: card.id, origins: [origin] });
    const url = getGoogleWalletSaveUrl(jwt);
    return Response.redirect(url, 302);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const isConfigError =
      message.startsWith("MISSING_ENV_GOOGLE_WALLET_") ||
      message.startsWith("INVALID_ENV_GOOGLE_WALLET_") ||
      message.startsWith("MISSING_PUBLIC_BASE_URL_FOR_GOOGLE_WALLET");
    const status = isConfigError ? 501 : 500;

    let hint: string | undefined;
    if (message.startsWith("MISSING_PUBLIC_BASE_URL_FOR_GOOGLE_WALLET")) {
      hint = "Set NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_URL, or SITE_URL environment variable to your public HTTPS URL";
    } else if (isConfigError) {
      hint = "Provide a PKCS#8 PEM private key (-----BEGIN PRIVATE KEY----- ...) or set GOOGLE_WALLET_SERVICE_ACCOUNT_JSON";
    }

    return Response.json(
      {
        ok: false,
        error: isConfigError ? "GOOGLE_WALLET_NOT_CONFIGURED" : "GOOGLE_WALLET_ERROR",
        message,
        hint,
      },
      { status }
    );
  }
}
