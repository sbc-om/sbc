"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { 
  createBusiness, 
  deleteBusiness, 
  updateBusiness, 
  getBusinessById,
  setBusinessSingleMedia,
  addBusinessMedia
} from "@/lib/db/businesses";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getCategoryById } from "@/lib/db/categories";
import { getUserByEmail, getUserById } from "@/lib/db/users";
import { storeUpload } from "@/lib/uploads/storage";

function readBoolean(formData: FormData, key: string): boolean {
  const raw = String(formData.get(key) ?? "").trim().toLowerCase();
  return raw === "on" || raw === "true" || raw === "1" || raw === "yes";
}

function resolveOwnerFromFormData(formData: FormData): { ownerId: string | undefined } {
  const ownerIdRaw = String(formData.get("ownerId") || "").trim();
  if (ownerIdRaw) {
    const user = getUserById(ownerIdRaw);
    if (!user) throw new Error("OWNER_NOT_FOUND");
    return { ownerId: user.id };
  }

  // Backward compatibility (and manual entry fallback).
  const ownerEmail = String(formData.get("ownerEmail") || "").trim();
  if (ownerEmail) {
    const user = getUserByEmail(ownerEmail);
    if (!user) {
      const looksValid = ownerEmail.includes("@");
      throw new Error(looksValid ? "OWNER_NOT_FOUND" : "OWNER_EMAIL_INVALID");
    }
    return { ownerId: user.id };
  }

  // Empty means: clear owner.
  return { ownerId: undefined };
}

function deriveLegacyCategoryText(categoryId: string | null) {
  if (!categoryId) return { categoryId: undefined, category: undefined };
  const cat = getCategoryById(categoryId);
  if (!cat) throw new Error("INVALID_CATEGORY");
  // Keep legacy string populated for search/backward compatibility.
  return { categoryId, category: `${cat.name.en} ${cat.name.ar}` };
}

