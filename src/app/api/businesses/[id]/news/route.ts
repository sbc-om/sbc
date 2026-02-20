import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessById } from "@/lib/db/businesses";
import {
  createBusinessNews,
  deleteBusinessNewsByBusiness,
  listBusinessNews,
  updateBusinessNewsByBusiness,
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
  titleEn: z.string().trim().min(1),
  titleAr: z.string().trim().min(1),
  contentEn: z.string().trim().min(1),
  contentAr: z.string().trim().min(1),
  linkUrl: linkUrlSchema.optional(),
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

    const news = await listBusinessNews(businessId, { publishedOnly: true, limit: 20 });
    return NextResponse.json({ ok: true, data: news });
  } catch (error: unknown) {
    console.error("[business-news] GET error:", error);
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
      titleEn: String(formData.get("titleEn") || ""),
      titleAr: String(formData.get("titleAr") || ""),
      contentEn: String(formData.get("contentEn") || ""),
      contentAr: String(formData.get("contentAr") || ""),
      linkUrl: String(formData.get("linkUrl") || "").trim() || undefined,
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
        folder: `business-content/${businessId}/news`,
        filename: `news.${ext}`,
      });
    }

    const created = await createBusinessNews({
      businessId,
      title: {
        en: parsed.data.titleEn,
        ar: parsed.data.titleAr,
      },
      content: {
        en: parsed.data.contentEn,
        ar: parsed.data.contentAr,
      },
      linkUrl: parsed.data.linkUrl,
      imageUrl,
      isPublished: false,
    });

    await notifyAdminsAboutSubmission({
      kind: "news",
      businessId,
      businessName: business.name,
      actorUserId: user.id,
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    console.error("[business-news] POST error:", error);
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
    const newsId = String(payload?.newsId || "").trim();
    if (!newsId) {
      return NextResponse.json({ ok: false, error: "newsId is required" }, { status: 400 });
    }

    const deleted = await deleteBusinessNewsByBusiness(newsId, businessId);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "News item not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[business-news] DELETE error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

const patchSchema = z.object({
  newsId: z.string().trim().min(1),
  titleEn: z.string().trim().min(1).optional(),
  titleAr: z.string().trim().min(1).optional(),
  contentEn: z.string().trim().min(1).optional(),
  contentAr: z.string().trim().min(1).optional(),
  linkUrl: linkUrlSchema.nullable().optional(),
  isPublished: z.boolean().optional(),
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
      const rawPublished = String(formData.get("isPublished") || "").trim();
      const rawClearImage = String(formData.get("clearImage") || "").trim();

      payload = patchSchema.safeParse({
        newsId: String(formData.get("newsId") || "").trim(),
        titleEn: String(formData.get("titleEn") || "").trim() || undefined,
        titleAr: String(formData.get("titleAr") || "").trim() || undefined,
        contentEn: String(formData.get("contentEn") || "").trim() || undefined,
        contentAr: String(formData.get("contentAr") || "").trim() || undefined,
        linkUrl:
          String(formData.get("clearLink") || "").trim() === "true"
            ? null
            : String(formData.get("linkUrl") || "").trim() || undefined,
        isPublished:
          rawPublished === ""
            ? undefined
            : rawPublished === "true"
              ? true
              : rawPublished === "false"
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
          folder: `business-content/${businessId}/news`,
          filename: `news-update.${ext}`,
        });
      }
    } else {
      payload = patchSchema.safeParse(await req.json());
    }

    if (!payload.success) {
      return NextResponse.json({ ok: false, error: payload.error.message }, { status: 400 });
    }

    const updated = await updateBusinessNewsByBusiness(payload.data.newsId, businessId, {
      title:
        payload.data.titleEn || payload.data.titleAr
          ? { en: payload.data.titleEn || "", ar: payload.data.titleAr || "" }
          : undefined,
      content:
        payload.data.contentEn || payload.data.contentAr
          ? { en: payload.data.contentEn || "", ar: payload.data.contentAr || "" }
          : undefined,
      linkUrl: payload.data.linkUrl,
      isPublished: payload.data.isPublished,
      imageUrl: imageUrl ?? (payload.data.clearImage ? null : undefined),
    });

    if (!updated) {
      return NextResponse.json({ ok: false, error: "News item not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error: unknown) {
    console.error("[business-news] PATCH error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
