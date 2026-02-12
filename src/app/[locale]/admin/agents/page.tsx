import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineExternalLink,
  HiOutlineArrowLeft,
  HiOutlineUserAdd,
} from "react-icons/hi";
import {
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineChartBar,
  HiOutlineCheckBadge,
} from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listAgents } from "@/lib/db/agents";

export const runtime = "nodejs";

const ITEMS_PER_PAGE = 10;

export default async function AdminAgentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale as Locale);

  const { page: pageStr, q: searchQuery, status: filterStatus } = await searchParams;
  const ar = locale === "ar";
  const currentPage = Math.max(1, parseInt(pageStr || "1", 10));
  const basePath = `/${locale}/admin/agents`;

  const allAgents = await listAgents();

  /* ── Filter ── */
  let agents = allAgents;
  if (filterStatus === "active") agents = agents.filter((a) => a.isActive);
  else if (filterStatus === "inactive") agents = agents.filter((a) => !a.isActive);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    agents = agents.filter(
      (a) =>
        a.userName.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q) ||
        a.userPhone.includes(q)
    );
  }

  /* ── Pagination ── */
  const totalFiltered = agents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated = agents.slice(start, start + ITEMS_PER_PAGE);

  /* ── Aggregates ── */
  const totalActive = allAgents.filter((a) => a.isActive).length;
  const totalEarned = allAgents.reduce((s, a) => s + a.totalEarned, 0);
  const totalClients = allAgents.reduce((s, a) => s + a.totalClients, 0);

  /* ── Copy ── */
  const t = {
    title: ar ? "إدارة الوكلاء" : "Agents",
    subtitle: ar ? "إدارة الوكلاء والنسب المئوية لكل وكيل" : "Manage agents & commission rates",
    back: ar ? "لوحة التحكم" : "Dashboard",
    total: ar ? "إجمالي" : "Total",
    active: ar ? "نشط" : "Active",
    inactive: ar ? "غير نشط" : "Inactive",
    all: ar ? "الكل" : "All",
    earned: ar ? "إجمالي الأرباح" : "Total Earned",
    clients: ar ? "إجمالي العملاء" : "Total Clients",
    name: ar ? "الاسم" : "Name",
    commission: ar ? "النسبة" : "Commission",
    clientsCol: ar ? "العملاء" : "Clients",
    earnedCol: ar ? "الأرباح" : "Earned",
    status: ar ? "الحالة" : "Status",
    manage: ar ? "إدارة" : "Manage",
    addAgent: ar ? "إضافة وكيل" : "Add Agent",
    noResults: ar ? "لا يوجد وكلاء" : "No agents found",
    noResultsSub: ar ? "أضف وكيل جديد للبدء" : "Add a new agent to get started",
    search: ar ? "بحث بالاسم أو البريد أو الهاتف..." : "Search by name, email or phone...",
    showing: ar ? "عرض" : "Showing",
    of: ar ? "من" : "of",
    results: ar ? "نتيجة" : "results",
    prev: ar ? "السابق" : "Prev",
    next: ar ? "التالي" : "Next",
  };

  function buildQS(base: Record<string, string | undefined>) {
    const entries = Object.entries(base).filter(([, v]) => v !== undefined && v !== "");
    return entries.length ? "?" + entries.map(([k, v]) => `${k}=${v}`).join("&") : "";
  }
  function pageHref(p: number) {
    return basePath + buildQS({ page: String(p), q: searchQuery, status: filterStatus });
  }

  return (
    <AppPage>
      <div className="space-y-7">
        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
          <Link
            href={`${basePath}/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-(--foreground) px-5 py-2.5 text-sm font-semibold text-(--background) shadow-sm transition-all hover:opacity-90"
          >
            <HiOutlineUserAdd className="h-4 w-4" />
            {t.addAgent}
          </Link>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: t.total,
              value: allAgents.length,
              icon: <HiOutlineUserGroup className="h-5 w-5" />,
              color: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
            },
            {
              label: t.active,
              value: totalActive,
              icon: <HiOutlineCheckBadge className="h-5 w-5" />,
              color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
            },
            {
              label: t.clients,
              value: totalClients,
              icon: <HiOutlineChartBar className="h-5 w-5" />,
              color: "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
            },
            {
              label: t.earned,
              value: `${totalEarned.toFixed(3)} OMR`,
              icon: <HiOutlineBanknotes className="h-5 w-5" />,
              color: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
            },
          ].map((card, i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-xs text-(--muted-foreground)">{card.label}</p>
                <p className="text-lg font-bold tabular-nums leading-tight">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table Card ── */}
        <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
          {/* Filters + Search */}
          <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.04]">
            {/* Status pills */}
            <div className="flex items-center gap-1.5">
              {[
                { key: undefined, label: t.all },
                { key: "active", label: t.active },
                { key: "inactive", label: t.inactive },
              ].map((f) => {
                const isActive = filterStatus === f.key || (!filterStatus && !f.key);
                return (
                  <Link
                    key={f.key ?? "all"}
                    href={basePath + buildQS({ status: f.key, q: searchQuery })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-(--foreground) text-(--background) shadow-sm"
                        : "text-(--muted-foreground) hover:bg-gray-100 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>
            {/* Search */}
            <form action={basePath} method="GET" className="relative">
              {filterStatus && <input type="hidden" name="status" value={filterStatus} />}
              <HiOutlineSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted-foreground)/50" />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder={t.search}
                className="w-full rounded-xl border border-gray-200/80 bg-transparent py-2 ps-9 pe-3 text-xs transition-colors placeholder:text-(--muted-foreground)/50 focus:border-gray-300 focus:outline-none sm:w-64 dark:border-white/[0.08] dark:focus:border-white/[0.15]"
              />
            </form>
          </div>

          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.04]">
                <HiOutlineUserGroup className="h-6 w-6 text-(--muted-foreground)/40" />
              </div>
              <p className="text-sm font-semibold">{t.noResults}</p>
              <p className="text-xs text-(--muted-foreground)">{t.noResultsSub}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.04]">
                      <th className="px-5 py-3.5 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t.name}
                      </th>
                      <th className="px-4 py-3.5 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t.commission}
                      </th>
                      <th className="px-4 py-3.5 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t.clientsCol}
                      </th>
                      <th className="px-4 py-3.5 text-start text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                        {t.earnedCol}
                      </th>
                      <th className="px-5 py-3.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80 dark:divide-white/[0.03]">
                    {paginated.map((agent) => {
                      const rowBg = agent.isActive
                        ? "bg-emerald-50/30 hover:bg-emerald-50/60 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
                        : "bg-red-50/30 hover:bg-red-50/60 dark:bg-red-950/10 dark:hover:bg-red-950/20";

                      return (
                        <tr key={agent.userId} className={`group transition-colors ${rowBg}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {agent.userAvatar ? (
                                <Image
                                  src={agent.userAvatar}
                                  alt={agent.userName}
                                  width={36}
                                  height={36}
                                  className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-xs font-bold text-gray-500 ring-1 ring-gray-200/60 dark:from-white/10 dark:to-white/5 dark:text-gray-400 dark:ring-white/[0.08]">
                                  {agent.userName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold leading-tight">
                                  {agent.userName}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-(--muted-foreground)/70">
                                  {agent.userPhone || agent.userEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center rounded-lg border border-indigo-200/70 bg-indigo-50 px-2.5 py-1 text-[12px] font-bold tabular-nums text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
                              {agent.commissionRate}%
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[13px] font-semibold tabular-nums">
                              {agent.totalClients}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[13px] font-semibold tabular-nums">
                              {agent.totalEarned.toFixed(3)} OMR
                            </span>
                          </td>
                          <td className="px-5 py-4 text-end">
                            <Link
                              href={`${basePath}/${agent.userId}`}
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

              {/* Mobile Cards */}
              <div className="divide-y divide-gray-100/80 md:hidden dark:divide-white/[0.04]">
                {paginated.map((agent) => {
                  const mobileBg = agent.isActive
                    ? "bg-emerald-50/30 active:bg-emerald-50/60 dark:bg-emerald-950/10"
                    : "bg-red-50/30 active:bg-red-50/60 dark:bg-red-950/10";

                  return (
                    <Link
                      key={agent.userId}
                      href={`${basePath}/${agent.userId}`}
                      className={`flex items-center gap-3.5 px-4 py-4 transition-colors ${mobileBg}`}
                    >
                      {agent.userAvatar ? (
                        <Image
                          src={agent.userAvatar}
                          alt={agent.userName}
                          width={40}
                          height={40}
                          className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-sm font-bold text-gray-500 ring-1 ring-gray-200/60 dark:from-white/10 dark:to-white/5 dark:text-gray-400 dark:ring-white/[0.08]">
                          {agent.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{agent.userName}</span>
                          <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
                            {agent.commissionRate}%
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-(--muted-foreground)">
                          <span>{agent.totalClients} {ar ? "عميل" : "clients"}</span>
                          <span className="opacity-30">·</span>
                          <span className="tabular-nums">{agent.totalEarned.toFixed(3)} OMR</span>
                        </div>
                      </div>
                      <HiOutlineChevronRight className="h-3.5 w-3.5 shrink-0 text-(--muted-foreground)/40" />
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
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
                    {safePage > 1 ? (
                      <Link
                        href={pageHref(safePage - 1)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:border-gray-300 dark:border-white/[0.08] dark:bg-white/[0.03]"
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
                    {safePage < totalPages ? (
                      <Link
                        href={pageHref(safePage + 1)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:border-gray-300 dark:border-white/[0.08] dark:bg-white/[0.03]"
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