export type CreateBusinessDraftResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createBusinessDraftAction(
  locale: Locale,
  _prevState: CreateBusinessDraftResult | null,
  formData: FormData,
): Promise<CreateBusinessDraftResult> {
  await requireAdmin(locale);

  try {
    const descEn = String(formData.get("desc_en") || "").trim();
    const descAr = String(formData.get("desc_ar") || "").trim();
    const description = descEn && descAr ? { en: descEn, ar: descAr } : undefined;

    const tagsRaw = String(formData.get("tags") || "").trim();
    const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

    const categoryIdRaw = String(formData.get("categoryId") || "").trim();
    const categoryId = categoryIdRaw || null;
    const categoryPatch = deriveLegacyCategoryText(categoryId);

    const { ownerId } = resolveOwnerFromFormData(formData);
    const homepageTop = readBoolean(formData, "homepageTop");
    const homepageFeatured = homepageTop || readBoolean(formData, "homepageFeatured");
    const isVerified = readBoolean(formData, "isVerified");
    const isSpecial = readBoolean(formData, "isSpecial");

    // Parse location coordinates
    const latitudeRaw = String(formData.get("latitude") || "").trim();
    const longitudeRaw = String(formData.get("longitude") || "").trim();
    const latitude = latitudeRaw ? parseFloat(latitudeRaw) : undefined;
    const longitude = longitudeRaw ? parseFloat(longitudeRaw) : undefined;

    const avatarModeRaw = String(formData.get("avatarMode") || "").trim();
    const avatarMode = avatarModeRaw === "logo" ? "logo" : "icon";

    const business = createBusiness({
      slug: String(formData.get("slug") || ""),
      ownerId,
      name: {
        en: String(formData.get("name_en") || ""),
        ar: String(formData.get("name_ar") || ""),
      },
      description,
      isVerified,
      isSpecial,
      homepageFeatured,
      homepageTop,
      ...categoryPatch,
      city: String(formData.get("city") || "") || undefined,
      address: String(formData.get("address") || "") || undefined,
      phone: String(formData.get("phone") || "") || undefined,
      website: String(formData.get("website") || "") || undefined,
      email: String(formData.get("email") || "") || undefined,
      latitude,
      longitude,
      tags,
      avatarMode,
    });

    revalidatePath(`/${locale}/businesses`);
    revalidatePath(`/${locale}/businesses/${business.slug}`);
    revalidatePath(`/${locale}/admin`);

    return { ok: true, id: business.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "CREATE_FAILED";
    return { ok: false, error: message };
  }
}

export async function createBusinessAction(locale: Locale, formData: FormData) {
  await requireAdmin(locale);

  const descEn = String(formData.get("desc_en") || "").trim();
  const descAr = String(formData.get("desc_ar") || "").trim();
  const description = descEn && descAr ? { en: descEn, ar: descAr } : undefined;

  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  const categoryIdRaw = String(formData.get("categoryId") || "").trim();
  const categoryId = categoryIdRaw || null;
  const categoryPatch = deriveLegacyCategoryText(categoryId);

  const { ownerId } = resolveOwnerFromFormData(formData);
  const homepageTop = readBoolean(formData, "homepageTop");
  const homepageFeatured = homepageTop || readBoolean(formData, "homepageFeatured");
  const isVerified = readBoolean(formData, "isVerified");
  const isSpecial = readBoolean(formData, "isSpecial");

  // Parse location coordinates
  const latitudeRaw = String(formData.get("latitude") || "").trim();
  const longitudeRaw = String(formData.get("longitude") || "").trim();
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : undefined;

  const avatarModeRaw = String(formData.get("avatarMode") || "").trim();
  const avatarMode = avatarModeRaw === "logo" ? "logo" : "icon";

  const business = createBusiness({
    slug: String(formData.get("slug") || ""),
    ownerId,
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    description,
    isVerified,
    isSpecial,
    homepageFeatured,
    homepageTop,
    ...categoryPatch,
    city: String(formData.get("city") || "") || undefined,
    address: String(formData.get("address") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    website: String(formData.get("website") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    latitude,
    longitude,
    tags,
    avatarMode,
  });

  revalidatePath(`/${locale}/businesses`);
  revalidatePath(`/${locale}/businesses/${business.slug}`);
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin/${business.id}/edit`);
}

export async function updateBusinessAction(locale: Locale, id: string, formData: FormData) {
  await requireAdmin(locale);

  const descEn = String(formData.get("desc_en") || "").trim();
  const descAr = String(formData.get("desc_ar") || "").trim();
  const description = descEn && descAr ? { en: descEn, ar: descAr } : undefined;

  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  const categoryIdRaw = String(formData.get("categoryId") || "").trim();
  const categoryId = categoryIdRaw || null;
  const categoryPatch = deriveLegacyCategoryText(categoryId);

  const { ownerId } = resolveOwnerFromFormData(formData);
  const homepageTop = readBoolean(formData, "homepageTop");
  const homepageFeatured = homepageTop || readBoolean(formData, "homepageFeatured");
  const isVerified = readBoolean(formData, "isVerified");
  const isSpecial = readBoolean(formData, "isSpecial");

  // Parse location coordinates
  const latitudeRaw = String(formData.get("latitude") || "").trim();
  const longitudeRaw = String(formData.get("longitude") || "").trim();
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : undefined;

  const avatarModeRaw = String(formData.get("avatarMode") || "").trim();
  const avatarMode = avatarModeRaw === "logo" ? "logo" : "icon";

  // First update the business basic info
  let next = updateBusiness(id, {
    slug: String(formData.get("slug") || "") || undefined,
    ownerId,
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    description,
    isVerified,
    isSpecial,
    homepageFeatured,
    homepageTop,
    ...categoryPatch,
    city: String(formData.get("city") || "") || undefined,
    address: String(formData.get("address") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    website: String(formData.get("website") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    latitude,
    longitude,
    tags,
    avatarMode,
  });

  // Process and upload images
  const coverFile = formData.get("coverImage") as File | null;
  if (coverFile && coverFile.size > 0) {
    const result = await storeUpload({ businessId: id, kind: "cover", file: coverFile });
    next = setBusinessSingleMedia(id, "cover", result.url);
  }

  const logoFile = formData.get("logoImage") as File | null;
  if (logoFile && logoFile.size > 0) {
    const result = await storeUpload({ businessId: id, kind: "logo", file: logoFile });
    next = setBusinessSingleMedia(id, "logo", result.url);
  }

  const bannerFile = formData.get("bannerImage") as File | null;
  if (bannerFile && bannerFile.size > 0) {
    const result = await storeUpload({ businessId: id, kind: "banner", file: bannerFile });
    next = setBusinessSingleMedia(id, "banner", result.url);
  }

  // Process gallery images (multiple files)
  const galleryFiles = formData.getAll("galleryImages") as File[];
  if (galleryFiles.length > 0) {
    const galleryUrls = await Promise.all(
      galleryFiles
        .filter(file => file.size > 0)
        .map(file => storeUpload({ businessId: id, kind: "gallery", file }))
    );
    next = addBusinessMedia(id, "gallery", galleryUrls.map(r => r.url));
  }

  revalidatePath(`/${locale}/businesses`);
  revalidatePath(`/${locale}/businesses/${next.slug}`);
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin`);
}

export async function deleteBusinessAction(locale: Locale, id: string) {
  await requireAdmin(locale);
  deleteBusiness(id);
  revalidatePath(`/${locale}/businesses`);
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin`);
}
