"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { createBusiness, deleteBusiness, updateBusiness } from "@/lib/db/businesses";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getCategoryById } from "@/lib/db/categories";
import { getUserByEmail, getUserById } from "@/lib/db/users";

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

    const business = createBusiness({
      slug: String(formData.get("slug") || ""),
      ownerId,
      name: {
        en: String(formData.get("name_en") || ""),
        ar: String(formData.get("name_ar") || ""),
      },
      description,
      ...categoryPatch,
      city: String(formData.get("city") || "") || undefined,
      address: String(formData.get("address") || "") || undefined,
      phone: String(formData.get("phone") || "") || undefined,
      website: String(formData.get("website") || "") || undefined,
      email: String(formData.get("email") || "") || undefined,
      tags,
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

  const business = createBusiness({
    slug: String(formData.get("slug") || ""),
    ownerId,
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    description,
    ...categoryPatch,
    city: String(formData.get("city") || "") || undefined,
    address: String(formData.get("address") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    website: String(formData.get("website") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    tags,
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

  const next = updateBusiness(id, {
    slug: String(formData.get("slug") || "") || undefined,
    ownerId,
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    description,
    ...categoryPatch,
    city: String(formData.get("city") || "") || undefined,
    address: String(formData.get("address") || "") || undefined,
    phone: String(formData.get("phone") || "") || undefined,
    website: String(formData.get("website") || "") || undefined,
    email: String(formData.get("email") || "") || undefined,
    tags,
  });

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
