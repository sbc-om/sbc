"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { followCategory, unfollowCategory } from "@/lib/db/follows";

export async function followCategoryAction(locale: Locale, categoryId: string) {
  const user = await requireUser(locale);
  await followCategory(user.id, categoryId);
  revalidatePath(`/${locale}/categories`);
  revalidatePath(`/${locale}/home`);
}

export async function unfollowCategoryAction(locale: Locale, categoryId: string) {
  const user = await requireUser(locale);
  await unfollowCategory(user.id, categoryId);
  revalidatePath(`/${locale}/categories`);
  revalidatePath(`/${locale}/home`);
}
