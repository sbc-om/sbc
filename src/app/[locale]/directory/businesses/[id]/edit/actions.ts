"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import {
  addBusinessMedia,
  getBusinessById,
  setBusinessSingleMedia,
  updateBusiness,
} from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { storeUpload } from "@/lib/uploads/storage";

function deriveLegacyCategoryText(categoryId: string | null) {
  if (!categoryId) return { categoryId: undefined, category: undefined };
  const cat = getCategoryById(categoryId);
  if (!cat) throw new Error("INVALID_CATEGORY");
  return { categoryId, category: `${cat.name.en} ${cat.name.ar}` };
}

export async function updateOwnerBusinessAction(
  locale: Locale,
  businessId: string,
  formData: FormData,
) {
  const user = await requireUser(locale);
  const business = getBusinessById(businessId);
  if (!business || business.ownerId !== user.id) {
    throw new Error("UNAUTHORIZED");
  }

  const nameEn = String(formData.get("name_en") || "").trim();
  const nameAr = String(formData.get("name_ar") || "").trim();

  const descEn = String(formData.get("desc_en") || "").trim();
  const descAr = String(formData.get("desc_ar") || "").trim();
  const description = descEn && descAr ? { en: descEn, ar: descAr } : undefined;

  const categoryIdRaw = String(formData.get("categoryId") || "").trim();
  const categoryId = categoryIdRaw || null;
  const categoryPatch = deriveLegacyCategoryText(categoryId);

  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  const latitudeRaw = String(formData.get("latitude") || "").trim();
  const longitudeRaw = String(formData.get("longitude") || "").trim();
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : undefined;

  const avatarModeRaw = String(formData.get("avatarMode") || "").trim();
  const avatarMode = avatarModeRaw === "logo" ? "logo" : "icon";

  const usernameRaw = String(formData.get("username") || "").trim();
  const username = usernameRaw ? usernameRaw.toLowerCase() : undefined;

  let next = updateBusiness(business.id, {
    slug: String(formData.get("slug") || "").trim() || undefined,
    username,
    name: { en: nameEn || business.name.en, ar: nameAr || business.name.ar },
    description,
    ...categoryPatch,
    city: String(formData.get("city") || "").trim() || undefined,
    address: String(formData.get("address") || "").trim() || undefined,
    phone: String(formData.get("phone") || "").trim() || undefined,
    website: String(formData.get("website") || "").trim() || undefined,
    email: String(formData.get("email") || "").trim() || undefined,
    latitude,
    longitude,
    tags,
    avatarMode,
    isApproved: false,
  });

  const coverFile = formData.get("coverImage") as File | null;
  if (coverFile && coverFile.size > 0) {
    const result = await storeUpload({ businessId: business.id, kind: "cover", file: coverFile });
    next = setBusinessSingleMedia(business.id, "cover", result.url);
  }

  const logoFile = formData.get("logoImage") as File | null;
  if (logoFile && logoFile.size > 0) {
    const result = await storeUpload({ businessId: business.id, kind: "logo", file: logoFile });
    next = setBusinessSingleMedia(business.id, "logo", result.url);
  }

  const bannerFile = formData.get("bannerImage") as File | null;
  if (bannerFile && bannerFile.size > 0) {
    const result = await storeUpload({ businessId: business.id, kind: "banner", file: bannerFile });
    next = setBusinessSingleMedia(business.id, "banner", result.url);
  }

  const galleryFiles = formData.getAll("galleryImages") as File[];
  if (galleryFiles.length > 0) {
    const galleryUrls = await Promise.all(
      galleryFiles
        .filter((file) => file.size > 0)
        .map((file) => storeUpload({ businessId: business.id, kind: "gallery", file }))
    );
    next = addBusinessMedia(business.id, "gallery", galleryUrls.map((r) => r.url));
  }

  revalidatePath(`/${locale}/directory/businesses/${business.id}/edit`);
  revalidatePath(`/${locale}/directory`);
  revalidatePath(`/${locale}/businesses/${next.slug}`);
  redirect(`/${locale}/directory/businesses/${business.id}/edit?pending=1`);
}
