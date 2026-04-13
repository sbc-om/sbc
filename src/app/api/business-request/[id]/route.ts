import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getBusinessRequestById,
  updateBusinessRequest,
  setBusinessRequestMedia,
} from "@/lib/db/businessRequests";
import { checkBusinessUsernameAvailability } from "@/lib/db/businesses";
import { storeRequestUpload } from "@/lib/uploads/storage";

export const runtime = "nodejs";

/** GET a single business request (owner only) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const request = await getBusinessRequestById(id);
    if (!request || request.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, request });
  } catch (error) {
    console.error("Get business request error:", error);
    return NextResponse.json(
      { error: "Failed to get request" },
      { status: 500 },
    );
  }
}

/** PUT — update a business request (owner only, when pending or revision_requested) */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getBusinessRequestById(id);
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (existing.status !== "pending" && existing.status !== "revision_requested") {
      return NextResponse.json(
        { error: "Cannot edit a request that has already been processed" },
        { status: 403 },
      );
    }

    const fd = await req.formData();

    const str = (key: string) => {
      const v = fd.get(key);
      return typeof v === "string" ? v : "";
    };
    const num = (key: string) => {
      const v = fd.get(key);
      if (typeof v === "string" && v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      }
      return undefined;
    };

    const username = str("username").trim().toLowerCase();
    if (username) {
      if (username.length <= 5) {
        return NextResponse.json({ error: "USERNAME_TOO_SHORT" }, { status: 400 });
      }
      const availability = await checkBusinessUsernameAvailability(username);
      if (!availability.available) {
        return NextResponse.json(
          { error: availability.reason === "INVALID" ? "USERNAME_INVALID" : "USERNAME_TAKEN" },
          { status: 400 },
        );
      }
    }

    const updated = await updateBusinessRequest(id, {
      username: username || undefined,
      businessName: str("name_en") || str("businessName"),
      nameEn: str("name_en") || str("nameEn"),
      nameAr: str("name_ar") || str("nameAr"),
      descEn: str("desc_en") || str("descEn"),
      descAr: str("desc_ar") || str("descAr"),
      categoryId: str("categoryId") || undefined,
      city: str("city") || undefined,
      address: str("address") || undefined,
      phone: str("phone") || undefined,
      email: str("email") || undefined,
      website: str("website") || undefined,
      tags: str("tags") || undefined,
      latitude: num("latitude"),
      longitude: num("longitude"),
    });

    // Handle file uploads + existing URLs
    const logoFile = fd.get("logo") as File | null;
    const coverFile = fd.get("cover") as File | null;
    const bannerFile = fd.get("banner") as File | null;
    const galleryFiles = fd.getAll("gallery").filter((f): f is File => f instanceof File && f.size > 0);

    // Existing server URLs kept by the client
    const existingLogoUrl = fd.get("existingLogoUrl") as string | null;
    const existingCoverUrl = fd.get("existingCoverUrl") as string | null;
    const existingBannerUrl = fd.get("existingBannerUrl") as string | null;
    const existingGalleryUrls = fd.getAll("existingGalleryUrls").filter((v): v is string => typeof v === "string" && v.startsWith("/media/"));

    let logoUrl: string | undefined;
    let coverUrl: string | undefined;
    let bannerUrl: string | undefined;
    const galleryUrls: string[] = [];

    if (logoFile && logoFile.size > 0) {
      const r = await storeRequestUpload({ requestId: id, kind: "logo", file: logoFile });
      logoUrl = r.url;
    } else if (existingLogoUrl) {
      logoUrl = existingLogoUrl;
    }

    if (coverFile && coverFile.size > 0) {
      const r = await storeRequestUpload({ requestId: id, kind: "cover", file: coverFile });
      coverUrl = r.url;
    } else if (existingCoverUrl) {
      coverUrl = existingCoverUrl;
    }

    if (bannerFile && bannerFile.size > 0) {
      const r = await storeRequestUpload({ requestId: id, kind: "banner", file: bannerFile });
      bannerUrl = r.url;
    } else if (existingBannerUrl) {
      bannerUrl = existingBannerUrl;
    }

    // Keep existing gallery images + add new ones
    galleryUrls.push(...existingGalleryUrls);
    for (const gf of galleryFiles) {
      const r = await storeRequestUpload({ requestId: id, kind: "gallery", file: gf });
      galleryUrls.push(r.url);
    }

    // Always update media to reflect current state (handles removals too)
    await setBusinessRequestMedia(id, {
      logoUrl: logoUrl ?? null,
      coverUrl: coverUrl ?? null,
      bannerUrl: bannerUrl ?? null,
      galleryUrls,
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    console.error("Update business request error:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 },
    );
  }
}
