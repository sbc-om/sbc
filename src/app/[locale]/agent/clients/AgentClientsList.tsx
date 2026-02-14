"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineOfficeBuilding,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
} from "react-icons/hi";
import { HiOutlineUserGroup, HiOutlineWallet } from "react-icons/hi2";
import type { Locale } from "@/lib/i18n/locales";
import type { AgentClientWithUser } from "@/lib/db/agents";

type EnrichedClient = AgentClientWithUser & {
  walletBalance: number;
  hasBusiness: boolean;
  requestStatus: "pending" | "approved" | "rejected" | null;
  activeProducts: Array<{ slug: string; name: string; endDate: string }>;
};

const texts = {
  en: {
    title: "My Clients",
    subtitle: "Manage your clients and register businesses for them",
    addClient: "Add Client",
    searchPlaceholder: "Search by name, phone or email…",
    noBusiness: "No Business",
    hasBusiness: "Has Business",
    requestPending: "Request Pending",
    requestRejected: "Rejected",
    registerBusiness: "Register Business",
    noClients: "No clients yet",
    noClientsSub: "Start by adding or creating a client account",
    total: "Total",
    withBusiness: "With Business",
    withoutBusiness: "Without Business",
    filterAll: "All",
    filterNoBiz: "Without Business",
    filterHasBiz: "With Business",
    activeProducts: "Active Products",
    noActiveProducts: "No active product",
    needsActivation: "Needs activation",
  },
  ar: {
    title: "عملائي",
    subtitle: "إدارة عملائك وتسجيل الأعمال لهم",
    addClient: "إضافة عميل",
    searchPlaceholder: "ابحث بالاسم أو الهاتف أو البريد…",
    noBusiness: "بدون عمل",
    hasBusiness: "لديه عمل",
    requestPending: "طلب قيد المراجعة",
    requestRejected: "مرفوض",
    registerBusiness: "تسجيل عمل",
    noClients: "لا يوجد عملاء بعد",
    noClientsSub: "ابدأ بإضافة أو إنشاء حساب عميل",
    total: "الإجمالي",
    withBusiness: "لديهم أعمال",
    withoutBusiness: "بدون أعمال",
    filterAll: "الكل",
    filterNoBiz: "بدون عمل",
    filterHasBiz: "لديهم عمل",
    activeProducts: "المنتجات المفعلة",
    noActiveProducts: "بدون منتج مفعل",
    needsActivation: "يحتاج تفعيل",
  },
};

type Filter = "all" | "no-business" | "has-business";

