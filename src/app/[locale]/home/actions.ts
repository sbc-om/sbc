"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { getUserById } from "@/lib/db/users";
import {
  likeBusiness,
  unlikeBusiness,
  hasUserLikedBusiness,
  saveBusiness,
  unsaveBusiness,
  hasUserSavedBusiness,
  getBusinessLikeCount,
} from "@/lib/db/businessEngagement";
import { createBusinessLikeNotificationOnce, getUnreadNotificationCount } from "@/lib/db/notifications";
import { broadcastNotificationEvent } from "@/app/api/notifications/stream/route";

export async function toggleBusinessLikeAction(
  locale: Locale,
  businessId: string
): Promise<{ liked: boolean; count: number }> {
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
        href: `/${locale}/explorer/${business.slug}`,
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
          href: `/${locale}/explorer/${business.slug}`,
        });
      }
    }
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
