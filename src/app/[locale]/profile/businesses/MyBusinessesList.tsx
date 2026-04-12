"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDotsVertical,
} from "react-icons/hi";
import type { Locale } from "@/lib/i18n/locales";
import type { Business } from "@/lib/db/types";
import type { Category } from "@/lib/db/types";
import type { BusinessRequest } from "@/lib/db/businessRequests";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const texts = {
  en: {
    title: "My Businesses",
    newBusiness: "Register New Business",
    search: "Search businesses...",
    all: "All",
    approved: "Approved",
    pending: "Pending",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    category: "Category",
    city: "City",
    phone: "Phone",
    created: "Created",
    confirmDelete: "Are you sure you want to delete this business? This action cannot be undone.",
    deleting: "Deleting...",
    deleted: "Business deleted successfully",
    deleteError: "Failed to delete business",
    emptyTitle: "No businesses yet",
    emptyDesc: "Register your first business to get started",
    pendingRequests: "Pending Requests",
    requestStatus: {
      pending: "Pending Review",
      approved: "Approved",
      rejected: "Rejected",
    },
  },
  ar: {
    title: "أعمالي",
    newBusiness: "تسجيل عمل جديد",
    search: "بحث عن عمل...",
    all: "الكل",
    approved: "معتمد",
    pending: "قيد المراجعة",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    category: "التصنيف",
    city: "المدينة",
    phone: "الهاتف",
    created: "تاريخ الإنشاء",
    confirmDelete: "هل أنت متأكد من حذف هذا العمل؟ لا يمكن التراجع عن هذا الإجراء.",
    deleting: "جارٍ الحذف...",
    deleted: "تم حذف العمل بنجاح",
    deleteError: "فشل حذف العمل",
    emptyTitle: "لا توجد أعمال بعد",
    emptyDesc: "سجّل عملك الأول للبدء",
    pendingRequests: "الطلبات المعلقة",
    requestStatus: {
      pending: "قيد المراجعة",
      approved: "مقبول",
      rejected: "مرفوض",
    },
  },
};

export function MyBusinessesList({
  locale,
  businesses,
  requests,
  categoriesById,
}: {
  locale: Locale;
  businesses: Business[];
  requests: BusinessRequest[];
  categoriesById: Record<string, Category>;
}) {
  const t = texts[locale];
  const ar = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) =>
        b.name.en.toLowerCase().includes(q) ||
        b.name.ar.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q) ||
        b.phone?.includes(q),
    );
  }, [businesses, search]);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(ar ? "ar-OM" : "en-OM", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  };

  const handleDelete = async (businessId: string) => {
    if (!confirm(t.confirmDelete)) return;
    setDeletingId(businessId);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t.deleteError);
      }
      toast({ message: t.deleted, variant: "success" });
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t.deleteError;
      toast({ message: msg, variant: "error" });
    } finally {
      setDeletingId(null);
      setMenuOpenId(null);
    }
  };

  const statusBadge = (b: Business) => {
    if (b.isApproved) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <HiOutlineCheckCircle className="h-3 w-3" />
          {t.approved}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <HiOutlineClock className="h-3 w-3" />
        {t.pending}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        </div>
        <Link href={`/${locale}/business-request`}>
          <Button variant="primary" className="gap-2">
            <HiOutlinePlus className="h-4 w-4" />
            {t.newBusiness}
          </Button>
        </Link>
      </div>

      {/* Pending / Rejected requests */}
      {(pendingRequests.length > 0 || rejectedRequests.length > 0) && (
        <div className="space-y-3">
          {[...pendingRequests, ...rejectedRequests].map((req) => (
            <div
              key={req.id}
              className="sbc-card rounded-2xl p-4 flex items-center gap-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  req.status === "pending"
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                {req.status === "pending" ? (
                  <HiOutlineClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <HiOutlineXCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {ar ? req.name.ar : req.name.en}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      req.status === "pending"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {t.requestStatus[req.status as keyof typeof t.requestStatus]}
                  </span>
                </div>
                {req.adminResponse && (
                  <p className="mt-1 text-xs text-(--muted-foreground)">
                    {req.adminResponse}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {businesses.length > 0 && (
        <div className="relative">
          <HiOutlineSearch className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--muted-foreground)" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="ps-10"
          />
        </div>
      )}

      {/* Business cards */}
      {businesses.length === 0 && pendingRequests.length === 0 ? (
        <div className="sbc-card rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--chip-bg)">
            <svg
              className="h-8 w-8 text-(--muted-foreground)"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="font-semibold">{t.emptyTitle}</h3>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {t.emptyDesc}
          </p>
          <Link
            href={`/${locale}/business-request`}
            className="mt-4 inline-block"
          >
            <Button variant="primary" className="gap-2">
              <HiOutlinePlus className="h-4 w-4" />
              {t.newBusiness}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((biz) => {
            const cat = biz.categoryId
              ? categoriesById[biz.categoryId]
              : null;
            const isDeleting = deletingId === biz.id;
            const isMenuOpen = menuOpenId === biz.id;

            return (
              <div
                key={biz.id}
                className={`sbc-card rounded-2xl p-5 transition-opacity ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex gap-4">
                  {/* Logo / placeholder */}
                  <div className="shrink-0">
                    {biz.media?.logo ? (
                      <Image
                        src={biz.media.logo}
                        alt={ar ? biz.name.ar : biz.name.en}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-xl object-cover ring-1 ring-(--border)"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-(--chip-bg) ring-1 ring-(--border)">
                        <svg
                          className="h-7 w-7 text-(--muted-foreground)"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold truncate text-base">
                        {ar ? biz.name.ar : biz.name.en}
                      </h3>
                      {statusBadge(biz)}
                      {biz.isVerified && (
                        <svg
                          className="h-4 w-4 text-blue-500 shrink-0"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-(--muted-foreground) truncate mb-2">
                      {ar ? biz.name.en : biz.name.ar}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--muted-foreground)">
                      {cat && (
                        <span>
                          {t.category}:{" "}
                          {ar ? cat.name.ar : cat.name.en}
                        </span>
                      )}
                      {biz.city && (
                        <span>
                          {t.city}: {biz.city}
                        </span>
                      )}
                      {biz.phone && (
                        <span>
                          {t.phone}: {biz.phone}
                        </span>
                      )}
                      <span>
                        {t.created}: {formatDate(biz.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions menu */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setMenuOpenId(isMenuOpen ? null : biz.id)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-(--chip-bg) transition-colors"
                    >
                      <HiOutlineDotsVertical className="h-5 w-5 text-(--muted-foreground)" />
                    </button>
                    {isMenuOpen && (
                      <>
                        {/* backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div className="absolute end-0 top-full z-50 mt-1 w-44 rounded-xl bg-(--card) border border-(--border) shadow-lg overflow-hidden">
                          <Link
                            href={`/${locale}/directory/businesses/${biz.slug || biz.id}`}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-(--chip-bg) transition-colors"
                            onClick={() => setMenuOpenId(null)}
                          >
                            <HiOutlineExternalLink className="h-4 w-4 text-(--muted-foreground)" />
                            {t.view}
                          </Link>
                          <Link
                            href={`/${locale}/directory/businesses/${biz.id}/edit`}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-(--chip-bg) transition-colors"
                            onClick={() => setMenuOpenId(null)}
                          >
                            <HiOutlinePencil className="h-4 w-4 text-(--muted-foreground)" />
                            {t.edit}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(biz.id)}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                            {isDeleting ? t.deleting : t.delete}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
