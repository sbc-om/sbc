import { headers } from "next/headers";

import { getBusinessCardById } from "@/lib/db/businessCards";
import { getBusinessById } from "@/lib/db/businesses";
import { defaultLocale } from "@/lib/i18n/locales";
import { getSbcwalletApplePkpassForBusinessCard, isSbcwalletAppleConfigured } from "@/lib/wallet/sbcwallet";

export const runtime = "nodejs";

function isEnabled() {
  return String(process.env.APPLE_WALLET_ENABLED || "").toLowerCase() === "true";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  const card = getBusinessCardById(cardId);
  if (!card || !card.isPublic) {
    return new Response("Not found", { status: 404 });
  }

  const business = getBusinessById(card.businessId);

  if (!isEnabled() || !isSbcwalletAppleConfigured()) {
    return Response.json(
      {
        ok: false,
        error: "APPLE_WALLET_NOT_CONFIGURED",
        hint:
          "Set APPLE_WALLET_ENABLED=true and provide APPLE_TEAM_ID/APPLE_PASS_TYPE_ID/APPLE_CERT_PATH/APPLE_WWDR_PATH (and APPLE_CERT_PASSWORD if needed)",
        business: business?.name?.en ?? business?.name?.ar ?? null,
      },
      { status: 501 }
    );
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const baseUrl = host ? `${proto}://${host}` : "";
  const publicCardUrl = baseUrl
    ? `${baseUrl}/${defaultLocale}/business-card/${encodeURIComponent(card.id)}`
    : undefined;

  const pkpass = await getSbcwalletApplePkpassForBusinessCard({
    cardId: card.id,
    publicCardUrl,
    origin: baseUrl || undefined,
  });
  const body = new Uint8Array(pkpass);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename=business-card-${encodeURIComponent(card.id)}.pkpass`,
      "Cache-Control": "no-store",
    },
  });
}
