"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi";
import type { Locale } from "@/lib/i18n/locales";
import type { BusinessRequest } from "@/lib/db/businessRequests";
import type { Category } from "@/lib/db/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const texts = {
  en: {
    title: "My Business Registrations",
    subtitle: "Businesses you've submitted for admin approval",
    newBusiness: "Register New Business",
    search: "Search businesses...",
    all: "All",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    noResults: "No business registrations yet",
    noResultsDesc: "Start by registering a new business",
    status: { pending: "Pending", approved: "Approved", rejected: "Rejected" },
    category: "Category",
    city: "City",
    phone: "Phone",
    submitted: "Submitted",
  },
  ar: {
    title: "تسجيلات الأعمال",
    subtitle: "الأعمال التي أرسلتها للموافقة",
    newBusiness: "تسجيل عمل جديد",
    search: "بحث عن عمل...",
    all: "الكل",
    pending: "قيد المراجعة",
    approved: "مقبول",
    rejected: "مرفوض",
    noResults: "لا توجد تسجيلات بعد",
    noResultsDesc: "ابدأ بتسجيل عمل جديد",
    status: { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" },
    category: "التصنيف",
    city: "المدينة",
    phone: "الهاتف",
    submitted: "تاريخ الإرسال",
  },
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export function AgentBusinessesList({
  locale,
  requests,
  categoriesById,
}: {
  locale: Locale;
  requests: BusinessRequest[];
  categoriesById: Record<string, Category>;
}) {
  const t = texts[locale];
  const ar = locale === "ar";
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = requests;
    if (filter !== "all") list = list.filter((r) => r.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.en.toLowerCase().includes(q) ||
          r.name.ar.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q) ||
          r.phone?.includes(q)
      );
    }
    return list;
  }, [requests, filter, search]);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <HiOutlineClock className="h-4 w-4 text-amber-500" />;
      case "approved":
        return <HiOutlineCheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <HiOutlineXCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
      approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || ""}`}>
        {statusIcon(status)}
        {t.status[status as keyof typeof t.status]}
      </span>
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(ar ? "ar-OM" : "en-OM", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
        </div>
        <Link href={`/${locale}/agent/businesses/new`}>
          <Button variant="primary" className="gap-2">
            <HiOutlinePlus className="h-4 w-4" />
            {t.newBusiness}
          </Button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <HiOutlineSearch className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--muted-foreground)" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="ps-10"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-(--surface) border border-(--surface-border) p-1">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-accent text-white shadow-sm"
                  : "text-(--muted-foreground) hover:text-foreground"
              }`}
            >
              {t[f]} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Business list */}
      {filtered.length === 0 ? (
        <div className="sbc-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--chip-bg)">
            <HiOutlinePlus className="h-8 w-8 text-(--muted-foreground)" />
          </div>
          <h3 className="font-semibold">{t.noResults}</h3>
          <p className="mt-1 text-sm text-(--muted-foreground)">{t.noResultsDesc}</p>
          <Link href={`/${locale}/agent/businesses/new`} className="mt-4 inline-block">
            <Button variant="primary" className="gap-2">
              <HiOutlinePlus className="h-4 w-4" />
              {t.newBusiness}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((req) => {
            const cat = req.categoryId ? categoriesById[req.categoryId] : null;
            return (
              <div
                key={req.id}
                className="sbc-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">
                      {ar ? req.name.ar : req.name.en}
                    </h3>
                    {statusBadge(req.status)}
                  </div>
                  <p className="text-sm text-(--muted-foreground) truncate">
                    {!ar ? req.name.ar : req.name.en}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-(--muted-foreground)">
                    {cat && (
                      <span>
                        {t.category}: {ar ? cat.name.ar : cat.name.en}
                      </span>
                    )}
                    {req.city && (
                      <span>
                        {t.city}: {req.city}
                      </span>
                    )}
                    {req.phone && (
                      <span>
                        {t.phone}: {req.phone}
                      </span>
                    )}
                    <span>
                      {t.submitted}: {formatDate(req.createdAt)}
                    </span>
                  </div>
                  {req.adminResponse && (
                    <div className="mt-2 rounded-lg bg-(--chip-bg) p-2 text-xs">
                      <span className="font-medium">
                        {ar ? "رد الإدارة:" : "Admin response:"}
                      </span>{" "}
                      {req.adminResponse}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
