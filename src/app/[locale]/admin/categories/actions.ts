"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { requireAdmin } from "@/lib/auth/requireUser";
import { createCategory, deleteCategory, updateCategory } from "@/lib/db/categories";
import { storeUserUpload, validateUserImageUpload } from "@/lib/uploads/storage";

export async function createCategoryAction(locale: Locale, formData: FormData) {
  await requireAdmin(locale);

  const category = await createCategory({
    slug: String(formData.get("slug") || ""),
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    iconId: String(formData.get("iconId") || "") || undefined,
  });

  const file = formData.get("image");
  if (file && file instanceof File && file.size > 0) {
    validateUserImageUpload({ kind: "avatar", file });
    const stored = await storeUserUpload({
      userId: `categories/${category.id}`,
      kind: "avatar",
      file,
    });
    await updateCategory(category.id, { image: stored.url });
  }

  revalidatePath(`/${locale}/admin/categories`);
  redirect(`/${locale}/admin/categories/${category.id}/edit`);
}

export async function updateCategoryAction(locale: Locale, id: string, formData: FormData) {
  await requireAdmin(locale);

  await updateCategory(id, {
    slug: String(formData.get("slug") || "") || undefined,
    name: {
      en: String(formData.get("name_en") || ""),
      ar: String(formData.get("name_ar") || ""),
    },
    iconId: String(formData.get("iconId") || "") || undefined,
  });

  revalidatePath(`/${locale}/admin/categories`);
  redirect(`/${locale}/admin/categories`);
}

export async function deleteCategoryAction(locale: Locale, id: string) {
  await requireAdmin(locale);

  try {
    await deleteCategory(id);
    revalidatePath(`/${locale}/admin/categories`);
    redirect(`/${locale}/admin/categories`);
  } catch (e) {
    const message = e instanceof Error ? e.message : "DELETE_FAILED";
    revalidatePath(`/${locale}/admin/categories`);
    redirect(`/${locale}/admin/categories?error=${encodeURIComponent(message)}`);
  }
}
