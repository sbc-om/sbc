import slugify from "slugify";

import {
  getBusinessRequestById,
  updateBusinessRequestStatus,
} from "@/lib/db/businessRequests";
import { createBusiness, setBusinessMedia } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { getUserById } from "@/lib/db/users";

export async function convertBusinessRequestToBusiness(
  requestId: string,
  options?: { actorUserId?: string; locale?: string },
) {
  const request = await getBusinessRequestById(requestId);
  if (!request) throw new Error("REQUEST_NOT_FOUND");
  if (!request.userId) throw new Error("USER_NOT_FOUND");

  const user = await getUserById(request.userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  let baseSlug = slugify(request.businessName || request.name.en, {
    lower: true,
    strict: true,
    trim: true,
  });
  if (!baseSlug) baseSlug = "business";

  let slug = baseSlug;
  let attempts = 0;

  while (attempts < 100) {
    try {
      let category: string | undefined;
      if (request.categoryId) {
        const cat = await getCategoryById(request.categoryId);
        if (cat) category = `${cat.name.en} | ${cat.name.ar}`;
      }

      const business = await createBusiness({
        slug,
        username: request.username,
        ownerId: request.userId,
        name: { en: request.name.en, ar: request.name.ar },
        description: (request.descEn || request.descAr)
          ? {
              en: request.descEn || request.descAr || "",
              ar: request.descAr || request.descEn || "",
            }
          : request.description
            ? { en: request.description, ar: request.description }
            : undefined,
        category,
        categoryId: request.categoryId,
        city: request.city,
        address: request.address,
        phone: request.phone,
        email: request.email,
        website: request.website,
        latitude: request.latitude,
        longitude: request.longitude,
        tags: request.tags ? request.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : undefined,
        isApproved: true,
      });

      if (request.logoUrl) await setBusinessMedia(business.id, "logo", request.logoUrl);
      if (request.coverUrl) await setBusinessMedia(business.id, "cover", request.coverUrl);
      if (request.bannerUrl) await setBusinessMedia(business.id, "banner", request.bannerUrl);
      if (request.galleryUrls?.length) await setBusinessMedia(business.id, "gallery", request.galleryUrls);

      await updateBusinessRequestStatus(
        requestId,
        "approved",
        options?.locale === "ar"
          ? "تمت الموافقة تلقائياً وتحويل الطلب إلى نشاط تجاري"
          : "Automatically approved and converted to a business",
        options?.actorUserId,
      );

      return business;
    } catch (error) {
      if (error instanceof Error && error.message === "SLUG_TAKEN") {
        attempts += 1;
        slug = `${baseSlug}-${attempts}`;
        continue;
      }
      throw error;
    }
  }

  throw new Error("COULD_NOT_GENERATE_UNIQUE_SLUG");
}