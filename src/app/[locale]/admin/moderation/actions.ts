"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/requireUser";
import { moderateBusinessInstagramPage } from "@/lib/db/businesses";
import { moderateBusinessNews, moderateBusinessProduct } from "@/lib/db/businessContent";
import { moderateStory } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";

export async function moderateBusinessNewsAction(
  locale: Locale,
  newsId: string,
  status: "approved" | "rejected",
) {
  const admin = await requireAdmin(locale);
  await moderateBusinessNews(newsId, status, admin.id);
  revalidatePath(`/${locale}/admin/moderation/news`);
  revalidatePath(`/${locale}/admin`);
}

export async function moderateBusinessProductAction(
  locale: Locale,
  productId: string,
  status: "approved" | "rejected",
) {
  const admin = await requireAdmin(locale);
  await moderateBusinessProduct(productId, status, admin.id);
  revalidatePath(`/${locale}/admin/moderation/products`);
  revalidatePath(`/${locale}/admin`);
}

export async function moderateStoryAction(
  locale: Locale,
  storyId: string,
  status: "approved" | "rejected",
) {
  const admin = await requireAdmin(locale);
  await moderateStory(storyId, status, admin.id);
  revalidatePath(`/${locale}/admin/moderation/stories`);
  revalidatePath(`/${locale}/admin`);
}

export async function moderateBusinessInstagramAction(
  locale: Locale,
  businessId: string,
  status: "approved" | "rejected",
) {
  const admin = await requireAdmin(locale);
  await moderateBusinessInstagramPage(businessId, status, admin.id);
  revalidatePath(`/${locale}/admin/moderation/instagram`);
  revalidatePath(`/${locale}/admin`);
}
