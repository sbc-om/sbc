import { getLoyaltyCardById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";

export const runtime = "nodejs";

function isEnabled() {
  return String(process.env.GOOGLE_WALLET_ENABLED || "").toLowerCase() === "true";
}

export async function GET(
  _req: Request,
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
        error: "GOOGLE_WALLET_NOT_CONFIGURED",
        hint:
          "Set GOOGLE_WALLET_ENABLED=true and provide issuer/service-account credentials in .env",
        business: profile?.businessName ?? null,
      },
      { status: 501 }
    );
  }

  return Response.json(
    {
      ok: false,
      error: "GOOGLE_WALLET_NOT_IMPLEMENTED_YET",
      hint:
        "The API route exists, but JWT creation + Google Wallet API integration still needs credentials wiring.",
    },
    { status: 501 }
  );
}
