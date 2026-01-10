"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { HiCreditCard, HiArrowRight, HiCheckCircle, HiXCircle, HiTrash } from "react-icons/hi";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { cn } from "@/lib/cn";
import {
  formatStorePrice,
  getStoreProductBySlug,
  getStoreProductText,
} from "@/lib/store/products";
import { Button, buttonVariants } from "@/components/ui/Button";
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

export function CheckoutClient({ locale }: { locale: Locale }) {
  const { state, clear, remove } = useCart();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const rtl = localeDir(locale) === "rtl";
  const ar = locale === "ar";

  const slugs = state.items.map((it) => it.slug);
  const total = cartTotalOMR(locale, slugs);

  const copy = {
    cartEmpty: ar ? "سلتك فارغة." : "Your cart is empty.",
    backToStore: ar ? "العودة للمتجر" : "Back to store",
    pay: ar ? "الدفع عبر البوابة" : "Pay with gateway",
    redirecting: ar ? "جارٍ تحويلك…" : "Redirecting…",
    success: ar ? "تم الدفع بنجاح (بوابة افتراضية)." : "Payment successful (fake gateway).",
    cancel: ar ? "تم إلغاء الدفع." : "Payment canceled.",
    totalLabel: ar ? "الإجمالي" : "Total",
    removeHint: ar ? "يمكنك إزالة العناصر من السلة." : "You can remove items from the cart.",
    clear: ar ? "مسح السلة" : "Clear cart",
  };

  // Optional: clear cart after a successful return.
  React.useEffect(() => {
    if (status === "success") {
      // Clear once on success so items don't remain after "purchase".
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const returnUrl = `/${locale}/store/checkout`;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 sbc-card rounded-2xl p-6">
        {status === "success" ? (
          <div className="flex items-start gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
            <HiCheckCircle className="h-6 w-6 text-emerald-500" />
            <div>
              <div className="text-sm font-semibold">{copy.success}</div>
              <div className="mt-1 text-sm text-(--muted-foreground)">
                {ar
                  ? "تمت محاكاة عملية الدفع بنجاح."
                  : "This is a simulated payment flow."}
              </div>
            </div>
          </div>
        ) : null}

        {status === "cancel" ? (
          <div className="flex items-start gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
            <HiXCircle className="h-6 w-6 text-red-500" />
            <div>
              <div className="text-sm font-semibold">{copy.cancel}</div>
              <div className="mt-1 text-sm text-(--muted-foreground)">
                {ar ? "يمكنك المحاولة مرة أخرى." : "You can try again."}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{ar ? "المشتريات" : "Items"}</h2>
          <Link
            href={`/${locale}/store`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {copy.backToStore}
          </Link>
        </div>

        {slugs.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-(--surface-border) bg-(--surface) p-4 text-sm text-(--muted-foreground)">
            {copy.cartEmpty}
          </div>
        ) : (
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
                    <div className="text-xs text-(--muted-foreground)">
                      {formatStorePrice(p.price, locale)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${locale}/store/${p.slug}`}
                      className={buttonVariants({ variant: "secondary", size: "xs" })}
                    >
                      {ar ? "عرض" : "View"}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={ar ? "حذف" : "Remove"}
                      title={ar ? "حذف" : "Remove"}
                      className="text-(--muted-foreground) hover:text-foreground"
                      onClick={() => remove(slug)}
                    >
                      <HiTrash className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {slugs.length > 0 ? (
          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => clear()}>
              {copy.clear}
            </Button>
            <div className="text-sm font-semibold">
              {copy.totalLabel}: {total}
            </div>
          </div>
        ) : null}
      </div>

      <aside className="sbc-card rounded-2xl p-6">
        <div className="text-sm text-(--muted-foreground)">{copy.totalLabel}</div>
        <div className="mt-1 text-2xl font-semibold">{total}</div>

        <div className="mt-4 grid gap-3">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={slugs.length === 0}
            onClick={() => {
              const gatewayUrl = `/${locale}/store/gateway?return=${encodeURIComponent(returnUrl)}`;
              // Simulate a real external redirect.
              window.location.href = gatewayUrl;
            }}
          >
            <HiCreditCard className="h-5 w-5" />
            {copy.pay}
            <HiArrowRight className={cn("h-5 w-5", rtl ? "rotate-180" : "")} />
          </Button>

          <div className="text-xs text-(--muted-foreground)">
            {ar
              ? "هذه بوابة دفع افتراضية لأغراض العرض فقط."
              : "This is a fake payment gateway for demo purposes."}
          </div>
        </div>
      </aside>
    </div>
  );
}
