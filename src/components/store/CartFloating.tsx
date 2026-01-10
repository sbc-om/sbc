"use client";

import React from "react";
import Link from "next/link";
import { HiShoppingCart, HiX, HiTrash, HiArrowRight, HiCreditCard } from "react-icons/hi";

import type { Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/cn";
import { localeDir } from "@/lib/i18n/locales";
import {
  formatStorePrice,
  getStoreProductBySlug,
  getStoreProductText,
  listStoreProducts,
} from "@/lib/store/products";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/store/CartProvider";

function cartTotalOMR(locale: Locale, items: { slug: string; quantity: number }[]) {
  // All store prices are expected to be OMR.
  const products = listStoreProducts();
  let total = 0;
  for (const it of items) {
    const p = products.find((x) => x.slug === it.slug);
    if (!p) continue;
    total += p.price.amount * it.quantity;
  }
  return formatStorePrice({ amount: total, currency: "OMR" }, locale);
}

export function CartFloating({ locale }: { locale: Locale }) {
  const { state, itemCount, remove, clear } = useCart();
  const [open, setOpen] = React.useState(false);
  if (itemCount <= 0) return null;

  const rtl = localeDir(locale) === "rtl";
  const rootPos = rtl ? "left-4" : "right-4";
  const align = rtl ? "items-start" : "items-end";

  const total = cartTotalOMR(locale, state.items);
  const t = {
    title: locale === "ar" ? "السلة" : "Your cart",
    totalLabel: locale === "ar" ? "الإجمالي" : "Total",
    checkout: locale === "ar" ? "الدفع" : "Checkout",
    clear: locale === "ar" ? "مسح" : "Clear",
    emptyNote: locale === "ar" ? "لا توجد عناصر." : "No items.",
    removeLabel: locale === "ar" ? "إزالة" : "Remove",
  };

  return (
    <div
      className={cn(
        // MobileNav is `lg:hidden`, so we keep the cart above it on <lg.
        // Include safe-area inset for iOS.
        "fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:bottom-4 z-50",
        rootPos,
      )}
    >
      <div className={cn("flex flex-col gap-2", align)}>
        {open ? (
          <div
            className={cn(
              "sbc-card w-90 max-w-[calc(100vw-2rem)] rounded-3xl p-4 shadow-(--shadow-hover)",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <HiShoppingCart className="h-5 w-5 text-(--muted-foreground)" />
                  <div className="text-sm font-semibold">{t.title}</div>
                </div>
                <div className="mt-1 text-xs text-(--muted-foreground)">
                  {t.totalLabel}: <span className="font-semibold text-foreground">{total}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                aria-label={locale === "ar" ? "إغلاق" : "Close"}
                onClick={() => setOpen(false)}
              >
                <HiX className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-3 grid gap-2">
              {state.items.length === 0 ? (
                <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-3 text-sm text-(--muted-foreground)">
                  {t.emptyNote}
                </div>
              ) : null}

              {state.items.map((it) => {
                const p = getStoreProductBySlug(it.slug);
                if (!p) return null;
                const text = getStoreProductText(p, locale);

                return (
                  <div
                    key={it.slug}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) px-3 py-2",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{text.name}</div>
                      <div className="text-xs text-(--muted-foreground)">
                        {formatStorePrice(p.price, locale)}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t.removeLabel}
                      title={t.removeLabel}
                      className="text-(--muted-foreground) hover:text-foreground"
                      onClick={() => remove(it.slug)}
                    >
                      <HiTrash className="h-5 w-5" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/${locale}/store/checkout`}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-(--accent-foreground) shadow-(--shadow) hover:brightness-[1.05] active:brightness-[0.97]",
                )}
              >
                <HiCreditCard className="h-5 w-5" />
                {t.checkout}
                <HiArrowRight className={cn("h-5 w-5", rtl ? "rotate-180" : "")} />
              </Link>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => clear()}>
                  {t.clear}
                </Button>
                <div className="text-sm font-semibold">{total}</div>
              </div>
            </div>
          </div>
        ) : null}

        <Button
          variant="primary"
          size="icon"
          className="shadow-(--shadow-hover) relative"
          aria-label={locale === "ar" ? "فتح السلة" : "Open cart"}
          onClick={() => setOpen((v) => !v)}
        >
          <HiShoppingCart className="h-5 w-5" />
          <span
            className={cn(
              "absolute -top-1 -right-1 rounded-full bg-foreground text-background text-[10px] px-1.5 py-0.5 tabular-nums",
              rtl ? "-right-auto -left-1" : "",
            )}
          >
            {itemCount}
          </span>
        </Button>
      </div>
    </div>
  );
}
