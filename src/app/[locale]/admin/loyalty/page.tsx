import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  listLoyaltyProfiles,
  getAdminLoyaltyStats,
  getAdminLoyaltyTotals,
} from "@/lib/db/loyalty";
import { listUsers } from "@/lib/db/users";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";

export const runtime = "nodejs";

/* ── tiny helpers ─────────────────────────────────────────────────── */

function fmtNum(n: number) {
  return n.toLocaleString("en-US");
}

function timeSince(dateStr: string, ar: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return ar ? "اليوم" : "Today";
  if (days === 1) return ar ? "أمس" : "Yesterday";
  if (days < 30) return ar ? `منذ ${days} يوم` : `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return ar ? `منذ ${months} شهر` : `${months}mo ago`;
  const years = Math.floor(months / 12);
  return ar ? `منذ ${years} سنة` : `${years}y ago`;
}

/* ── Stat card for the top row ────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="sbc-card flex items-center gap-4 p-5">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold tracking-tight leading-none">
          {typeof value === "number" ? fmtNum(value) : value}
        </p>
        <p className="mt-0.5 text-sm text-(--muted-foreground) truncate">
          {label}
        </p>
        {sub && (
          <p className="text-xs text-(--muted-foreground)/70 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}

/* ── Icons (inline heroicon outlines) ─────────────────────────────── */

const IconBuilding = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);
const IconUsers = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);
const IconStar = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);
const IconCreditCard = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);
const IconChatBubble = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);
const IconBell = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);
const IconUserGroup = (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);
const IconMapPin = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
  </svg>
);
const IconLink = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);
const IconClock = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconCheckCircle = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

/* ── Page ──────────────────────────────────────────────────────────── */

export default async function AdminLoyaltyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  // Fetch everything in parallel
  const [profiles, users, statsMap, totals] = await Promise.all([
    listLoyaltyProfiles(),
    listUsers(),
    getAdminLoyaltyStats(),
    getAdminLoyaltyTotals(),
  ]);

  const usersById = new Map(users.map((u) => [u.id, u] as const));
  const ar = locale === "ar";

  // Per-business aggregated stats
  const enriched = profiles.map((p) => ({
    profile: p,
    user: usersById.get(p.userId),
    stats: statsMap.get(p.userId) ?? {
      userId: p.userId,
      customerCount: 0,
      totalPoints: 0,
      staffCount: 0,
      messageCount: 0,
      pushSubscriptionCount: 0,
      cardCount: 0,
      activeCardCount: 0,
    },
  }));

  // Sort by customer count descending
  enriched.sort((a, b) => b.stats.customerCount - a.stats.customerCount);

  return (
    <AppPage>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {ar ? "إدارة برامج الولاء" : "Loyalty Programs"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "نظرة عامة على جميع برامج الولاء النشطة في المنصة"
              : "Platform-wide overview of all active loyalty programs"}
          </p>
        </div>
        <Link
          href={`/${locale}/admin`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "← العودة" : "← Back"}
        </Link>
      </div>

      {/* ── Global stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={IconBuilding}
          label={ar ? "البرامج النشطة" : "Active Programs"}
          value={totals.totalProfiles}
          accent="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          icon={IconUsers}
          label={ar ? "إجمالي العملاء" : "Total Customers"}
          value={totals.totalCustomers}
          accent="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={IconStar}
          label={ar ? "إجمالي النقاط" : "Total Points"}
          value={totals.totalPoints}
          sub={
            totals.totalCustomers > 0
              ? `${ar ? "متوسط" : "Avg"}: ${fmtNum(Math.round(totals.totalPoints / totals.totalCustomers))} ${ar ? "لكل عميل" : "/ customer"}`
              : undefined
          }
          accent="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          icon={IconCreditCard}
          label={ar ? "البطاقات النشطة" : "Active Cards"}
          value={totals.totalActiveCards}
          sub={
            totals.totalCards > totals.totalActiveCards
              ? `${totals.totalCards - totals.totalActiveCards} ${ar ? "غير نشطة" : "inactive"}`
              : undefined
          }
          accent="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          icon={IconChatBubble}
          label={ar ? "الرسائل" : "Messages"}
          value={totals.totalMessages}
          accent="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          icon={IconBell}
          label={ar ? "اشتراکات الإشعارات" : "Push Subscriptions"}
          value={totals.totalPushSubs}
          accent="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          icon={IconUserGroup}
          label={ar ? "الموظفون" : "Staff Members"}
          value={totals.totalStaff}
          accent="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
        />
        <StatCard
          icon={IconCreditCard}
          label={ar ? "إجمالي البطاقات" : "Total Cards"}
          value={totals.totalCards}
          accent="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── Business list ───────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {ar ? "تفاصيل البرامج" : "Program Details"}
        </h2>
        <span className="text-sm text-(--muted-foreground)">
          {ar
            ? `${profiles.length} برنامج`
            : `${profiles.length} program${profiles.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {profiles.length === 0 ? (
        <div className="sbc-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-(--muted-foreground)">
            {IconBuilding}
          </div>
          <p className="text-lg font-medium">
            {ar ? "لا توجد برامج ولاء نشطة" : "No active loyalty programs"}
          </p>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "عندما يقوم أصحاب الأعمال بإنشاء برامج ولاء، ستظهر هنا"
              : "When business owners create loyalty programs, they'll appear here"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {enriched.map(({ profile, user, stats }, idx) => (
            <div key={profile.userId} className="sbc-card overflow-hidden">
              <div className="p-6">
                {/* ── Row 1: Business identity ──────────────────── */}
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="shrink-0">
                    {profile.logoUrl ? (
                      <Image
                        src={profile.logoUrl}
                        alt={profile.businessName}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-xl object-cover ring-2 ring-(--border)/50"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-(--muted-foreground) ring-2 ring-(--border)/50">
                        <span className="text-xl font-bold uppercase">
                          {profile.businessName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name + Meta */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold truncate">
                      {profile.businessName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-(--muted-foreground)">
                      {user && (
                        <span className="flex items-center gap-1.5" title={user.email}>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          <span className="truncate max-w-[200px]">{user.email}</span>
                        </span>
                      )}
                      {user?.phone && (
                        <span className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          {user.phone}
                        </span>
                      )}
                      {profile.joinCode && (
                        <span className="flex items-center gap-1.5">
                          {IconLink}
                          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-xs font-mono font-bold">
                            {profile.joinCode}
                          </code>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        {IconClock}
                        {timeSince(profile.createdAt, ar)}
                      </span>
                    </div>
                  </div>

                  {/* Rank badge */}
                  <div className="shrink-0 hidden sm:block">
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold">
                      #{idx + 1}
                    </span>
                  </div>
                </div>

                {/* ── Row 2: Stats grid ────────────────────────── */}
                <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <MiniStat
                    label={ar ? "العملاء" : "Customers"}
                    value={stats.customerCount}
                    accent="text-emerald-600 dark:text-emerald-400"
                  />
                  <MiniStat
                    label={ar ? "النقاط" : "Points"}
                    value={stats.totalPoints}
                    accent="text-amber-600 dark:text-amber-400"
                  />
                  <MiniStat
                    label={ar ? "البطاقات" : "Cards"}
                    value={stats.cardCount}
                    sub={
                      stats.activeCardCount < stats.cardCount
                        ? `${stats.activeCardCount} ${ar ? "نشطة" : "active"}`
                        : undefined
                    }
                    accent="text-sky-600 dark:text-sky-400"
                  />
                  <MiniStat
                    label={ar ? "الرسائل" : "Messages"}
                    value={stats.messageCount}
                    accent="text-purple-600 dark:text-purple-400"
                  />
                  <MiniStat
                    label={ar ? "الإشعارات" : "Push"}
                    value={stats.pushSubscriptionCount}
                    accent="text-rose-600 dark:text-rose-400"
                  />
                  <MiniStat
                    label={ar ? "الموظفون" : "Staff"}
                    value={stats.staffCount}
                    accent="text-teal-600 dark:text-teal-400"
                  />
                </div>

                {/* ── Row 3: Location info (if present) ────────── */}
                {profile.location && (
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-(--muted-foreground) border-t border-(--border)/50 pt-4">
                    <span className="flex items-center gap-1.5">
                      {IconMapPin}
                      <span className="font-medium text-foreground">
                        {profile.location.label ||
                          `${profile.location.lat.toFixed(4)}, ${profile.location.lng.toFixed(4)}`}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {ar ? "نطاق التنبيه:" : "Alert radius:"}{" "}
                      <span className="font-medium text-foreground">
                        {profile.location.radiusMeters}m
                      </span>
                    </span>
                  </div>
                )}

                {/* ── Row 4: Quick info badges ─────────────────── */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {stats.customerCount > 0 && stats.totalPoints > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      {IconCheckCircle}
                      {ar ? "متوسط" : "Avg"}: {fmtNum(Math.round(stats.totalPoints / stats.customerCount))} {ar ? "نقطة/عميل" : "pts/customer"}
                    </span>
                  )}
                  {stats.pushSubscriptionCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {IconCheckCircle}
                      {ar ? "الإشعارات مفعّلة" : "Push enabled"}
                    </span>
                  )}
                  {profile.location && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-900/20 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                      {IconCheckCircle}
                      {ar ? "الموقع مفعّل" : "Location enabled"}
                    </span>
                  )}
                  {stats.staffCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-900/20 px-2.5 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
                      {IconCheckCircle}
                      {stats.staffCount} {ar ? "موظف" : "staff"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppPage>
  );
}

/* ── Mini stat widget used inside each business card ──────────────── */

function MiniStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
      <p className={`text-lg font-bold leading-none ${accent}`}>
        {fmtNum(value)}
      </p>
      <p className="mt-1 text-xs text-(--muted-foreground) leading-tight">
        {label}
      </p>
      {sub && (
        <p className="mt-0.5 text-[10px] text-(--muted-foreground)/70">{sub}</p>
      )}
    </div>
  );
}
