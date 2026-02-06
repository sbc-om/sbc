import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getIssuedCardWithTemplate } from "@/lib/db/loyaltyTemplates";
import { getLoyaltyCustomerById, getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { generateApplePassFromTemplate } from "@/lib/wallet/walletUpdates";
import { isSbcwalletAppleConfigured } from "@/lib/wallet/sbcwallet";

type RouteParams = { params: Promise<{ id: string }> };

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

/**
 * @swagger
 * /api/loyalty/issued-cards/{id}/wallet/apple:
 *   get:
 *     summary: Download Apple Wallet pass for an issued card
 *     tags: [Loyalty Issued Cards]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Apple Wallet pass file
 *         content:
 *           application/vnd.apple.pkpass:
 *             schema:
 *               type: string
 *               format: binary
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Check Apple Wallet configuration
    if (!isSbcwalletAppleConfigured()) {
      return NextResponse.json(
        { error: "Apple Wallet not configured" },
        { status: 503 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    // Generate the Apple Wallet pass
    const passBuffer = await generateApplePassFromTemplate({
      cardId: card.id,
      memberId: card.memberId,
      customerName: customer.fullName,
      phone: customer.phone ? String(customer.phone) : undefined,
      points: card.points,
      template,
      profile,
      origin: baseUrl,
      webServiceUrl: `${baseUrl}/api/loyalty/apple-pass`,
    });

    // Return the pass as a downloadable file
    return new NextResponse(new Uint8Array(passBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${card.memberId}.pkpass"`,
        "Content-Length": String(passBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating Apple pass:", error);
    return NextResponse.json(
      { error: "Failed to generate Apple Wallet pass" },
      { status: 500 }
    );
  }
}
