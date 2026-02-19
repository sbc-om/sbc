import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  HiCheckCircle,
  HiClock,
  HiCurrencyDollar,
  HiUsers,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineExternalLink,
  HiOutlineDocumentText,
  HiOutlineArrowLeft,
  HiOutlineCheck,
} from "react-icons/hi";
import {
  HiOutlineFolderOpen,
  HiOutlineGift,
  HiOutlineMegaphone,
  HiOutlineGlobeAlt,
  HiOutlineEnvelope,
  HiOutlineCube,
} from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listAllSubscriptionsWithUsers, getProgramSubscriptionStats } from "@/lib/db/subscriptions";
import { formatStorePrice } from "@/lib/store/utils";

export const runtime = "nodejs";

const ITEMS_PER_PAGE = 10;

/* ─── Program visual config ─── */
const programConfig: Record<
  string,
  { en: string; ar: string; dot: string; badge: string; icon: React.ReactNode; iconBg: string }
> = {
  directory: {
    en: "Directory",
    ar: "الدليل",
    dot: "bg-blue-500",
    badge:
      "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400",
    icon: <HiOutlineFolderOpen className="h-5 w-5" />,
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  },
  loyalty: {
    en: "Loyalty",
    ar: "الولاء",
    dot: "bg-purple-500",
    badge:
      "border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-400",
    icon: <HiOutlineGift className="h-5 w-5" />,
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
  },
  marketing: {
    en: "Marketing",
    ar: "التسويق",
    dot: "bg-pink-500",
    badge:
      "border border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-400",
    icon: <HiOutlineMegaphone className="h-5 w-5" />,
    iconBg: "bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400",
  },
  website: {
    en: "Website",
    ar: "الموقع",
    dot: "bg-indigo-500",
    badge:
      "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400",
    icon: <HiOutlineGlobeAlt className="h-5 w-5" />,
    iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
  },
  email: {
    en: "Email",
    ar: "البريد",
    dot: "bg-orange-500",
    badge:
      "border border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-400",
    icon: <HiOutlineEnvelope className="h-5 w-5" />,
    iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  },
};

/* ─── Helpers ─── */
function fmtDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function isExpired(endDate: string) {
  return new Date(endDate) < new Date();
}

