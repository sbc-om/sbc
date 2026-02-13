"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { StoreProduct } from "@/lib/store/types";
import type { Locale } from "@/lib/i18n/locales";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ProductCard({ product, locale }: { product: StoreProduct; locale: Locale }) {
  const router = useRouter();
  const { toast } = useToast();
  const ar = locale === "ar";
  const [loading, setLoading] = useState(false);

  const programLabels: Record<string, { en: string; ar: string }> = {
    directory: { en: "Business Directory", ar: "دليل الأعمال" },
    loyalty: { en: "Loyalty System", ar: "نظام الولاء" },
    marketing: { en: "Marketing Platform", ar: "منصة التسويق" },
  };

  const handleToggleActive = async () => {
    if (!confirm(ar ? "تغيير حالة التفعيل؟" : "Toggle active status?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle status");
      }

      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to toggle status";
      toast({ message: ar ? `خطا: ${message}` : `Error: ${message}`, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(ar ? "هل تريد حذف هذا المنتج؟" : "Delete this product?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }

      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete product";
      toast({ message: ar ? `خطا: ${message}` : `Error: ${message}`, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const programLabel = programLabels[product.program] || { en: product.program, ar: product.program };

  return (
    <div className={`sbc-card p-6 ${!product.isActive ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            {ar ? product.name.ar : product.name.en}
          </h3>
          <p className="text-sm text-(--muted-foreground) mt-1">
            {ar ? programLabel.ar : programLabel.en}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!product.isActive && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 dark:bg-gray-700 text-(--muted-foreground)">
              {ar ? "غير نشط" : "Inactive"}
            </span>
          )}
          {product.badges && product.badges.length > 0 && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-accent text-(--accent-foreground)">
              {product.badges[0]}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-(--muted-foreground) mb-4">
        {ar ? product.description.ar : product.description.en}
      </p>

      <div className="mb-4">
        <div className="text-2xl font-bold">
          {product.price.amount} {product.price.currency}
        </div>
        {product.price.interval && (
          <div className="text-sm text-(--muted-foreground)">
            {product.price.interval === "month" && (ar ? "شهرياً" : "per month")}
            {product.price.interval === "year" && (ar ? "سنوياً" : "per year")}
            {product.price.interval === "6mo" && (ar ? "كل 6 أشهر" : "per 6 months")}
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">
          {ar ? "المزايا:" : "Features:"}
        </div>
        <ul className="space-y-1">
          {(ar ? product.features?.ar : product.features?.en)?.map((feature: string, idx: number) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <svg className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 border-t text-xs text-(--muted-foreground) mb-4" style={{ borderColor: "var(--surface-border)" }}>
        <div>{ar ? "المدة:" : "Duration:"} {product.durationDays} {ar ? "يوم" : "days"}</div>
        <div className="mt-1">{ar ? "الباقة:" : "Plan:"} {product.plan}</div>
        <div className="mt-1">{ar ? "الرمز:" : "Slug:"} {product.slug}</div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/${locale}/admin/products/${product.id}/edit`}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          {ar ? "تحرير" : "Edit"}
        </Link>
        <Button
          onClick={handleToggleActive}
          disabled={loading}
          variant="ghost"
          size="sm"
        >
          {loading ? "..." : product.isActive ? (ar ? "تعطيل" : "Deactivate") : (ar ? "تفعيل" : "Activate")}
        </Button>
        <Button
          onClick={handleDelete}
          disabled={loading}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          {loading ? "..." : (ar ? "حذف" : "Delete")}
        </Button>
      </div>
    </div>
  );
}
