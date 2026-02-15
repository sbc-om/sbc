import { getCurrentUser } from "@/lib/auth/currentUser";
import { createUserNotification, getUnreadNotificationCount } from "@/lib/db/notifications";
import { getUserNotificationSettings } from "@/lib/db/notificationSettings";
import { listUserPushSubscriptionsByUser } from "@/lib/db/users";
import { isWebPushConfigured, sendWebPushNotification } from "@/lib/push/webPush";
import { broadcastNotificationEvent } from "@/app/api/notifications/stream/route";

export const runtime = "nodejs";

function resolveLocale(req: Request): "en" | "ar" {
  const headerLocale = req.headers.get("x-locale");
  if (headerLocale === "en" || headerLocale === "ar") return headerLocale;

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      const url = new URL(referer);
      const firstSegment = url.pathname.split("/").filter(Boolean)[0];
      if (firstSegment === "en" || firstSegment === "ar") return firstSegment;
    } catch {
      // ignore invalid referer
    }
  }

  return "en";
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const locale = resolveLocale(req);
  const href = `/${locale}/settings`;

  const settings = await getUserNotificationSettings(user.id);
  if (!settings.notificationsEnabled) {
    return Response.json(
      {
        ok: false,
        error: "NOTIFICATIONS_DISABLED",
      },
      { status: 400 },
    );
  }

  const title = locale === "ar" ? "إشعار تجريبي" : "Test notification";
  const body =
    locale === "ar"
      ? "إعدادات الإشعارات تعمل بشكل صحيح."
      : "Your notification settings are working correctly.";

  await createUserNotification({
    userId: user.id,
    type: "system",
    title,
    body,
    href,
  });

  const unreadCount = await getUnreadNotificationCount(user.id);
  broadcastNotificationEvent(user.id, {
    type: "new",
    unreadCount,
    title,
    body,
    href,
  });

  let pushSent = 0;
  if (isWebPushConfigured()) {
    const subscriptions = await listUserPushSubscriptionsByUser({ userId: user.id });
    if (subscriptions.length > 0) {
      const results = await Promise.all(
        subscriptions.map((subscription) =>
          sendWebPushNotification({
            subscription: {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
              },
            },
            payload: {
              title,
              body,
              url: href,
            },
          }),
        ),
      );
      pushSent = results.filter((r) => r.ok).length;
    }
  }

  return Response.json({ ok: true, pushSent });
}
