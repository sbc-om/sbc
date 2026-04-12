"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import type { Business } from "@/lib/db/types";
import { buttonVariants } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { BusinessCard } from "../BusinessCard";
import {
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePlus,
  HiOutlineArrowLeft,
} from "react-icons/hi";
import { HiOutlineBuildingStorefront, HiOutlineClock, HiOutlineCheckBadge, HiArrowPath } from "react-icons/hi2";

interface Category {
  id: string;
  name: { en: string; ar: string };
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface Counts {
  total: number;
  pending: number;
  approved: number;
}

interface BusinessesClientProps {
  locale: Locale;
  initialBusinesses: Business[];
  categories: Category[];
  initialFilter: "all" | "pending" | "approved";
  initialSearch: string;
  pagination: Pagination;
  counts: Counts;
}

export function BusinessesClient({
  locale,
  initialBusinesses,
  categories,
  initialFilter,
  initialSearch,
  pagination: initialPagination,
  counts: initialCounts,
}: BusinessesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [counts, setCounts] = useState<Counts>(initialCounts);

  const isRTL = locale === "ar";
  const categoriesById = new Map(categories.map((c) => [c.id, c] as const));

  const texts = {
    title: isRTL ? "إدارة الأنشطة التجارية" : "Manage Businesses",
    all: isRTL ? "الكل" : "All",
    pending: isRTL ? "قيد المراجعة" : "Pending",
    approved: isRTL ? "معتمد" : "Approved",
    searchPlaceholder: isRTL ? "بحث بالاسم، الفئة، المدينة..." : "Search by name, category, city...",
    search: isRTL ? "بحث" : "Search",
    noResults: isRTL ? "لا توجد نتائج مطابقة" : "No matching businesses found",
    noResultsSub: isRTL ? "جرب تعديل كلمات البحث أو الفلتر" : "Try adjusting your search or filter",
    addFirst: isRTL ? "إضافة أول نشاط تجاري" : "Add your first business",
    emptyState: isRTL ? "لا توجد أنشطة تجارية بعد" : "No businesses yet",
    emptySub: isRTL ? "ابدأ بإضافة نشاط تجاري جديد" : "Get started by adding a new business",
    addBusiness: isRTL ? "إضافة نشاط" : "Add Business",
    back: isRTL ? "العودة" : "Back",
    showing: isRTL ? "عرض" : "Showing",
    of: isRTL ? "من" : "of",
    results: isRTL ? "نتيجة" : "results",
    previous: isRTL ? "السابق" : "Previous",
    next: isRTL ? "التالي" : "Next",
    fetchError: isRTL ? "حدث خطأ أثناء تحميل البيانات" : "Failed to load businesses",
    retry: isRTL ? "إعادة المحاولة" : "Retry",
    totalLabel: isRTL ? "إجمالي الأنشطة" : "Total",
    pendingLabel: isRTL ? "قيد المراجعة" : "Pending",
    approvedLabel: isRTL ? "معتمدة" : "Approved",
  };

  const buildUrl = useCallback((filter: string, page: number, search: string) => {
    const params = new URLSearchParams();
    if (filter && filter !== "all") params.set("filter", filter);
    if (page > 1) params.set("page", String(page));
    if (search) params.set("q", search);
    const queryString = params.toString();
    return `/${locale}/admin/businesses${queryString ? `?${queryString}` : ""}`;
  }, [locale]);

  const fetchBusinesses = useCallback(async (filter: string, page: number, search: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (filter && filter !== "all") params.set("filter", filter);
      params.set("page", String(page));
      if (search) params.set("q", search);

      const res = await fetch(`/api/admin/businesses?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok) {
        setBusinesses(data.businesses);
        setPagination(data.pagination);
        setCounts(data.counts);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (error) {
      const msg = isRTL ? "حدث خطأ أثناء تحميل البيانات" : "Failed to load businesses";
      setFetchError(msg);
      toast({ message: msg, variant: "error" });
      console.error("Failed to fetch businesses:", error);
    } finally {
      setLoading(false);
    }
  }, [isRTL, toast]);

  const refreshBusinesses = useCallback(async () => {
    await fetchBusinesses(activeFilter, pagination.page, searchQuery);
  }, [activeFilter, pagination.page, searchQuery, fetchBusinesses]);

  const handleFilterChange = async (filter: string) => {
    setActiveFilter(filter);
    await fetchBusinesses(filter, 1, searchQuery);
    router.replace(buildUrl(filter, 1, searchQuery), { scroll: false });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    await fetchBusinesses(activeFilter, 1, searchInput);
    router.replace(buildUrl(activeFilter, 1, searchInput), { scroll: false });
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    await fetchBusinesses(activeFilter, newPage, searchQuery);
    router.replace(buildUrl(activeFilter, newPage, searchQuery), { scroll: false });
  };

  const filterButtons = [
    { key: "all", label: texts.all, count: counts.total },
    { key: "pending", label: texts.pending, count: counts.pending },
    { key: "approved", label: texts.approved, count: counts.approved },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {texts.title}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshBusinesses}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-(--surface) transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <HiArrowPath className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href={`/${locale}/admin`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <HiOutlineArrowLeft className="h-4 w-4 me-1" />
            {texts.back}
          </Link>
          <Link
            href={`/${locale}/admin/new`}
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            <HiOutlinePlus className="h-4 w-4 me-1" />
            {texts.addBusiness}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-3">
        <div className="sbc-card !border-0 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-(--muted-foreground)">
            <HiOutlineBuildingStorefront className="h-4 w-4" />
            {texts.totalLabel}
          </div>
          <div className="mt-2 text-2xl font-bold">{counts.total}</div>
        </div>
        <div className="sbc-card !border-0 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-(--muted-foreground)">
            <HiOutlineClock className="h-4 w-4" />
            {texts.pendingLabel}
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{counts.pending}</div>
        </div>
        <div className="sbc-card !border-0 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-(--muted-foreground)">
            <HiOutlineCheckBadge className="h-4 w-4" />
            {texts.approvedLabel}
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{counts.approved}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-4">
        {/* Filter Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-(--surface)">
          {filterButtons.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              disabled={loading}
              className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 ${
                activeFilter === key
                  ? "bg-accent text-white shadow-md"
                  : "hover:bg-(--surface-hover) text-(--muted-foreground)"
              }`}
            >
              <span>{label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeFilter === key
                  ? "bg-white/20"
                  : "bg-(--surface-border)"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-(--muted-foreground)" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={texts.searchPlaceholder}
              className="w-full ps-12 pe-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              style={{ borderColor: "var(--surface-border)" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all disabled:opacity-70 shadow-sm hover:shadow-md"
          >
            {texts.search}
          </button>
        </form>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-center">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{fetchError}</p>
          <button
            onClick={refreshBusinesses}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
          >
            <HiArrowPath className="h-4 w-4" />
            {texts.retry}
          </button>
        </div>
      )}

      {/* Results info */}
      {pagination.total > 0 && (
        <div className="text-sm text-(--muted-foreground)">
          {texts.showing} {((pagination.page - 1) * pagination.perPage) + 1}-{Math.min(pagination.page * pagination.perPage, pagination.total)} {texts.of} {pagination.total} {texts.results}
        </div>
      )}

      {/* Loading overlay */}
      <div className={`transition-opacity duration-200 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Business List */}
        <div className="grid gap-5 xl:grid-cols-2">
          {businesses.length === 0 && !fetchError ? (
            <div className="xl:col-span-2 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--surface)">
                <HiOutlineBuildingStorefront className="h-8 w-8 text-(--muted-foreground)" />
              </div>
              <p className="text-base font-medium">
                {searchQuery || activeFilter !== "all" ? texts.noResults : texts.emptyState}
              </p>
              <p className="mt-1 text-sm text-(--muted-foreground)">
                {searchQuery || activeFilter !== "all" ? texts.noResultsSub : texts.emptySub}
              </p>
              <Link
                href={`/${locale}/admin/new`}
                className={buttonVariants({ variant: "primary", size: "sm", className: "mt-5" })}
              >
                <HiOutlinePlus className="h-4 w-4 me-1" />
                {texts.addFirst}
              </Link>
            </div>
          ) : (
            businesses.map((b) => {
              const categoryName = b.categoryId && categoriesById.has(b.categoryId)
                ? (isRTL ? categoriesById.get(b.categoryId)!.name.ar : categoriesById.get(b.categoryId)!.name.en)
                : b.category;

              return (
                <BusinessCard
                  key={b.id}
                  business={b}
                  locale={locale}
                  categoryName={categoryName}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={loading || pagination.page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-(--surface) transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--surface-border)" }}
          >
            <HiOutlineChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.previous}</span>
          </button>

          <div className="flex items-center gap-1">
            {pagination.page > 2 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl hover:bg-(--surface) transition-colors"
                >
                  1
                </button>
                {pagination.page > 3 && <span className="px-2 text-(--muted-foreground)">…</span>}
              </>
            )}

            {pagination.page > 1 && (
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={loading}
                className="px-3 py-2 rounded-xl hover:bg-(--surface) transition-colors"
              >
                {pagination.page - 1}
              </button>
            )}

            <button
              disabled
              className="px-3 py-2 rounded-xl bg-accent text-white font-medium"
            >
              {pagination.page}
            </button>

            {pagination.page < pagination.totalPages && (
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={loading}
                className="px-3 py-2 rounded-xl hover:bg-(--surface) transition-colors"
              >
                {pagination.page + 1}
              </button>
            )}

            {pagination.page < pagination.totalPages - 1 && (
              <>
                {pagination.page < pagination.totalPages - 2 && <span className="px-2 text-(--muted-foreground)">…</span>}
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl hover:bg-(--surface) transition-colors"
                >
                  {pagination.totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={loading || pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-(--surface) transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--surface-border)" }}
          >
            <span className="hidden sm:inline">{texts.next}</span>
            <HiOutlineChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
