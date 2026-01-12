import { headers } from "next/headers";

import { getLoyaltyCardById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { defaultLocale } from "@/lib/i18n/locales";
import { isApplePassGenerationConfigured } from "@/lib/wallet/appleConfig";
import { buildAppleLoyaltyPkpassBuffer } from "@/lib/wallet/applePass";

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

  // A real .pkpass requires signing keys and WWDR cert.
  if (!isEnabled() || !isApplePassGenerationConfigured()) {
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

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const baseUrl = host ? `${proto}://${host}` : "";
  const publicCardUrl = baseUrl
    ? `${baseUrl}/${defaultLocale}/loyalty/card/${encodeURIComponent(card.id)}`
    : undefined;

  const pkpass = await buildAppleLoyaltyPkpassBuffer({ cardId: card.id, publicCardUrl });
  const body = new Uint8Array(pkpass);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename=loyalty-${encodeURIComponent(card.id)}.pkpass`,
      "Cache-Control": "no-store",
    },
  });
}
