import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getLoyaltyCardTemplateById,
  updateLoyaltyCardTemplate,
  deleteLoyaltyCardTemplate,
  countIssuedCardsForTemplate,
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
}).partial();

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
}).partial();

const barcodeSchema = z.object({
  format: z.enum(["qr", "code128", "pdf417", "aztec"]),
  messageTemplate: z.string().optional(),
  altTextTemplate: z.string().optional(),
}).partial();

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
  design: designSchema.optional(),
  passContent: passContentSchema.optional(),
  barcode: barcodeSchema.optional(),
  images: z.object({
    logoUrl: z.string().optional(),
    iconUrl: z.string().optional(),
    stripUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  }).optional(),
  support: z.object({
    websiteUrl: z.string().url().optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  terms: z.string().optional(),
  description: z.string().optional(),
  notificationTitle: z.string().optional(),
  notificationBody: z.string().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/loyalty/templates/{id}:
 *   get:
 *     summary: Get a card template by ID
 *     tags: [Loyalty Templates]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const template = await getLoyaltyCardTemplateById(id);
    
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const issuedCount = await countIssuedCardsForTemplate(id);

    return NextResponse.json({ ok: true, template, issuedCount });
  } catch (error) {
    console.error("Error getting template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/loyalty/templates/{id}:
 *   patch:
 *     summary: Update a card template
 *     tags: [Loyalty Templates]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Template updated successfully
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getLoyaltyCardTemplateById(id);
    
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateTemplateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    
    // Merge design, passContent, barcode with existing values
    const updates: Parameters<typeof updateLoyaltyCardTemplate>[1] = {
      name: data.name,
      isDefault: data.isDefault,
      terms: data.terms,
      description: data.description,
      notificationTitle: data.notificationTitle,
      notificationBody: data.notificationBody,
    };

    if (data.design) {
      updates.design = { ...existing.design, ...data.design };
    }
    if (data.passContent) {
      updates.passContent = { ...existing.passContent, ...data.passContent };
    }
    if (data.barcode) {
      updates.barcode = { ...existing.barcode, ...data.barcode };
    }
    if (data.images) {
      updates.images = { ...existing.images, ...data.images };
    }
    if (data.support) {
      updates.support = {
        ...existing.support,
        websiteUrl: data.support.websiteUrl || existing.support?.websiteUrl,
        email: data.support.email || existing.support?.email,
        phone: data.support.phone || existing.support?.phone,
        address: data.support.address || existing.support?.address,
      };
    }

    const template = await updateLoyaltyCardTemplate(id, updates);

    return NextResponse.json({ ok: true, template });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/loyalty/templates/{id}:
 *   delete:
 *     summary: Delete a card template
 *     tags: [Loyalty Templates]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getLoyaltyCardTemplateById(id);
    
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (existing.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if template has issued cards
    const issuedCount = await countIssuedCardsForTemplate(id);
    if (issuedCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete template with issued cards", issuedCount },
        { status: 400 }
      );
    }

    await deleteLoyaltyCardTemplate(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
