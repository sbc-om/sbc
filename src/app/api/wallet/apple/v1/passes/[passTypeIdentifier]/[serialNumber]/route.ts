import { headers } from "next/headers";

import { getLoyaltyCardById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { defaultLocale } from "@/lib/i18n/locales";
import {
  getSbcwalletApplePkpassForLoyaltyCard,
  verifyAppleWalletAuthToken,
} from "@/lib/wallet/sbcwallet";

export const runtime = "nodejs";

function resolveWebServiceUrl(baseUrl: string | null): string | undefined {
  const envUrl = process.env.APPLE_WALLET_WEB_SERVICE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/api/wallet/apple` : undefined;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> },
) {
  const { passTypeIdentifier, serialNumber } = await params;

  if (!process.env.APPLE_PASS_TYPE_ID || passTypeIdentifier !== process.env.APPLE_PASS_TYPE_ID) {
    return new Response("Not found", { status: 404 });
  }

  const authHeader = (await headers()).get("authorization");
  const authorized = verifyAppleWalletAuthToken({
    authorization: authHeader,
    serialNumber,
    passTypeIdentifier,
  });
  if (!authorized) return new Response("Unauthorized", { status: 401 });

  const card = getLoyaltyCardById(serialNumber);
  if (!card || card.status !== "active") return new Response("Not found", { status: 404 });

  const profile = getLoyaltyProfileByUserId(card.userId);

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const baseUrl = host ? `${proto}://${host}` : "";
  const publicCardUrl = baseUrl
    ? `${baseUrl}/${defaultLocale}/loyalty/card/${encodeURIComponent(card.id)}`
    : undefined;
  const webServiceUrl = resolveWebServiceUrl(baseUrl || null);

  const pkpass = await getSbcwalletApplePkpassForLoyaltyCard({
    cardId: card.id,
    publicCardUrl,
    webServiceUrl,
  });

  return new Response(new Uint8Array(pkpass), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename=loyalty-${encodeURIComponent(card.id)}.pkpass`,
      "Cache-Control": "no-store",
      "Last-Modified": String(card.updatedAt ?? new Date().toISOString()),
    },
  });
}
