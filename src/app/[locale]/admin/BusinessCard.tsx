"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Business } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";
import { approveBusinessAction, deleteBusinessAction } from "./actions";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  HiOutlineGlobeAlt,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineMapPin,
  HiOutlineEye,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCheckBadge,
} from "react-icons/hi2";

export function BusinessCard({
  business,
  locale,
  categoryName,
}: {
  business: Business;
  locale: Locale;
  categoryName?: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(false);
  const isApproved = business.isApproved ?? business.isVerified ?? false;
  const heroImage = business.media?.cover || business.media?.banner;
  const logo = business.media?.logo;
  const name = ar ? business.name.ar : business.name.en;
  const altName = ar ? business.name.en : business.name.ar;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBusinessAction(locale, business.id);
      router.refresh();
    } catch {
      setDeleting(false);
      toast({ message: ar ? "فشل الحذف" : "Delete failed", variant: "error" });
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveBusinessAction(locale, business.id);
      router.refresh();
    } catch {
      setApproving(false);
      toast({ message: ar ? "فشل الاعتماد" : "Approve failed", variant: "error" });
    }
  };

  return (
    <article
      className="overflow-hidden rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg"
      style={{
        background: "var(--business-card-bg, var(--card))",
        border: "1px solid var(--surface-border, var(--border))",
      }}
    >
      {/* Hero */}
      <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-linear-to-br from-accent/10 to-accent-2/10">
        {heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/15 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-black bg-linear-to-br from-accent to-accent-2 bg-clip-text text-transparent opacity-15">
              {name.charAt(0)}
            </div>
          </div>
        )}

        {/* Status badges on hero */}
        <div className="absolute top-2.5 end-2.5 flex items-center gap-1.5">
          {!isApproved && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-md bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 4.5a.75.75 0 00-1.5 0v4.25c0 .414.336.75.75.75h3a.75.75 0 000-1.5h-2.25V6.5z" />
              </svg>
              {ar ? "قيد المراجعة" : "Pending"}
            </span>
          )}
          {business.isVerified && (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full backdrop-blur-md bg-blue-500/20 text-blue-500">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
              </svg>
            </span>
          )}
          {business.isSpecial && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-md bg-amber-100/80 dark:bg-amber-900/60 text-amber-700 dark:text-amber-200">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
              </svg>
              {ar ? "مميز" : "Special"}
            </span>
          )}
        </div>

        {/* Ranking badge */}
        {(business.homepageTop || business.homepageFeatured) && (
          <div className="absolute top-2.5 start-2.5">
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-md bg-white/20 text-white">
              {business.homepageTop
                ? ar ? "أفضل 3" : "Top 3"
                : ar ? "قائمة 12" : "Top 12"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative px-4 pb-4">
        {/* Logo + Name */}
        <div className="flex items-center gap-3 -mt-5">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md"
            style={{
              background: "var(--background)",
              border: "2px solid var(--surface-border, var(--border))",
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="text-lg font-bold bg-linear-to-br from-accent to-accent-2 bg-clip-text text-transparent">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-5">
            <h3 className="text-base font-bold truncate leading-tight">{name}</h3>
            {altName && altName !== name && (
              <p className="text-xs text-(--muted-foreground) truncate">{altName}</p>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-2.5 text-xs text-(--muted-foreground) flex-wrap">
          <span className="font-mono opacity-70">/{business.slug}</span>
          {business.username && (
            <span className="font-mono opacity-70">@{business.username}</span>
          )}
          {categoryName && (
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {categoryName}
            </span>
          )}
          {business.city && (
            <span className="inline-flex items-center gap-1">
              <HiOutlineMapPin className="h-3 w-3" />
              {business.city}
            </span>
          )}
        </div>

        {/* Contact row */}
        {(business.phone || business.email || business.website) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {business.phone && (
              <a href={`tel:${business.phone}`} className="inline-flex items-center gap-1.5 text-xs text-(--muted-foreground) hover:text-accent transition-colors">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-green-500/15 text-green-600 dark:text-green-400">
                  <HiOutlinePhone className="h-3 w-3" />
                </span>
                <span dir="ltr">{business.phone}</span>
              </a>
            )}
            {business.email && (
              <a href={`mailto:${business.email}`} className="inline-flex items-center gap-1.5 text-xs text-(--muted-foreground) hover:text-accent transition-colors">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-red-500/15 text-red-600 dark:text-red-400">
                  <HiOutlineEnvelope className="h-3 w-3" />
                </span>
                <span className="truncate max-w-[140px]">{business.email}</span>
              </a>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-(--muted-foreground) hover:text-accent transition-colors">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <HiOutlineGlobeAlt className="h-3 w-3" />
                </span>
                <span className="truncate max-w-[120px]">{business.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!isApproved && (
            <Button
              variant="primary"
              size="xs"
              onClick={handleApprove}
              disabled={approving}
              type="button"
            >
              <HiOutlineCheckBadge className="h-3.5 w-3.5 me-1" />
              {approving ? "..." : ar ? "اعتماد" : "Approve"}
            </Button>
          )}
          <Link
            href={`/${locale}/explorer/${business.slug}`}
            className={buttonVariants({ variant: "ghost", size: "xs" })}
          >
            <HiOutlineEye className="h-3.5 w-3.5 me-1" />
            {ar ? "عرض" : "View"}
          </Link>
          <Link
            href={`/${locale}/admin/${business.id}/edit`}
            className={buttonVariants({ variant: "secondary", size: "xs" })}
          >
            <HiOutlinePencilSquare className="h-3.5 w-3.5 me-1" />
            {ar ? "تعديل" : "Edit"}
          </Link>
          <div className="flex-1" />
          <ConfirmDialog
            title={ar ? "تأكيد الحذف" : "Confirm Delete"}
            message={ar ? `هل تريد حذف "${business.name.ar}"؟` : `Delete "${business.name.en}"?`}
            confirmText={ar ? "حذف" : "Delete"}
            cancelText={ar ? "إلغاء" : "Cancel"}
            onConfirm={handleDelete}
            variant="destructive"
            trigger={
              <Button variant="ghost" size="xs" disabled={deleting} type="button" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
                <HiOutlineTrash className="h-3.5 w-3.5 me-1" />
                {deleting ? "..." : ar ? "حذف" : "Delete"}
              </Button>
            }
          />
        </div>
      </div>
    </article>
  );
}
