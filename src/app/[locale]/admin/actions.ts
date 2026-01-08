"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { createBusiness, deleteBusiness, updateBusiness } from "@/lib/db/businesses";
import { requireAdmin } from "@/lib/auth/requireUser";

export async function createBusinessAction(locale: Locale, formData: FormData) {
  await requireAdmin(locale);

  const descEn = String(formData.get("desc_en") || "").trim();
  const descAr = String(formData.get("desc_ar") || "").trim();
  const description = descEn && descAr ? { en: descEn, ar: descAr } : undefined;

  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  const business = createBusiness({
    slug: String(formData.get("slug") || ""),
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    description,
    category: String(formData.get("category") || "") || undefined,
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
  redirect(`/${locale}/admin`);
}

export async function updateBusinessAction(locale: Locale, id: string, formData: FormData) {
  await requireAdmin(locale);

  const descEn = String(formData.get("desc_en") || "").trim();
  const descAr = String(formData.get("desc_ar") || "").trim();
  const description = descEn && descAr ? { en: descEn, ar: descAr } : undefined;

  const tagsRaw = String(formData.get("tags") || "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

  const next = updateBusiness(id, {
    slug: String(formData.get("slug") || "") || undefined,
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    description,
    category: String(formData.get("category") || "") || undefined,
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
