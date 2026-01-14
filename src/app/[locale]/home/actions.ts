"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import {
  toggleBusinessLike,
  toggleBusinessSave,
} from "@/lib/db/businessEngagement";

export async function toggleBusinessLikeAction(
  locale: Locale,
  businessId: string
) {
  const user = await requireUser(locale);
  const result = toggleBusinessLike({ userId: user.id, businessId });
  revalidatePath(`/${locale}/home`);
  return result;
}

export async function toggleBusinessSaveAction(
  locale: Locale,
  businessId: string
) {
  const user = await requireUser(locale);
  const result = toggleBusinessSave({ userId: user.id, businessId });
  revalidatePath(`/${locale}/home`);
  return result;
}
