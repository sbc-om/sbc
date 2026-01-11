import { getLoyaltyCardById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";

export const runtime = "nodejs";

function isEnabled() {
  return String(process.env.APPLE_WALLET_ENABLED || "").toLowerCase() === "true";
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

  // For now, we only expose a safe stub unless PassKit certs are configured.
  // A real .pkpass requires signing keys and WWDR cert.
  if (!isEnabled()) {
    return Response.json(
      {
        ok: false,
        error: "APPLE_WALLET_NOT_CONFIGURED",
        hint:
          "Set APPLE_WALLET_ENABLED=true and provide PassKit signing cert/key + WWDR cert in .env",
        business: profile?.businessName ?? null,
      },
      { status: 501 }
    );
  }

  return Response.json(
    {
      ok: false,
      error: "APPLE_WALLET_NOT_IMPLEMENTED_YET",
      hint:
        "The API route exists, but pass generation/signing still needs to be wired with your Apple certificates.",
    },
    { status: 501 }
  );
}
