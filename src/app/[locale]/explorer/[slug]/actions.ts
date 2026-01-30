"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import {
  createBusinessComment,
  deleteComment,
  likeBusiness,
  unlikeBusiness,
  hasUserLikedBusiness,
  getBusinessLikeCount,
  moderateComment,
} from "@/lib/db/businessEngagement";

function canModerate(user: { id: string; role: string }, business: Awaited<ReturnType<typeof getBusinessById>>) {
  if (!user || !business) return false;
  if (user.role === "admin") return true;
  return !!business.ownerId && business.ownerId === user.id;
}

export async function toggleBusinessLikeAction(locale: Locale, businessId: string, businessSlug: string) {
  const user = await requireUser(locale);
  const isLiked = await hasUserLikedBusiness(user.id, businessId);
  if (isLiked) {
    await unlikeBusiness(user.id, businessId);
  } else {
    await likeBusiness(user.id, businessId);
  }
  const count = await getBusinessLikeCount(businessId);
  revalidatePath(`/${locale}/explorer/${businessSlug}`);
  return { liked: !isLiked, count };
}

export async function createBusinessCommentAction(locale: Locale, businessId: string, businessSlug: string, text: string) {
  const user = await requireUser(locale);
  const comment = await createBusinessComment({ businessId, userId: user.id, text });
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
  const business = await getBusinessById(businessId);
  if (!canModerate(user, business)) throw new Error("UNAUTHORIZED");

  const updated = await moderateComment(commentId, "approved", user.id);
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
  const business = await getBusinessById(businessId);
  if (!canModerate(user, business)) throw new Error("UNAUTHORIZED");

  const updated = await moderateComment(commentId, "rejected", user.id);
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
  const business = await getBusinessById(businessId);
  if (!canModerate(user, business)) throw new Error("UNAUTHORIZED");

  await deleteComment(commentId);
  revalidatePath(`/${locale}/explorer/${businessSlug}`);
  return { ok: true };
}
