"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { requireAdmin } from "@/lib/auth/requireUser";
import { createCategory, deleteCategory, updateCategory } from "@/lib/db/categories";

export async function createCategoryAction(locale: Locale, formData: FormData) {
  await requireAdmin(locale);

  const category = createCategory({
    slug: String(formData.get("slug") || ""),
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
  });

  revalidatePath(`/${locale}/admin/categories`);
  redirect(`/${locale}/admin/categories/${category.id}/edit`);
}

export async function updateCategoryAction(locale: Locale, id: string, formData: FormData) {
  await requireAdmin(locale);

  updateCategory(id, {
    slug: String(formData.get("slug") || "") || undefined,
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
  });

  revalidatePath(`/${locale}/admin/categories`);
  redirect(`/${locale}/admin/categories`);
}

export async function deleteCategoryAction(locale: Locale, id: string) {
  await requireAdmin(locale);

  try {
    deleteCategory(id);
    revalidatePath(`/${locale}/admin/categories`);
    redirect(`/${locale}/admin/categories`);
  } catch (e) {
    const message = e instanceof Error ? e.message : "DELETE_FAILED";
    revalidatePath(`/${locale}/admin/categories`);
    redirect(`/${locale}/admin/categories?error=${encodeURIComponent(message)}`);
  }
}
