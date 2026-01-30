import { headers } from "next/headers";

import { getLoyaltyCardById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { defaultLocale } from "@/lib/i18n/locales";
import { getSbcwalletApplePkpassForLoyaltyCard, isSbcwalletAppleConfigured } from "@/lib/wallet/sbcwallet";

export const runtime = "nodejs";

function isEnabled() {
  return String(process.env.APPLE_WALLET_ENABLED || "").toLowerCase() === "true";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;

  const card = await getLoyaltyCardById(cardId);
  if (!card || card.status !== "active") {
    return new Response("Not found", { status: 404 });
  }

  const profile = await getLoyaltyProfileByUserId(card.userId);

  // Uses sbcwallet-style env vars (APPLE_TEAM_ID/APPLE_PASS_TYPE_ID/APPLE_CERT_PATH/APPLE_WWDR_PATH).
  if (!isEnabled() || !isSbcwalletAppleConfigured()) {
    return Response.json(
      {
        ok: false,
        error: "APPLE_WALLET_NOT_CONFIGURED",
        hint:
          "Set APPLE_WALLET_ENABLED=true and provide APPLE_TEAM_ID/APPLE_PASS_TYPE_ID/APPLE_CERT_PATH/APPLE_WWDR_PATH (and APPLE_CERT_PASSWORD if needed)",
        business: profile?.businessName ?? null,
      },
      { status: 501 }
    );
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const baseUrl = host ? `${proto}://${host}` : "";
  const webServiceUrl = process.env.APPLE_WALLET_WEB_SERVICE_URL?.trim()
    ? process.env.APPLE_WALLET_WEB_SERVICE_URL!.trim().replace(/\/$/, "")
    : (baseUrl ? `${baseUrl}/api/wallet/apple` : undefined);
  const publicCardUrl = baseUrl
    ? `${baseUrl}/${defaultLocale}/loyalty/card/${encodeURIComponent(card.id)}`
    : undefined;

  const pkpass = await getSbcwalletApplePkpassForLoyaltyCard({
    cardId: card.id,
    publicCardUrl,
    webServiceUrl: webServiceUrl || undefined,
  });
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
