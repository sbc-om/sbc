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
      message.startsWith("INVALID_ENV_GOOGLE_WALLET_");
    const status = isConfigError ? 501 : 500;

    return Response.json(
      {
        ok: false,
        error: isConfigError ? "GOOGLE_WALLET_NOT_CONFIGURED" : "GOOGLE_WALLET_ERROR",
        message,
        hint: isConfigError
          ? "Provide a PKCS#8 PEM private key (-----BEGIN PRIVATE KEY----- ...) or set GOOGLE_WALLET_SERVICE_ACCOUNT_JSON"
          : undefined,
      },
      { status }
    );
  }
}
