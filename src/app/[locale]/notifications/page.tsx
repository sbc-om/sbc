import { notFound } from "next/navigation";
import Link from "next/link";
import { HiBellAlert, HiHeart, HiChatBubbleLeftRight } from "react-icons/hi2";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { AppPage } from "@/components/AppPage";
import {
  getUnreadNotificationCount,
  listUserNotifications,
  markAllNotificationsRead,
} from "@/lib/db/notifications";
import { broadcastNotificationEvent } from "@/app/api/notifications/stream/route";

function formatTime(iso: string, locale: Locale) {
  try {
    return new Date(iso).toLocaleString(locale === "ar" ? "ar" : "en", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const notifications = await listUserNotifications(user.id, 100);

  const unread = await getUnreadNotificationCount(user.id);
  if (unread > 0) {
    await markAllNotificationsRead(user.id);
    broadcastNotificationEvent(user.id, { type: "read", unreadCount: 0 });
  }

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {locale === "ar" ? "الإشعارات" : "Notifications"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "آخر التفاعلات على نشاطك في الوقت الحقيقي."
              : "Your latest business activity updates in real time."}
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-8 sbc-card rounded-2xl p-8 text-center">
          <HiBellAlert className="mx-auto h-10 w-10 text-(--muted-foreground)" />
          <p className="mt-3 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "لا توجد إشعارات حالياً." : "No notifications yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {notifications.map((item) => {
            const Icon = item.type === "business_like" ? HiHeart : HiChatBubbleLeftRight;
            const iconClass = item.type === "business_like" ? "text-red-500" : "text-blue-500";

            return (
              <Link
                key={item.id}
                href={item.href ?? `/${locale}/home`}
                className="sbc-card sbc-card--interactive rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-(--chip-bg) border border-(--surface-border)">
                    <Icon className={`h-5 w-5 ${iconClass}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <time className="shrink-0 text-[11px] text-(--muted-foreground)">
                        {formatTime(item.createdAt, locale as Locale)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-(--muted-foreground)">{item.body}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppPage>
  );
}
