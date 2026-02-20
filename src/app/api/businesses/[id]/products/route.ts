import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessById } from "@/lib/db/businesses";
import {
  createBusinessProduct,
  deleteBusinessProductByBusiness,
  listBusinessProducts,
  updateBusinessProductByBusiness,
} from "@/lib/db/businessContent";
import { notifyAdminsAboutSubmission } from "@/lib/notifications/moderation";
import { saveUpload } from "@/lib/uploads/storage";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

const linkUrlSchema = z
  .string()
  .trim()
  .refine((value) => /^https?:\/\//i.test(value) || value.startsWith("/"), "Invalid link URL");

const bodySchema = z.object({
  nameEn: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  linkUrl: linkUrlSchema.optional(),
  price: z.coerce.number().min(0),
  currency: z.string().trim().min(1).default("OMR"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;
    const business = await getBusinessById(businessId);

    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    const products = await listBusinessProducts(businessId, { availableOnly: true, limit: 50 });
    return NextResponse.json({ ok: true, data: products });
  } catch (error: unknown) {
    console.error("[business-products] GET error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const business = await getBusinessById(businessId);

    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    if (business.ownerId !== user.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const parsed = bodySchema.safeParse({
      nameEn: String(formData.get("nameEn") || ""),
      nameAr: String(formData.get("nameAr") || ""),
      descriptionEn: String(formData.get("descriptionEn") || "").trim(),
      descriptionAr: String(formData.get("descriptionAr") || "").trim(),
      linkUrl: String(formData.get("linkUrl") || "").trim() || undefined,
      price: String(formData.get("price") || ""),
      currency: String(formData.get("currency") || "OMR"),
    });

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
    }

    let imageUrl: string | undefined;
    const imageFile = formData.get("image") as File | null;

    if (imageFile && imageFile.size > 0) {
      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedImageTypes.includes(imageFile.type)) {
        return NextResponse.json({ ok: false, error: "Invalid image file type" }, { status: 400 });
      }

      if (imageFile.size > 6 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "Image too large (max 6MB)" }, { status: 400 });
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const ext = imageFile.name.split(".").pop() || "jpg";
      imageUrl = await saveUpload(buffer, {
        folder: `business-content/${businessId}/products`,
        filename: `product.${ext}`,
      });
    }

    const created = await createBusinessProduct({
      businessId,
      name: {
        en: parsed.data.nameEn,
        ar: parsed.data.nameAr,
      },
      description:
        parsed.data.descriptionEn || parsed.data.descriptionAr
          ? {
              en: parsed.data.descriptionEn || "",
              ar: parsed.data.descriptionAr || "",
            }
          : undefined,
      linkUrl: parsed.data.linkUrl,
      imageUrl,
      price: parsed.data.price,
      currency: parsed.data.currency,
      isAvailable: false,
      sortOrder: 0,
    });

    await notifyAdminsAboutSubmission({
      kind: "product",
      businessId,
      businessName: business.name,
      actorUserId: user.id,
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    console.error("[business-products] POST error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    if (business.ownerId !== user.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();
    const productId = String(payload?.productId || "").trim();
    if (!productId) {
      return NextResponse.json({ ok: false, error: "productId is required" }, { status: 400 });
    }

    const deleted = await deleteBusinessProductByBusiness(productId, businessId);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[business-products] DELETE error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

const patchSchema = z.object({
  productId: z.string().trim().min(1),
  nameEn: z.string().trim().min(1).optional(),
  nameAr: z.string().trim().min(1).optional(),
  descriptionEn: z.string().trim().optional(),
  descriptionAr: z.string().trim().optional(),
  linkUrl: linkUrlSchema.nullable().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().trim().min(1).optional(),
  isAvailable: z.boolean().optional(),
  clearImage: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    if (business.ownerId !== user.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    let payload;

    let imageUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const rawPrice = String(formData.get("price") || "").trim();
      const rawAvailable = String(formData.get("isAvailable") || "").trim();
      const rawClearImage = String(formData.get("clearImage") || "").trim();

      payload = patchSchema.safeParse({
        productId: String(formData.get("productId") || "").trim(),
        nameEn: String(formData.get("nameEn") || "").trim() || undefined,
        nameAr: String(formData.get("nameAr") || "").trim() || undefined,
        descriptionEn: String(formData.get("descriptionEn") || "").trim() || undefined,
        descriptionAr: String(formData.get("descriptionAr") || "").trim() || undefined,
        linkUrl:
          String(formData.get("clearLink") || "").trim() === "true"
            ? null
            : String(formData.get("linkUrl") || "").trim() || undefined,
        price: rawPrice === "" ? undefined : Number(rawPrice),
        currency: String(formData.get("currency") || "").trim() || undefined,
        isAvailable:
          rawAvailable === ""
            ? undefined
            : rawAvailable === "true"
              ? true
              : rawAvailable === "false"
                ? false
                : undefined,
        clearImage:
          rawClearImage === ""
            ? undefined
            : rawClearImage === "true"
              ? true
              : rawClearImage === "false"
                ? false
                : undefined,
      });

      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedImageTypes.includes(imageFile.type)) {
          return NextResponse.json({ ok: false, error: "Invalid image file type" }, { status: 400 });
        }

        if (imageFile.size > 6 * 1024 * 1024) {
          return NextResponse.json({ ok: false, error: "Image too large (max 6MB)" }, { status: 400 });
        }

        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const ext = imageFile.name.split(".").pop() || "jpg";
        imageUrl = await saveUpload(buffer, {
          folder: `business-content/${businessId}/products`,
          filename: `product-update.${ext}`,
        });
      }
    } else {
      payload = patchSchema.safeParse(await req.json());
    }

    if (!payload.success) {
      return NextResponse.json({ ok: false, error: payload.error.message }, { status: 400 });
    }

    const updated = await updateBusinessProductByBusiness(payload.data.productId, businessId, {
      name:
        payload.data.nameEn || payload.data.nameAr
          ? { en: payload.data.nameEn || "", ar: payload.data.nameAr || "" }
          : undefined,
      description:
        payload.data.descriptionEn || payload.data.descriptionAr
          ? { en: payload.data.descriptionEn || "", ar: payload.data.descriptionAr || "" }
          : undefined,
      linkUrl: payload.data.linkUrl,
      price: payload.data.price,
      currency: payload.data.currency,
      isAvailable: payload.data.isAvailable,
      imageUrl: imageUrl ?? (payload.data.clearImage ? null : undefined),
    });

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error: unknown) {
    console.error("[business-products] PATCH error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
