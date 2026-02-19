"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { 
  createBusiness, 
  deleteBusiness, 
  updateBusiness, 
  getBusinessById,
  setBusinessMedia,
  setBusinessCustomDomain,
} from "@/lib/db/businesses";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getCategoryById } from "@/lib/db/categories";
import { getUserByEmail, getUserById } from "@/lib/db/users";
import { storeUpload } from "@/lib/uploads/storage";

function readBoolean(formData: FormData, key: string): boolean {
  const raw = String(formData.get(key) ?? "").trim().toLowerCase();
  return raw === "on" || raw === "true" || raw === "1" || raw === "yes";
}

async function resolveOwnerFromFormData(formData: FormData): Promise<{ ownerId: string | undefined }> {
  const ownerIdRaw = String(formData.get("ownerId") || "").trim();
  if (ownerIdRaw) {
    const user = await getUserById(ownerIdRaw);
    if (!user) throw new Error("OWNER_NOT_FOUND");
    return { ownerId: user.id };
  }

  // Backward compatibility (and manual entry fallback).
  const ownerEmail = String(formData.get("ownerEmail") || "").trim();
  if (ownerEmail) {
    const user = await getUserByEmail(ownerEmail);
    if (!user) {
      const looksValid = ownerEmail.includes("@");
      throw new Error(looksValid ? "OWNER_NOT_FOUND" : "OWNER_EMAIL_INVALID");
    }
    return { ownerId: user.id };
  }

  // Empty means: clear owner.
  return { ownerId: undefined };
}

