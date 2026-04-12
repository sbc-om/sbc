import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/requireUser";
import { countProgramSubscriptions } from "@/lib/db/subscriptions";
import { createBusinessRequest, updateBusinessRequestMedia, listBusinessRequestsByUser } from "@/lib/db/businessRequests";
import { checkBusinessUsernameAvailability, listBusinessesByOwner } from "@/lib/db/businesses";
import { storeRequestUpload } from "@/lib/uploads/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser("en");

    // Each business requires its own directory package
    const [totalPackages, ownedBusinesses, requests] = await Promise.all([
      countProgramSubscriptions(user.id, "directory"),
      listBusinessesByOwner(user.id),
      listBusinessRequestsByUser(user.id),
    ]);
    const pendingRequests = requests.filter((r) => r.status === "pending");
    const used = ownedBusinesses.length + pendingRequests.length;
    if (totalPackages === 0 || used >= totalPackages) {
      return NextResponse.json(
        { error: "NO_ACTIVE_SUBSCRIPTION" },
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

    const request = await createBusinessRequest({
      userId: user.id,
      businessName: str("name_en") || str("businessName") || str("name"),
      nameEn: str("name_en") || str("nameEn"),
      nameAr: str("name_ar") || str("nameAr"),
      descEn: str("desc_en") || str("descEn"),
      descAr: str("desc_ar") || str("descAr"),
      description: str("description"),
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

    // Handle file uploads
    const logoFile = fd.get("logo") as File | null;
    const coverFile = fd.get("cover") as File | null;
    const bannerFile = fd.get("banner") as File | null;
    const galleryFiles = fd.getAll("gallery").filter((f): f is File => f instanceof File && f.size > 0);

    let logoUrl: string | undefined;
    let coverUrl: string | undefined;
    let bannerUrl: string | undefined;
    const galleryUrls: string[] = [];

    if (logoFile && logoFile.size > 0) {
      const r = await storeRequestUpload({ requestId: request.id, kind: "logo", file: logoFile });
      logoUrl = r.url;
    }
    if (coverFile && coverFile.size > 0) {
      const r = await storeRequestUpload({ requestId: request.id, kind: "cover", file: coverFile });
      coverUrl = r.url;
    }
    if (bannerFile && bannerFile.size > 0) {
      const r = await storeRequestUpload({ requestId: request.id, kind: "banner", file: bannerFile });
      bannerUrl = r.url;
    }
    for (const gf of galleryFiles) {
      const r = await storeRequestUpload({ requestId: request.id, kind: "gallery", file: gf });
      galleryUrls.push(r.url);
    }

    if (logoUrl || coverUrl || bannerUrl || galleryUrls.length > 0) {
      await updateBusinessRequestMedia(request.id, { logoUrl, coverUrl, bannerUrl, galleryUrls: galleryUrls.length > 0 ? galleryUrls : undefined });
    }

    return NextResponse.json(request);
  } catch (error: unknown) {
    console.error("Business request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit request" },
      { status: 400 },
    );
  }
}
