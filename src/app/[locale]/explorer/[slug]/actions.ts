"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { getUserById } from "@/lib/db/users";
import {
  createBusinessComment,
  deleteComment,
  likeBusiness,
  unlikeBusiness,
  hasUserLikedBusiness,
  getBusinessLikeCount,
  moderateComment,
} from "@/lib/db/businessEngagement";
import {
  createBusinessLikeNotificationOnce,
  createUserNotification,
  getUnreadNotificationCount,
} from "@/lib/db/notifications";
import { getUserNotificationSettings } from "@/lib/db/notificationSettings";
import { broadcastNotificationEvent } from "@/app/api/notifications/stream/route";

function canModerate(user: { id: string; role: string }, business: Awaited<ReturnType<typeof getBusinessById>>) {
  if (!user || !business) return false;
  if (user.role === "admin") return true;
  return !!business.ownerId && business.ownerId === user.id;
}

export async function toggleBusinessLikeAction(locale: Locale, businessId: string, businessSlug: string) {
  const user = await requireUser(locale);
  const business = await getBusinessById(businessId);
  const isLiked = await hasUserLikedBusiness(user.id, businessId);
  if (isLiked) {
    await unlikeBusiness(user.id, businessId);
  } else {
    await likeBusiness(user.id, businessId);

    if (business?.ownerId && business.ownerId !== user.id) {
      const actor = await getUserById(user.id);
      const actorName = actor?.displayName || actor?.fullName || actor?.email || (locale === "ar" ? "مستخدم" : "User");
      const title = locale === "ar" ? "إعجاب جديد" : "New like";
      const body =
        locale === "ar"
          ? `${actorName} أعجب بنشاطك ${business.name.ar}.`
          : `${actorName} liked your business ${business.name.en}.`;

      const createdNotification = await createBusinessLikeNotificationOnce({
        userId: business.ownerId,
        title,
        body,
        href: `/${locale}/explorer/${businessSlug}`,
        actorUserId: user.id,
        businessId,
      });

      if (createdNotification) {
        const unreadCount = await getUnreadNotificationCount(business.ownerId);
        broadcastNotificationEvent(business.ownerId, {
          type: "new",
          unreadCount,
          title,
          body,
          href: `/${locale}/explorer/${businessSlug}`,
        });
      }
    }
  }
  const count = await getBusinessLikeCount(businessId);
  revalidatePath(`/${locale}/explorer/${businessSlug}`);
  return { liked: !isLiked, count };
}

export async function createBusinessCommentAction(locale: Locale, businessId: string, businessSlug: string, text: string) {
  const user = await requireUser(locale);
  const business = await getBusinessById(businessId);
  const comment = await createBusinessComment({ businessId, userId: user.id, text });

  if (business?.ownerId && business.ownerId !== user.id) {
    const actor = await getUserById(user.id);
    const actorName = actor?.displayName || actor?.fullName || actor?.email || (locale === "ar" ? "مستخدم" : "User");
    const title = locale === "ar" ? "تعليق جديد" : "New comment";
    const snippet = text.trim().slice(0, 80);
    const body =
      locale === "ar"
        ? `${actorName} علّق على نشاطك: ${snippet}`
        : `${actorName} commented on your business: ${snippet}`;

    const ownerSettings = await getUserNotificationSettings(business.ownerId);
    if (ownerSettings.notificationsEnabled) {
      await createUserNotification({
        userId: business.ownerId,
        type: "business_comment",
        title,
        body,
        href: `/${locale}/explorer/${businessSlug}`,
        actorUserId: user.id,
        businessId,
      });

      const unreadCount = await getUnreadNotificationCount(business.ownerId);
      broadcastNotificationEvent(business.ownerId, {
        type: "new",
        unreadCount,
        title,
        body,
        href: `/${locale}/explorer/${businessSlug}`,
      });
    }
  }

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
