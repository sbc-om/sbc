"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import {
  approveBusinessComment,
  createBusinessComment,
  deleteBusinessComment,
  rejectBusinessComment,
  toggleBusinessLike,
} from "@/lib/db/businessEngagement";

function canModerate(user: { id: string; role: string }, business: ReturnType<typeof getBusinessById>) {
  if (!user || !business) return false;
  if (user.role === "admin") return true;
  return !!business.ownerId && business.ownerId === user.id;
}

export async function toggleBusinessLikeAction(locale: Locale, businessId: string, businessSlug: string) {
  const user = await requireUser(locale);
  const result = toggleBusinessLike({ userId: user.id, businessId });
  revalidatePath(`/${locale}/explorer/${businessSlug}`);
  return result;
}

export async function createBusinessCommentAction(locale: Locale, businessId: string, businessSlug: string, text: string) {
  const user = await requireUser(locale);
  const comment = createBusinessComment({ businessId, userId: user.id, text });
  revalidatePath(`/${locale}/explorer/${businessSlug}`);
  return comment;
}

export async function approveBusinessCommentAction(
  locale: Locale,
  businessId: string,
  businessSlug: string,
  commentId: string,
) {
  const user = await requireUser(locale);
  const business = getBusinessById(businessId);
  if (!canModerate(user, business)) throw new Error("UNAUTHORIZED");

  const updated = approveBusinessComment({ businessId, commentId, moderatedByUserId: user.id });
  revalidatePath(`/${locale}/explorer/${businessSlug}`);
  return updated;
}

export async function rejectBusinessCommentAction(
  locale: Locale,
  businessId: string,
  businessSlug: string,
  commentId: string,
) {
  const user = await requireUser(locale);
  const business = getBusinessById(businessId);
  if (!canModerate(user, business)) throw new Error("UNAUTHORIZED");

  const updated = rejectBusinessComment({ businessId, commentId, moderatedByUserId: user.id });
  revalidatePath(`/${locale}/explorer/${businessSlug}`);
  return updated;
}

export async function deleteBusinessCommentAction(
  locale: Locale,
  businessId: string,
  businessSlug: string,
  commentId: string,
) {
  const user = await requireUser(locale);
  const business = getBusinessById(businessId);
  if (!canModerate(user, business)) throw new Error("UNAUTHORIZED");

  deleteBusinessComment({ businessId, commentId });
  revalidatePath(`/${locale}/explorer/${businessSlug}`);
  return { ok: true };
}
