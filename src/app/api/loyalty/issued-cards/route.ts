import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  listLoyaltyIssuedCards,
  issueNewLoyaltyCard,
  getDefaultLoyaltyCardTemplate,
  getLoyaltyCardTemplateById,
} from "@/lib/db/loyaltyTemplates";
import { getLoyaltyCustomerById } from "@/lib/db/loyalty";

const issueCardSchema = z.object({
  customerId: z.string().min(1),
  templateId: z.string().optional(),
  initialPoints: z.number().min(0).optional(),
  memberId: z.string().optional(),
  overrides: z.object({
    secondaryLabel: z.string().optional(),
    secondaryValue: z.string().optional(),
    auxFields: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })).optional(),
  }).optional(),
});

/**
 * @swagger
 * /api/loyalty/issued-cards:
 *   get:
 *     summary: List all issued cards for current user
 *     tags: [Loyalty Issued Cards]
 *     parameters:
 *       - name: templateId
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [active, suspended, revoked]
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *       - name: offset
 *         in: query
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of issued cards
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const templateId = url.searchParams.get("templateId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!) : undefined;
    const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!) : undefined;

    const cards = await listLoyaltyIssuedCards({
      userId: user.id,
      templateId,
      status,
      limit,
      offset,
    });

    return NextResponse.json({ ok: true, cards });
  } catch (error) {
    console.error("Error listing issued cards:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/loyalty/issued-cards:
 *   post:
 *     summary: Issue a new card to a customer
 *     tags: [Loyalty Issued Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *             properties:
 *               customerId:
 *                 type: string
 *               templateId:
 *                 type: string
 *               initialPoints:
 *                 type: number
 *               memberId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Card issued successfully
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = issueCardSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate customer exists and belongs to this user
    const customer = await getLoyaltyCustomerById(data.customerId);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    if (customer.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get template (use specified or default)
    let template;
    if (data.templateId) {
      template = await getLoyaltyCardTemplateById(data.templateId);
      if (!template || template.userId !== user.id) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
    } else {
      template = await getDefaultLoyaltyCardTemplate(user.id);
      if (!template) {
        return NextResponse.json(
          { error: "No card template found. Please create a template first." },
          { status: 400 }
        );
      }
    }

    const card = await issueNewLoyaltyCard({
      userId: user.id,
      templateId: template.id,
      customerId: data.customerId,
      initialPoints: data.initialPoints ?? 0,
      memberId: data.memberId,
      overrides: data.overrides,
    });

    return NextResponse.json({ ok: true, card, template }, { status: 201 });
  } catch (error: any) {
    // Handle unique constraint violation for duplicate memberId
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "A card with this member ID already exists" },
        { status: 400 }
      );
    }
    console.error("Error issuing card:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
