import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getIssuedCardWithTemplate,
  updateIssuedCardGoogleSaveUrl,
} from "@/lib/db/loyaltyTemplates";
import { getLoyaltyCustomerById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import {
  isSbcwalletGoogleConfigured,
  isSbcwalletAppleConfigured,
} from "@/lib/wallet/sbcwallet";

type RouteParams = { params: Promise<{ id: string }> };

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * @swagger
 * /api/loyalty/issued-cards/{id}/wallet:
 *   get:
 *     summary: Get wallet pass URLs for an issued card
 *     tags: [Loyalty Issued Cards]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: platform
 *         in: query
 *         schema:
 *           type: string
 *           enum: [google, apple, both]
 *     responses:
 *       200:
 *         description: Wallet URLs
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform") || "both";

    const result = await getIssuedCardWithTemplate(id);
    if (!result) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const { card, template } = result;

    // Allow card owner or business owner to access
    if (card.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customer = await getLoyaltyCustomerById(card.customerId);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const profile = await getLoyaltyProfileByUserId(card.userId);
    const baseUrl = getBaseUrl(req);

    const response: {
      ok: boolean;
      google?: { available: boolean; saveUrl?: string; error?: string };
      apple?: { available: boolean; downloadUrl?: string; error?: string };
    } = { ok: true };

    // Generate Google Wallet URL
    if (platform === "google" || platform === "both") {
      const googleConfigured = isSbcwalletGoogleConfigured();
      response.google = { available: googleConfigured };

      if (googleConfigured) {
        try {
          // Import dynamically to avoid bundling issues
          const { generateGoogleWalletSaveUrl } = await import("@/lib/wallet/walletUpdates");
          
          const saveUrl = await generateGoogleWalletSaveUrl({
            cardId: card.id,
            memberId: card.memberId,
            customerName: customer.fullName,
            points: card.points,
            template,
            profile,
            origin: baseUrl,
          });

          response.google.saveUrl = saveUrl;

          // Cache the URL
          await updateIssuedCardGoogleSaveUrl(card.id, saveUrl);
        } catch (err: unknown) {
          console.error("Google Wallet error:", err);
          response.google.error = err instanceof Error ? err.message : "GOOGLE_WALLET_ERROR";
        }
      }
    }

    // Generate Apple Wallet URL
    if (platform === "apple" || platform === "both") {
      const appleConfigured = isSbcwalletAppleConfigured();
      response.apple = { available: appleConfigured };

      if (appleConfigured) {
        // Apple wallet requires downloading a .pkpass file
        response.apple.downloadUrl = `${baseUrl}/api/loyalty/issued-cards/${card.id}/wallet/apple`;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting wallet URLs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
