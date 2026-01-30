import { getLoyaltyCardById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { defaultLocale } from "@/lib/i18n/locales";
import { getSbcwalletGoogleSaveUrlForLoyaltyCard, isSbcwalletGoogleConfigured } from "@/lib/wallet/sbcwallet";

export const runtime = "nodejs";

function isEnabled() {
  const raw = String(process.env.GOOGLE_WALLET_ENABLED || "").trim().toLowerCase();
  if (!raw) return isSbcwalletGoogleConfigured();
  return ["1", "true", "yes", "on"].includes(raw);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  const card = await getLoyaltyCardById(cardId);
  if (!card || card.status !== "active") {
    return new Response("Not found", { status: 404 });
  }

  const profile = await getLoyaltyProfileByUserId(card.userId);

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

  if (!isSbcwalletGoogleConfigured()) {
    return Response.json(
      {
        ok: false,
        error: "GOOGLE_WALLET_NOT_CONFIGURED",
        hint: "Provide GOOGLE_ISSUER_ID and GOOGLE_SA_JSON (path to service account JSON) in .env",
      },
      { status: 501 }
    );
  }

  try {
    const origin = new URL(req.url).origin;
    const publicCardUrl = `${origin}/${defaultLocale}/loyalty/card/${encodeURIComponent(card.id)}`;

    const { saveUrl } = await getSbcwalletGoogleSaveUrlForLoyaltyCard({
      cardId: card.id,
      origin,
      publicCardUrl,
    });
    return Response.redirect(saveUrl, 302);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json(
      {
        ok: false,
        error: "GOOGLE_WALLET_ERROR",
        message,
      },
      { status: 500 }
    );
  }
}
