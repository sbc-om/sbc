import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getLoyaltyCardTemplateById } from "@/lib/db/loyaltyTemplates";
import { getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
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
 * /api/loyalty/templates/{id}/preview/apple:
 *   get:
 *     summary: Download a preview Apple Wallet pass for a template
 *     description: Generates a sample pass using the template design with test data
 *     tags: [Loyalty Templates]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Apple Wallet pass file (preview/sample)
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

    const template = await getLoyaltyCardTemplateById(id);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Only template owner can preview
    if (template.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const profile = await getLoyaltyProfileByUserId(template.userId);
    const baseUrl = getBaseUrl(req);

    // Generate a sample/preview pass with test data
    const sampleCardId = `preview-${template.id}-${Date.now()}`;
    const sampleMemberId = "SBC-SAMPLE-12345";
    const sampleCustomerName = "Sample Customer";
    const samplePoints = 125;

    const passBuffer = await generateApplePassFromTemplate({
      cardId: sampleCardId,
      memberId: sampleMemberId,
      customerName: sampleCustomerName,
      phone: "+1234567890",
      points: samplePoints,
      template,
      profile,
      origin: baseUrl,
      // No webServiceUrl for preview - this is a one-time sample pass
    });

    // Return the pass as a downloadable file
    return new NextResponse(new Uint8Array(passBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="preview-${template.name.replace(/[^a-zA-Z0-9]/g, "_")}.pkpass"`,
        "Content-Length": String(passBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error generating Apple preview pass:", error);
    return NextResponse.json(
      { error: "Failed to generate Apple Wallet pass", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
