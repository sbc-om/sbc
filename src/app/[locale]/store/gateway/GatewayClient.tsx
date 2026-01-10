"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { HiLockClosed, HiCreditCard, HiArrowRight, HiX } from "react-icons/hi";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { cn } from "@/lib/cn";
import { formatStorePrice, getStoreProductBySlug, getStoreProductText } from "@/lib/store/products";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/store/CartProvider";

function cartTotalOMR(locale: Locale, slugs: string[]) {
  let total = 0;
  for (const slug of slugs) {
    const p = getStoreProductBySlug(slug);
    if (!p) continue;
    total += p.price.amount;
  }
  return formatStorePrice({ amount: total, currency: "OMR" }, locale);
}

export function GatewayClient({ locale }: { locale: Locale }) {
  const { state } = useCart();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return") || `/${locale}/store/checkout`;

  const ar = locale === "ar";
  const rtl = localeDir(locale) === "rtl";

  const slugs = state.items.map((it) => it.slug);
  const total = cartTotalOMR(locale, slugs);

  const redirect = (status: "success" | "cancel") => {
    const tx = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    const url = new URL(returnUrl, window.location.origin);
    url.searchParams.set("status", status);
    url.searchParams.set("tx", tx);
    window.location.href = url.toString();
  };

  return (
    <div className="mt-8 sbc-card rounded-3xl p-6 max-w-[720px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HiLockClosed className="h-5 w-5 text-(--muted-foreground)" />
            <h2 className="text-lg font-semibold">
              {ar ? "بوابة دفع افتراضية" : "Fake Payment Gateway"}
            </h2>
          </div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "هذه الصفحة تحاكي بوابة دفع خارجية. اضغط (دفع) أو (إلغاء) للعودة."
              : "This page simulates an external payment gateway. Click Pay or Cancel to return."}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={ar ? "إلغاء" : "Cancel"}
          onClick={() => redirect("cancel")}
        >
          <HiX className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
        <div className="text-sm text-(--muted-foreground)">{ar ? "المبلغ" : "Amount"}</div>
        <div className="mt-1 text-2xl font-semibold">{total}</div>
      </div>

      {slugs.length ? (
        <div className="mt-4 grid gap-2">
          {slugs.map((slug) => {
            const p = getStoreProductBySlug(slug);
            if (!p) return null;
            const text = getStoreProductText(p, locale);
            return (
              <div
                key={slug}
                className="flex items-center justify-between gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{text.name}</div>
                  <div className="text-xs text-(--muted-foreground)">{formatStorePrice(p.price, locale)}</div>
                </div>
                <div className="text-xs text-(--muted-foreground)">{ar ? "مرة واحدة" : "One-time"}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-(--surface-border) bg-(--surface) p-4 text-sm text-(--muted-foreground)">
          {ar ? "لا توجد عناصر في السلة." : "No items in cart."}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          variant="primary"
          size="md"
          className="sm:flex-1"
          disabled={!slugs.length}
          onClick={() => redirect("success")}
        >
          <HiCreditCard className="h-5 w-5" />
          {ar ? "دفع" : "Pay"}
          <HiArrowRight className={cn("h-5 w-5", rtl ? "rotate-180" : "")} />
        </Button>
        <Button variant="secondary" size="md" className="sm:flex-1" onClick={() => redirect("cancel")}
        >
          {ar ? "إلغاء" : "Cancel"}
        </Button>
      </div>

      <div className="mt-4 text-xs text-(--muted-foreground)">
        {ar
          ? "لن يتم إجراء أي دفع فعلي."
          : "No real payment is processed."}
      </div>
    </div>
  );
}
