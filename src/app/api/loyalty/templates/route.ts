import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  listLoyaltyCardTemplates,
  createLoyaltyCardTemplate,
} from "@/lib/db/loyaltyTemplates";

const designSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundStyle: z.enum(["solid", "gradient", "pattern"]),
  logoPosition: z.enum(["top", "center", "corner"]),
  showBusinessName: z.boolean(),
  showCustomerName: z.boolean(),
  cornerRadius: z.number().min(0).max(24),
});

const passContentSchema = z.object({
  programName: z.string().min(1),
  pointsLabel: z.string().min(1),
  headerLabel: z.string().optional(),
  headerValue: z.string().optional(),
  secondaryLabel: z.string().optional(),
  secondaryValue: z.string().optional(),
  auxFields: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  backFields: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
});

const barcodeSchema = z.object({
  format: z.enum(["qr", "code128", "pdf417", "aztec"]),
  messageTemplate: z.string().optional(),
  altTextTemplate: z.string().optional(),
});

const imagesSchema = z.object({
  logoUrl: z.string().optional(),
  iconUrl: z.string().optional(),
  stripUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
}).optional();

const supportSchema = z.object({
  websiteUrl: z.string().url().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
}).optional();

const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
  design: designSchema,
  passContent: passContentSchema,
  barcode: barcodeSchema,
  images: imagesSchema,
  support: supportSchema,
  terms: z.string().optional(),
  description: z.string().optional(),
  notificationTitle: z.string().optional(),
  notificationBody: z.string().optional(),
});

/**
 * @swagger
 * /api/loyalty/templates:
 *   get:
 *     summary: List all card templates for current user
 *     tags: [Loyalty Templates]
 *     responses:
 *       200:
 *         description: List of card templates
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await listLoyaltyCardTemplates(user.id);
    return NextResponse.json({ ok: true, templates });
  } catch (error) {
    console.error("Error listing templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/loyalty/templates:
 *   post:
 *     summary: Create a new card template
 *     tags: [Loyalty Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Template created successfully
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createTemplateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    
    const template = await createLoyaltyCardTemplate({
      userId: user.id,
      name: data.name,
      isDefault: data.isDefault,
      design: data.design,
      passContent: data.passContent,
      barcode: data.barcode,
      images: data.images ?? {},
      support: {
        websiteUrl: data.support?.websiteUrl || undefined,
        email: data.support?.email || undefined,
        phone: data.support?.phone || undefined,
        address: data.support?.address || undefined,
      },
      terms: data.terms,
      description: data.description,
      notificationTitle: data.notificationTitle,
      notificationBody: data.notificationBody,
    });

    return NextResponse.json({ ok: true, template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