function daysRemaining(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function buildQS(base: Record<string, string | undefined>) {
  const entries = Object.entries(base).filter(([, v]) => v !== undefined && v !== "");
  return entries.length ? "?" + entries.map(([k, v]) => `${k}=${v}`).join("&") : "";
}

/* ─── Page ─── */
export default async function AdminSubscriptionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    program?: string;
    status?: string;
    page?: string;
    q?: string;
  }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale as Locale);

  const {
    program: filterProgram,
    status: filterStatus,
    page: pageStr,
    q: searchQuery,
  } = await searchParams;
  const ar = locale === "ar";
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10));
  const basePath = `/${locale}/admin/subscriptions`;

  /* ── Data ── */
  const allSubscriptions = await listAllSubscriptionsWithUsers();
  const programs = ["directory", "loyalty", "marketing", "website", "email"];
  const statsResults = await Promise.all(programs.map((p) => getProgramSubscriptionStats(p)));
  const stats = programs.reduce(
    (acc, p, i) => ({ ...acc, [p]: statsResults[i] }),
    {} as Record<string, { total: number; active: number; revenue: number }>
  );

  /* ── Filter ── */
  let subs = allSubscriptions;
  if (filterProgram) subs = subs.filter((s) => s.program === filterProgram);
  if (filterStatus === "active") subs = subs.filter((s) => s.isActive && !isExpired(s.endDate));
  else if (filterStatus === "expired") subs = subs.filter((s) => isExpired(s.endDate));
  else if (filterStatus === "cancelled") subs = subs.filter((s) => !s.isActive);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    subs = subs.filter(
      (s) =>
        s.userName.toLowerCase().includes(q) ||
        s.userEmail.toLowerCase().includes(q) ||
        s.productSlug.toLowerCase().includes(q) ||
        s.program.toLowerCase().includes(q)
    );
  }

  /* ── Pagination ── */
  const totalFiltered = subs.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = subs.slice(start, start + ITEMS_PER_PAGE);

  /* ── Aggregates ── */
  const totalActive = allSubscriptions.filter((s) => s.isActive && !isExpired(s.endDate)).length;
  const totalExpired = allSubscriptions.filter((s) => isExpired(s.endDate)).length;
  const totalCancelled = allSubscriptions.filter((s) => !s.isActive).length;
  const totalRevenue = allSubscriptions.reduce((sum, s) => sum + s.amount, 0);

  /* ── Copy ── */
  const t = {
    title: ar ? "إدارة الاشتراكات" : "Subscriptions",
    subtitle: ar
      ? "عرض وإدارة جميع اشتراكات وباقات المستخدمين"
      : "Manage all user subscriptions & packages",
    back: ar ? "لوحة التحكم" : "Dashboard",
    total: ar ? "إجمالي" : "Total",
    active: ar ? "نشط" : "Active",
    expired: ar ? "منتهي" : "Expired",
    cancelled: ar ? "ملغي" : "Cancelled",
    revenue: ar ? "الإيرادات" : "Revenue",
    all: ar ? "الكل" : "All",
    user: ar ? "المستخدم" : "User",
    program: ar ? "البرنامج" : "Program",
    plan: ar ? "الباقة" : "Plan",
    amount: ar ? "المبلغ" : "Amount",
    period: ar ? "المدة" : "Period",
    remaining: ar ? "المتبقي" : "Remaining",
    status: ar ? "الحالة" : "Status",
    days: ar ? "يوم" : "d",
    noResults: ar ? "لا توجد اشتراكات مطابقة" : "No matching subscriptions",
    noResultsSub: ar
      ? "جرب تغيير عوامل التصفية أو البحث"
      : "Try adjusting your filters or search query",
    search: ar ? "ابحث عن مستخدم، بريد، باقة..." : "Search user, email, plan…",
    showing: ar ? "عرض" : "Showing",
    of: ar ? "من" : "of",
    results: ar ? "نتيجة" : "results",
    prev: ar ? "السابق" : "Prev",
    next: ar ? "التالي" : "Next",
    programStats: ar ? "البرامج" : "Programs",
    manage: ar ? "إدارة" : "Manage",
    clearFilters: ar ? "مسح عوامل التصفية" : "Clear filters",
  };

  /* ── Filter QS helpers ── */
  function filterHref(overrides: Record<string, string | undefined>) {
    const base = {
      program: filterProgram,
      status: filterStatus,
      q: searchQuery,
      ...overrides,
      page: undefined,
    };
    return basePath + buildQS(base);
  }

  function pageHref(p: number) {
    return (
      basePath +
      buildQS({
        program: filterProgram,
        status: filterStatus,
        q: searchQuery,
        page: p > 1 ? String(p) : undefined,
      })
    );
  }

  const statusFilters = [
    { key: undefined as string | undefined, label: t.all, count: allSubscriptions.length },
    { key: "active", label: t.active, count: totalActive },
    { key: "expired", label: t.expired, count: totalExpired },
    { key: "cancelled", label: t.cancelled, count: totalCancelled },
  ];

  return (
    <AppPage>
      <div className="space-y-7">
        {/* ═══ Header ═══ */}
        <div>
          <Link
            href={`/${locale}/admin`}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground) transition-colors"
          >
            <HiOutlineArrowLeft className="h-3.5 w-3.5" />
            {t.back}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
        </div>

        {/* ═══ KPI Cards ═══ */}
        <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
          {(
            [
              {
                label: t.total,
                value: String(allSubscriptions.length),
                icon: <HiUsers className="h-5 w-5" />,
                iconBg: "bg-slate-100 dark:bg-slate-800",
                iconColor: "text-slate-600 dark:text-slate-400",
              },
              {
                label: t.active,
                value: String(totalActive),
                icon: <HiCheckCircle className="h-5 w-5" />,
                iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
                iconColor: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: t.expired,
                value: String(totalExpired),
                icon: <HiClock className="h-5 w-5" />,
                iconBg: "bg-amber-50 dark:bg-amber-950/40",
                iconColor: "text-amber-600 dark:text-amber-400",
              },
              {
                label: t.revenue,
                value: formatStorePrice({ amount: totalRevenue, currency: "OMR" }, locale),
                icon: <HiCurrencyDollar className="h-5 w-5" />,
                iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
                iconColor: "text-emerald-600 dark:text-emerald-400",
              },
            ] as const
          ).map((card, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-5 transition-shadow hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
                >
                  <span className={card.iconColor}>{card.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-(--muted-foreground)">
                    {card.label}
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums tracking-tight">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ Program Pills ═══ */}
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
            {t.programStats}
          </h3>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {programs.map((p) => {
              const cfg = programConfig[p] ?? {
                en: p,
                ar: p,
                dot: "bg-gray-500",
                badge: "",
                icon: <HiOutlineCube className="h-5 w-5" />,
                iconBg: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
              };
              const s = stats[p] ?? { total: 0, active: 0, revenue: 0 };
              const isSelected = filterProgram === p;
              return (
                <Link
                  key={p}
                  href={filterHref({ program: isSelected ? undefined : p })}
                  className={`group relative flex flex-col items-center rounded-2xl border p-4 text-center transition-all
                    ${
                      isSelected
                        ? "border-gray-300 bg-gray-50/80 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04]"
                        : "border-gray-200/70 bg-white hover:border-gray-300/80 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/10"
                    }`}
                >
                  {isSelected && (
                    <span className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-(--foreground) text-(--background) shadow-sm">
                      <HiOutlineCheck className="h-3 w-3" />
                    </span>
                  )}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cfg.iconBg}`}>
                    {cfg.icon}
                  </div>
                  <span className="mt-2 text-xs font-bold">{ar ? cfg.ar : cfg.en}</span>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-lg font-bold tabular-nums">{s.active}</span>
                    <span className="text-[10px] text-(--muted-foreground)">/ {s.total}</span>
                  </div>
                  <span className="mt-1 text-[11px] font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                    {formatStorePrice({ amount: s.revenue, currency: "OMR" }, locale)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ═══ Filters + Search ═══ */}
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Status pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {statusFilters.map((sf) => {
              const active = filterStatus === sf.key || (!filterStatus && !sf.key);
              return (
                <Link
                  key={sf.key ?? "all"}
                  href={filterHref({ status: sf.key })}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all
                    ${
                      active
                        ? "bg-(--foreground) text-(--background) shadow-sm"
                        : "border border-gray-200/80 bg-white text-(--muted-foreground) hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                    }`}
                >
                  {sf.label}
                  <span className={`tabular-nums ${active ? "opacity-70" : "opacity-50"}`}>
                    {sf.count}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Search */}
          <form action={basePath} method="GET" className="relative w-full sm:max-w-xs">
            {filterProgram && <input type="hidden" name="program" value={filterProgram} />}
            {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
            <HiOutlineSearch className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted-foreground)/60" />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder={t.search}
              className="w-full rounded-xl border border-gray-200/80 bg-white py-2.5 pe-3 ps-9 text-sm placeholder:text-(--muted-foreground)/50 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-white/[0.08] dark:bg-white/[0.02] dark:focus:border-white/[0.15] dark:focus:ring-white/[0.06]"
            />
          </form>
        </div>

        {/* ═══ Table Container ═══ */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
          {paginated.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200/70 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <HiOutlineDocumentText className="h-7 w-7 text-(--muted-foreground)/60" />
              </div>
              <p className="mt-5 text-sm font-semibold">{t.noResults}</p>
              <p className="mt-1 max-w-xs text-xs text-(--muted-foreground)">{t.noResultsSub}</p>
              <Link
                href={basePath}
                className="mt-5 inline-flex items-center gap-1 rounded-lg border border-gray-200/80 bg-white px-4 py-2 text-xs font-semibold shadow-sm transition-all hover:shadow dark:border-white/[0.08] dark:bg-white/[0.03]"
              >
                {t.clearFilters}
              </Link>
            </div>
          ) : (
            <>
              {/* ── Desktop Table ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.04]">
                      <th className="px-5 py-3.5 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t.user}
                      </th>
                      <th className="px-4 py-3.5 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t.plan}
                      </th>
                      <th className="px-4 py-3.5 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t.amount}
                      </th>
                      <th className="min-w-[150px] px-4 py-3.5 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t.period}
                      </th>
                      <th className="px-4 py-3.5 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t.remaining}
                      </th>
                      <th className="px-5 py-3.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80 dark:divide-white/[0.03]">
                    {paginated.map((sub) => {
                      const exp = isExpired(sub.endDate);
                      const rem = daysRemaining(sub.endDate);
                      const isActive = sub.isActive && !exp;
                      const cfg = programConfig[sub.program] ?? {
                        en: sub.program,
                        ar: sub.program,
                        dot: "bg-gray-500",
                        badge: "border-gray-200 bg-gray-50 text-gray-700",
                        icon: <HiOutlineCube className="h-5 w-5" />,
                        iconBg: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                      };

                      const rowBg = isActive
                        ? "bg-emerald-50/40 hover:bg-emerald-50/70 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
                        : !sub.isActive
                          ? "bg-red-50/40 hover:bg-red-50/70 dark:bg-red-950/10 dark:hover:bg-red-950/20"
                          : "bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-950/10 dark:hover:bg-amber-950/20";

                      return (
                        <tr
                          key={sub.id}
                          className={`group transition-colors ${rowBg}`}
                        >
                          {/* User */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {sub.userAvatar ? (
                                <Image
                                  src={sub.userAvatar}
                                  alt={sub.userName}
                                  width={36}
                                  height={36}
                                  className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-xs font-bold text-gray-500 ring-1 ring-gray-200/60 dark:from-white/10 dark:to-white/5 dark:text-gray-400 dark:ring-white/[0.08]">
                                  {sub.userName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold leading-tight">
                                  {sub.userName}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-(--muted-foreground)/70">
                                  {sub.userEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* Plan + Program Icon */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}>
                                {React.cloneElement(cfg.icon as React.ReactElement<{ className?: string }>, { className: "h-4 w-4" })}
                              </div>
                              <p className="max-w-[180px] truncate text-xs font-medium">
                                {sub.plan || sub.productSlug}
                              </p>
                            </div>
                          </td>
                          {/* Amount */}
                          <td className="px-4 py-4">
                            <span className="text-[13px] font-semibold tabular-nums">
                              {formatStorePrice(
                                { amount: sub.amount, currency: sub.currency as "OMR" },
                                locale
                              )}
                            </span>
                          </td>
                          {/* Period */}
                          <td className="min-w-[150px] px-4 py-4">
                            <div className="flex flex-col gap-0.5 whitespace-nowrap">
                              <span className="text-xs text-(--muted-foreground)/70">
                                {fmtDate(sub.startDate, locale as Locale)}
                              </span>
                              <span className="text-xs font-medium">
                                {fmtDate(sub.endDate, locale as Locale)}
                              </span>
                            </div>
                          </td>
                          {/* Remaining */}
                          <td className="px-4 py-4">
                            {isActive ? (
                              <div className="inline-flex items-center gap-1.5">
                                <span className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-emerald-200/70 bg-emerald-50 px-1.5 text-[11px] font-bold tabular-nums text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                                  {rem}
                                </span>
                                <span className="text-[10px] font-medium text-(--muted-foreground)">
                                  {t.days}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-(--muted-foreground)/40">—</span>
                            )}
                          </td>
                          {/* Action */}
                          <td className="px-5 py-4 text-end">
                            <Link
                              href={`${basePath}/${sub.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:border-gray-300 hover:shadow group-hover:border-gray-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                            >
                              {t.manage}
                              <HiOutlineExternalLink className="h-3 w-3 opacity-40" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile Cards ── */}
              <div className="divide-y divide-gray-100/80 md:hidden dark:divide-white/[0.04]">
                {paginated.map((sub) => {
                  const exp = isExpired(sub.endDate);
                  const rem = daysRemaining(sub.endDate);
                  const isActive = sub.isActive && !exp;
                  const cfg = programConfig[sub.program] ?? {
                    en: sub.program,
                    ar: sub.program,
                    dot: "bg-gray-500",
                    badge: "border-gray-200 bg-gray-50 text-gray-700",
                    icon: <HiOutlineCube className="h-5 w-5" />,
                    iconBg: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                  };

                  const mobileBg = isActive
                    ? "bg-emerald-50/40 active:bg-emerald-50/70 dark:bg-emerald-950/10 dark:active:bg-emerald-950/20"
                    : !sub.isActive
                      ? "bg-red-50/40 active:bg-red-50/70 dark:bg-red-950/10 dark:active:bg-red-950/20"
                      : "bg-amber-50/40 active:bg-amber-50/70 dark:bg-amber-950/10 dark:active:bg-amber-950/20";

                  return (
                    <Link
                      key={sub.id}
                      href={`${basePath}/${sub.id}`}
                      className={`flex items-center gap-3.5 px-4 py-4 transition-colors ${mobileBg}`}
                    >
                      {sub.userAvatar ? (
                        <Image
                          src={sub.userAvatar}
                          alt={sub.userName}
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-sm font-bold text-gray-500 ring-1 ring-gray-200/60 dark:from-white/10 dark:to-white/5 dark:text-gray-400 dark:ring-white/[0.08]">
                          {sub.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{sub.userName}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-(--muted-foreground)">
                          <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${cfg.iconBg}`}>
                            {React.cloneElement(cfg.icon as React.ReactElement<{ className?: string }>, { className: "h-2.5 w-2.5" })}
                          </span>
                          <span className="font-semibold tabular-nums text-(--foreground)">
                            {formatStorePrice(
                              { amount: sub.amount, currency: sub.currency as "OMR" },
                              locale
                            )}
                          </span>
                          <span className="opacity-30">·</span>
                          <span className="truncate">{sub.plan || sub.productSlug}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {isActive ? (
                          <span className="text-[10px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {rem} {t.days}
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold ${
                            !sub.isActive
                              ? "text-red-500 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}>
                            {!sub.isActive ? t.cancelled : t.expired}
                          </span>
                        )}
                        <HiOutlineChevronRight className="h-3.5 w-3.5 text-(--muted-foreground)/40" />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* ── Program Icon Legend ── */}
              <div className="border-t border-gray-100 px-5 py-3 dark:border-white/[0.04]">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-(--muted-foreground)/60">
                    {ar ? "البرامج" : "Programs"}
                  </span>
                  {Object.entries(programConfig).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-md ${cfg.iconBg}`}>
                        {React.cloneElement(cfg.icon as React.ReactElement<{ className?: string }>, { className: "h-3 w-3" })}
                      </div>
                      <span className="text-[11px] font-medium text-(--muted-foreground)">
                        {ar ? cfg.ar : cfg.en}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Pagination Footer ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5 dark:border-white/[0.04]">
                  <p className="text-xs text-(--muted-foreground) tabular-nums">
                    {t.showing}{" "}
                    <span className="font-semibold text-(--foreground)">
                      {start + 1}–{Math.min(start + ITEMS_PER_PAGE, totalFiltered)}
                    </span>{" "}
                    {t.of}{" "}
                    <span className="font-semibold text-(--foreground)">{totalFiltered}</span>{" "}
                    {t.results}
                  </p>
                  <nav className="flex items-center gap-1">
                    {/* Prev */}
                    {safePage > 1 ? (
                      <Link
                        href={pageHref(safePage - 1)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:border-gray-300 hover:shadow dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                      >
                        <HiOutlineChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t.prev}</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 px-3 py-1.5 text-xs font-medium text-(--muted-foreground)/40 dark:border-white/[0.04]">
                        <HiOutlineChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t.prev}</span>
                      </span>
                    )}

                    {/* Page numbers */}
                    <div className="hidden items-center gap-0.5 sm:flex">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPages <= 7) return true;
                          if (p === 1 || p === totalPages) return true;
                          return Math.abs(p - safePage) <= 1;
                        })
                        .reduce<(number | "dots")[]>((acc, p, i, arr) => {
                          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("dots");
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, i) =>
                          item === "dots" ? (
                            <span
                              key={`d${i}`}
                              className="px-1 text-xs text-(--muted-foreground)/40"
                            >
                              …
                            </span>
                          ) : (
                            <Link
                              key={item}
                              href={pageHref(item)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-all
                                ${
                                  item === safePage
                                    ? "bg-(--foreground) text-(--background) shadow-sm"
                                    : "border border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.04]"
                                }`}
                            >
                              {item}
                            </Link>
                          )
                        )}
                    </div>

                    {/* Next */}
                    {safePage < totalPages ? (
                      <Link
                        href={pageHref(safePage + 1)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:border-gray-300 hover:shadow dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                      >
                        <span className="hidden sm:inline">{t.next}</span>
                        <HiOutlineChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 px-3 py-1.5 text-xs font-medium text-(--muted-foreground)/40 dark:border-white/[0.04]">
                        <span className="hidden sm:inline">{t.next}</span>
                        <HiOutlineChevronRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppPage>
  );
}
