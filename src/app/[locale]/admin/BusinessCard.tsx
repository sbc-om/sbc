"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Business } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";
import { deleteBusinessAction } from "./actions";
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

  return (
    <div className="sbc-card sbc-card--interactive p-5 sm:flex sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">
          {ar ? business.name.ar : business.name.en}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
          <span className="font-mono">/{business.slug}</span>
          {business.city && <span>{business.city}</span>}
          {categoryName && <span className="sbc-chip px-2 py-0.5 rounded-md text-xs">{categoryName}</span>}
        </div>
      </div>

      <div className="mt-4 sm:mt-0 flex shrink-0 flex-wrap items-center gap-2">
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
