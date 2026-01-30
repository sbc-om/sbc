"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import {
  likeBusiness,
  unlikeBusiness,
  hasUserLikedBusiness,
  saveBusiness,
  unsaveBusiness,
  hasUserSavedBusiness,
  getBusinessLikeCount,
} from "@/lib/db/businessEngagement";

export async function toggleBusinessLikeAction(
  locale: Locale,
  businessId: string
): Promise<{ liked: boolean; count: number }> {
  const user = await requireUser(locale);
  const isLiked = await hasUserLikedBusiness(user.id, businessId);

  if (isLiked) {
    await unlikeBusiness(user.id, businessId);
  } else {
    await likeBusiness(user.id, businessId);
  }

  const count = await getBusinessLikeCount(businessId);
  revalidatePath(`/${locale}/home`);
  return { liked: !isLiked, count };
}

export async function toggleBusinessSaveAction(
  locale: Locale,
  businessId: string
): Promise<{ saved: boolean }> {
  const user = await requireUser(locale);
  const isSaved = await hasUserSavedBusiness(user.id, businessId);

  if (isSaved) {
    await unsaveBusiness(user.id, businessId);
  } else {
    await saveBusiness(user.id, businessId);
  }

  revalidatePath(`/${locale}/home`);
  return { saved: !isSaved };
}
