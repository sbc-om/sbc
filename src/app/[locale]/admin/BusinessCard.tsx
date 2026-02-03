"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Business } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";
import { approveBusinessAction, deleteBusinessAction } from "./actions";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(false);
  const isApproved = business.isApproved ?? business.isVerified ?? false;
  const coverImage = business.media?.cover || business.media?.logo || business.media?.banner;
  const logo = business.media?.logo;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBusinessAction(locale, business.id);
      router.refresh();
    } catch {
      setDeleting(false);
      alert(ar ? "فشل الحذف" : "Delete failed");
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await approveBusinessAction(locale, business.id);
      router.refresh();
    } catch {
      setApproving(false);
      alert(ar ? "فشل الاعتماد" : "Approve failed");
    }
  };

  return (
    <div className="sbc-card sbc-card--interactive p-4 sm:flex sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Cover Thumbnail */}
      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-(--surface)">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl font-bold text-(--muted-foreground) bg-(--chip-bg)">
            {(ar ? business.name.ar : business.name.en).charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 mt-3 sm:mt-0">
        <div className="flex items-center gap-2 min-w-0">
          {logo && (
            <div className="relative w-6 h-6 shrink-0 rounded-full overflow-hidden ring-1 ring-(--surface-border)">
              <Image src={logo} alt="" fill sizes="24px" className="object-cover" />
            </div>
          )}
          <div className="truncate text-sm font-semibold text-foreground">
            {ar ? business.name.ar : business.name.en}
          </div>
          {!isApproved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 4.5a.75.75 0 00-1.5 0v4.25c0 .414.336.75.75.75h3a.75.75 0 000-1.5h-2.25V6.5z" />
              </svg>
              {ar ? "قيد المراجعة" : "Pending review"}
            </span>
          ) : null}
          {business.isVerified ? (
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 text-blue-600"
              aria-label={ar ? "نشاط موثق" : "Verified business"}
              title={ar ? "نشاط موثق" : "Verified business"}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
              </svg>
            </span>
          ) : null}
          {business.isSpecial ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
              </svg>
              {ar ? "مميز" : "Special"}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
          <span className="font-mono">/{business.slug}</span>
          {business.city && <span>{business.city}</span>}
          {categoryName && <span className="sbc-chip px-2 py-0.5 rounded-md text-xs">{categoryName}</span>}
          {business.homepageTop ? (
            <span className="sbc-chip px-2 py-0.5 rounded-md text-xs">
              {ar ? "أفضل 3" : "Top 3"}
            </span>
          ) : business.homepageFeatured ? (
            <span className="sbc-chip px-2 py-0.5 rounded-md text-xs">
              {ar ? "قائمة 12" : "Top 12"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 sm:mt-0 flex shrink-0 flex-wrap items-center gap-2">
        {!isApproved ? (
          <Button
            variant="primary"
            size="xs"
            onClick={handleApprove}
            disabled={approving}
            type="button"
          >
            {approving ? (ar ? "..." : "...") : (ar ? "اعتماد" : "Approve")}
          </Button>
        ) : null}
        <Link
          href={`/${locale}/businesses/${business.slug}`}
          className={buttonVariants({ variant: "ghost", size: "xs" })}
        >
          {ar ? "عرض" : "View"}
        </Link>
        <Link
          href={`/${locale}/admin/${business.id}/edit`}
          className={buttonVariants({ variant: "secondary", size: "xs" })}
        >
          {ar ? "تعديل" : "Edit"}
        </Link>
        <ConfirmDialog
          title={ar ? "تأكيد الحذف" : "Confirm Delete"}
          message={ar ? `هل تريد حذف "${ar ? business.name.ar : business.name.en}"؟` : `Delete "${business.name.en}"?`}
          confirmText={ar ? "حذف" : "Delete"}
          cancelText={ar ? "إلغاء" : "Cancel"}
          onConfirm={handleDelete}
          variant="destructive"
          trigger={
            <Button variant="destructive" size="xs" disabled={deleting} type="button">
              {deleting ? (ar ? "..." : "...") : (ar ? "حذف" : "Delete")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