async function deriveLegacyCategoryText(categoryId: string | null) {
  if (!categoryId) return { categoryId: undefined, category: undefined };
  const cat = await getCategoryById(categoryId);
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
    const categoryPatch = await deriveLegacyCategoryText(categoryId);

    const { ownerId } = await resolveOwnerFromFormData(formData);
    const homepageTop = readBoolean(formData, "homepageTop");
    const homepageFeatured = homepageTop || readBoolean(formData, "homepageFeatured");
    const isApproved = readBoolean(formData, "isApproved");
    const isVerified = readBoolean(formData, "isVerified");
    const isSpecial = readBoolean(formData, "isSpecial");

    // Parse location coordinates
    const latitudeRaw = String(formData.get("latitude") || "").trim();
    const longitudeRaw = String(formData.get("longitude") || "").trim();
    const latitude = latitudeRaw ? parseFloat(latitudeRaw) : undefined;
    const longitude = longitudeRaw ? parseFloat(longitudeRaw) : undefined;

    const avatarModeRaw = String(formData.get("avatarMode") || "").trim();
    const avatarMode = avatarModeRaw === "logo" ? "logo" : "icon";

    const business = await createBusiness({
      slug: String(formData.get("slug") || ""),
      ownerId,
      name: {
        en: String(formData.get("name_en") || ""),
        ar: String(formData.get("name_ar") || ""),
      },
      description,
      isApproved,
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
  const categoryPatch = await deriveLegacyCategoryText(categoryId);

  const { ownerId } = await resolveOwnerFromFormData(formData);
  const homepageTop = readBoolean(formData, "homepageTop");
  const homepageFeatured = homepageTop || readBoolean(formData, "homepageFeatured");
  const isApproved = readBoolean(formData, "isApproved");
  const isVerified = readBoolean(formData, "isVerified");
  const isSpecial = readBoolean(formData, "isSpecial");

  // Parse location coordinates
  const latitudeRaw = String(formData.get("latitude") || "").trim();
  const longitudeRaw = String(formData.get("longitude") || "").trim();
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : undefined;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : undefined;

  const avatarModeRaw = String(formData.get("avatarMode") || "").trim();
  const avatarMode = avatarModeRaw === "logo" ? "logo" : "icon";
  const showSimilarBusinessesRaw = String(formData.get("showSimilarBusinesses") || "").trim();
  const showSimilarBusinesses = showSimilarBusinessesRaw === "true";

  const usernameRaw = String(formData.get("username") || "").trim();
  const username = usernameRaw ? usernameRaw.toLowerCase() : undefined;
  const customDomainRaw = String(formData.get("customDomain") || "").trim().toLowerCase();
  const customDomain = customDomainRaw || null;

  let business = await createBusiness({
    slug: String(formData.get("slug") || ""),
    username,
    ownerId,
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    description,
    isApproved,
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
    showSimilarBusinesses,
  });

  const coverFile = formData.get("coverImage") as File | null;
  if (coverFile && coverFile.size > 0) {
    const result = await storeUpload({ businessId: business.id, kind: "cover", file: coverFile });
    business = await setBusinessMedia(business.id, "cover", result.url);
  }

  const logoFile = formData.get("logoImage") as File | null;
  if (logoFile && logoFile.size > 0) {
    const result = await storeUpload({ businessId: business.id, kind: "logo", file: logoFile });
    business = await setBusinessMedia(business.id, "logo", result.url);
  }

  const bannerFile = formData.get("bannerImage") as File | null;
  if (bannerFile && bannerFile.size > 0) {
    const result = await storeUpload({ businessId: business.id, kind: "banner", file: bannerFile });
    business = await setBusinessMedia(business.id, "banner", result.url);
  }

  const galleryFiles = formData.getAll("galleryImages") as File[];
  if (galleryFiles.length > 0) {
    const galleryUrls = await Promise.all(
      galleryFiles
        .filter((file) => file.size > 0)
        .map((file) => storeUpload({ businessId: business.id, kind: "gallery", file }))
    );
    if (galleryUrls.length > 0) {
      business = await setBusinessMedia(
        business.id,
        "gallery",
        galleryUrls.map((r) => r.url)
      );
    }
  }

  if (customDomain) {
    business = await setBusinessCustomDomain(business.id, customDomain);
  }

  revalidatePath(`/${locale}/businesses`);
  revalidatePath(`/${locale}/businesses/${business.slug}`);
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin/${business.id}/edit`);
}

export async function updateBusinessAction(locale: Locale, id: string, formData: FormData) {
  await requireAdmin(locale);

  const current = await getBusinessById(id);
  if (!current) throw new Error("NOT_FOUND");

  const descEn = String(formData.get("desc_en") || "").trim();
  const descAr = String(formData.get("desc_ar") || "").trim();
  const description = descEn && descAr
    ? { en: descEn, ar: descAr }
    : current.description;

  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw
    ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : current.tags;

  const categoryIdRaw = String(formData.get("categoryId") || "").trim();
  const categoryId = categoryIdRaw || current.categoryId || null;
  const categoryPatch = await deriveLegacyCategoryText(categoryId);

  const { ownerId } = await resolveOwnerFromFormData(formData);
  const homepageTop = formData.has("homepageTop")
    ? readBoolean(formData, "homepageTop")
    : !!current.homepageTop;
  const homepageFeatured = homepageTop || (
    formData.has("homepageFeatured")
      ? readBoolean(formData, "homepageFeatured")
      : !!current.homepageFeatured
  );
  const isApproved = formData.has("isApproved")
    ? readBoolean(formData, "isApproved")
    : !!current.isApproved;
  const isVerified = formData.has("isVerified")
    ? readBoolean(formData, "isVerified")
    : !!current.isVerified;
  const isSpecial = formData.has("isSpecial")
    ? readBoolean(formData, "isSpecial")
    : !!current.isSpecial;

  // Parse location coordinates
  const latitudeRaw = String(formData.get("latitude") || "").trim();
  const longitudeRaw = String(formData.get("longitude") || "").trim();
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : current.latitude;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : current.longitude;

  const avatarModeRaw = String(formData.get("avatarMode") || "").trim();
  const avatarMode = avatarModeRaw
    ? avatarModeRaw === "logo" ? "logo" : "icon"
    : (current.avatarMode ?? "icon");

  const showSimilarBusinessesRaw = String(formData.get("showSimilarBusinesses") || "").trim();
  const showSimilarBusinesses = showSimilarBusinessesRaw
    ? showSimilarBusinessesRaw === "true"
    : current.showSimilarBusinesses !== false;

  const usernameRaw = String(formData.get("username") || "").trim();
  const username = usernameRaw
    ? usernameRaw.toLowerCase()
    : current.username;

  const slugRaw = String(formData.get("slug") || "").trim();
  const slug = slugRaw || current.slug;

  const nameEnRaw = String(formData.get("name_en") || "").trim();
  const nameArRaw = String(formData.get("name_ar") || "").trim();
  const name = {
    en: nameEnRaw || current.name.en,
    ar: nameArRaw || current.name.ar,
  };

  const cityRaw = String(formData.get("city") || "").trim();
  const addressRaw = String(formData.get("address") || "").trim();
  const phoneRaw = String(formData.get("phone") || "").trim();
  const websiteRaw = String(formData.get("website") || "").trim();
  const emailRaw = String(formData.get("email") || "").trim();

  // First update the business basic info
  let next = await updateBusiness(id, {
    slug,
    username,
    ownerId: ownerId ?? current.ownerId,
    name,
    description,
    isApproved,
    isVerified,
    isSpecial,
    homepageFeatured,
    homepageTop,
    ...categoryPatch,
    city: cityRaw || current.city,
    address: addressRaw || current.address,
    phone: phoneRaw || current.phone,
    website: websiteRaw || current.website,
    email: emailRaw || current.email,
    latitude,
    longitude,
    tags,
    avatarMode,
    showSimilarBusinesses,
  });

  // Process and upload images
  const coverFile = formData.get("coverImage") as File | null;
  if (coverFile && coverFile.size > 0) {
    const result = await storeUpload({ businessId: id, kind: "cover", file: coverFile });
    next = await setBusinessMedia(id, "cover", result.url);
  }

  const logoFile = formData.get("logoImage") as File | null;
  if (logoFile && logoFile.size > 0) {
    const result = await storeUpload({ businessId: id, kind: "logo", file: logoFile });
    next = await setBusinessMedia(id, "logo", result.url);
  }

  const bannerFile = formData.get("bannerImage") as File | null;
  if (bannerFile && bannerFile.size > 0) {
    const result = await storeUpload({ businessId: id, kind: "banner", file: bannerFile });
    next = await setBusinessMedia(id, "banner", result.url);
  }

  // Process gallery images (multiple files)
  const galleryFiles = formData.getAll("galleryImages") as File[];
  if (galleryFiles.length > 0) {
    const galleryUrls = await Promise.all(
      galleryFiles
        .filter(file => file.size > 0)
        .map(file => storeUpload({ businessId: id, kind: "gallery", file }))
    );
    next = await setBusinessMedia(id, "gallery", galleryUrls.map(r => r.url));
  }

  revalidatePath(`/${locale}/businesses`);
  revalidatePath(`/${locale}/businesses/${next.slug}`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/businesses`);
  redirect(`/${locale}/admin/businesses`);
}

export async function deleteBusinessAction(locale: Locale, id: string) {
  await requireAdmin(locale);
  await deleteBusiness(id);
  revalidatePath(`/${locale}/businesses`);
  revalidatePath(`/${locale}/admin`);
  redirect(`/${locale}/admin`);
}

export async function approveBusinessAction(locale: Locale, id: string) {
  await requireAdmin(locale);
  const business = await getBusinessById(id);
  if (!business) throw new Error("NOT_FOUND");
  await updateBusiness(id, { isApproved: true });
  revalidatePath(`/${locale}/businesses`);
  revalidatePath(`/${locale}/businesses/${business.slug}`);
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/businesses`);
}