export function AgentClientsList({
  locale,
  clients,
}: {
  locale: Locale;
  clients: EnrichedClient[];
}) {
  const t = texts[locale];
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const withBiz = clients.filter((c) => c.hasBusiness || c.requestStatus === "approved").length;
  const withoutBiz = clients.length - withBiz;

  const filtered = clients.filter((c) => {
    // Search filter
    const q = search.toLowerCase();
    if (
      q &&
      !c.clientName.toLowerCase().includes(q) &&
      !c.clientPhone.toLowerCase().includes(q) &&
      !c.clientEmail.toLowerCase().includes(q)
    ) {
      return false;
    }
    // Business filter
    if (filter === "no-business") {
      return !c.hasBusiness && c.requestStatus !== "approved";
    }
    if (filter === "has-business") {
      return c.hasBusiness || c.requestStatus === "approved";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
        </div>
        <Link
          href={`/${locale}/agent/clients/new`}
          className="inline-flex items-center gap-2 rounded-xl bg-(--foreground) px-4 py-2.5 text-sm font-semibold text-(--background) transition-all hover:opacity-90"
        >
          <HiOutlinePlus className="h-4 w-4" />
          {t.addClient}
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: t.total,
            value: clients.length,
            color: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
          },
          {
            label: t.withBusiness,
            value: withBiz,
            color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
          },
          {
            label: t.withoutBusiness,
            value: withoutBiz,
            color: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
              <HiOutlineUserGroup className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-(--muted-foreground)">{stat.label}</p>
              <p className="text-lg font-bold tabular-nums leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted-foreground)/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-xl border border-gray-200/80 bg-transparent py-2.5 ps-9 pe-3 text-sm transition-colors placeholder:text-(--muted-foreground)/50 focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
          />
        </div>
        <div className="flex gap-1.5">
          {(
            [
              ["all", t.filterAll],
              ["no-business", t.filterNoBiz],
              ["has-business", t.filterHasBiz],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === key
                  ? "bg-(--foreground) text-(--background)"
                  : "border border-gray-200/80 text-(--muted-foreground) hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200/70 bg-white py-16 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <HiOutlineUserGroup className="h-10 w-10 text-(--muted-foreground)/30" />
          <p className="text-sm font-semibold">{t.noClients}</p>
          <p className="text-xs text-(--muted-foreground)">{t.noClientsSub}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="divide-y divide-gray-100/80 dark:divide-white/[0.03]">
            {filtered.map((c) => {
              return (
                <div
                  key={c.clientUserId}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-center dark:hover:bg-white/[0.02]"
                >
                  {/* Avatar + info */}
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {c.clientAvatar ? (
                      <Image
                        src={c.clientAvatar}
                        alt={c.clientName}
                        width={44}
                        height={44}
                        className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-sm font-bold text-gray-500 ring-1 ring-gray-200/60 dark:from-white/10 dark:to-white/5 dark:text-gray-400 dark:ring-white/[0.08]">
                        {c.clientName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${locale}/agent/clients/${encodeURIComponent(c.clientUserId)}`}
                        className="truncate text-[13px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {c.clientName}
                      </Link>
                      <p className="truncate text-xs text-(--muted-foreground)">
                        {c.clientPhone || c.clientEmail}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {c.activeProducts.length > 0 ? (
                          c.activeProducts.slice(0, 3).map((product) => (
                            <span
                              key={`${c.clientUserId}-${product.slug}`}
                              className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            >
                              {product.name}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {t.noActiveProducts}
                          </span>
                        )}
                        {c.activeProducts.length > 3 ? (
                          <span className="text-[10px] text-(--muted-foreground)">
                            +{c.activeProducts.length - 3} {t.activeProducts}
                          </span>
                        ) : null}
                        {!c.clientIsPhoneVerified ? (
                          <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            {t.needsActivation}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Badges + actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    {/* Wallet */}
                    <span className="flex items-center gap-1 rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold tabular-nums dark:border-white/[0.06]">
                      <HiOutlineWallet className="h-3 w-3 text-(--muted-foreground)" />
                      {c.walletBalance.toFixed(3)}
                    </span>

                    {/* Business status badge */}
                    {c.hasBusiness || c.requestStatus === "approved" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                        {t.hasBusiness}
                      </span>
                    ) : c.requestStatus === "pending" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                        <HiOutlineClock className="h-3.5 w-3.5" />
                        {t.requestPending}
                      </span>
                    ) : c.requestStatus === "rejected" ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
                          <HiOutlineXCircle className="h-3.5 w-3.5" />
                          {t.requestRejected}
                        </span>
                        <Link
                          href={`/${locale}/agent/businesses/new?clientId=${c.clientUserId}&clientName=${encodeURIComponent(c.clientName)}`}
                          aria-disabled={!c.clientIsPhoneVerified}
                          onClick={(event) => {
                            if (!c.clientIsPhoneVerified) event.preventDefault();
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 aria-disabled:pointer-events-none aria-disabled:opacity-45 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
                        >
                          <HiOutlineOfficeBuilding className="h-3.5 w-3.5" />
                          {t.registerBusiness}
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500 dark:bg-red-950/30 dark:text-red-400">
                          <HiOutlineExclamationCircle className="h-3.5 w-3.5" />
                          {t.noBusiness}
                        </span>
                        <Link
                          href={`/${locale}/agent/businesses/new?clientId=${c.clientUserId}&clientName=${encodeURIComponent(c.clientName)}`}
                          aria-disabled={!c.clientIsPhoneVerified}
                          onClick={(event) => {
                            if (!c.clientIsPhoneVerified) event.preventDefault();
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 aria-disabled:pointer-events-none aria-disabled:opacity-45 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
                        >
                          <HiOutlineOfficeBuilding className="h-3.5 w-3.5" />
                          {t.registerBusiness}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-(--muted-foreground)">
                  {search ? (locale === "ar" ? "لا توجد نتائج" : "No results found") : "—"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
