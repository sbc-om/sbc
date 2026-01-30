import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listAllUserPushSubscriptions, listUsers } from "@/lib/db/users";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { AdminPushClient, type PushSubscriber } from "@/components/admin/AdminPushClient";

export const runtime = "nodejs";

export default async function AdminPushPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const users = await listUsers();
  const usersById = new Map(users.map((u) => [u.id, u] as const));
  const subs = await listAllUserPushSubscriptions();

  const stats = new Map<string, { count: number; lastUpdatedAt: string }>();
  for (const sub of subs) {
    const existing = stats.get(sub.userId);
    if (!existing) {
      stats.set(sub.userId, { count: 1, lastUpdatedAt: sub.updatedAt });
    } else {
      existing.count += 1;
      if (sub.updatedAt > existing.lastUpdatedAt) existing.lastUpdatedAt = sub.updatedAt;
    }
  }

  const subscribers: PushSubscriber[] = [];
  for (const [userId, info] of stats.entries()) {
    const user = usersById.get(userId);
    if (!user) continue;
    subscribers.push({
      userId,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      subscriptionCount: info.count,
      lastUpdatedAt: info.lastUpdatedAt,
    });
  }
  subscribers.sort((a, b) => (a.lastUpdatedAt < b.lastUpdatedAt ? 1 : -1));

  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "إشعارات الدفع" : "Push Notifications"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? `${subscribers.length} مستخدمين مفعلين`
              : `${subscribers.length} active subscribers`}
          </p>
        </div>
      </div>

      <AdminPushClient locale={locale as Locale} subscribers={subscribers} />
    </AppPage>
  );
}
