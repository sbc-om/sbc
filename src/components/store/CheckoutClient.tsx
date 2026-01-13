"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { HiCreditCard, HiTrash, HiArrowRight, HiCheckCircle, HiXCircle } from "react-icons/hi";

import type { Locale } from "@/lib/i18n/locales";
import type { StoreProduct } from "@/lib/store/types";
import { localeDir } from "@/lib/i18n/locales";
import { cn } from "@/lib/cn";
import { formatStorePrice, getStoreProductText } from "@/lib/store/utils";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useCart } from "@/components/store/CartProvider";

function cartTotalOMR(locale: Locale, slugs: string[], products: StoreProduct[]) {
  let total = 0;
  for (const slug of slugs) {
    const p = products.find((x) => x.slug === slug);
    if (!p) continue;
    total += p.price.amount;
  }
  return formatStorePrice({ amount: total, currency: "OMR" }, locale);
}

export function CheckoutClient({
  locale,
  products,
}: {
  locale: Locale;
  products: StoreProduct[];
}) {
  const { state, itemCount, remove, clear } = useCart();
  const sp = useSearchParams();
  const router = useRouter();

  const rtl = localeDir(locale) === "rtl";
  const total = cartTotalOMR(locale, state.items.map((i) => i.slug), products);

  const payment = sp.get("payment");

  React.useEffect(() => {
    if (payment === "success") {
      clear();
      // remove query params after success so refresh doesn't re-trigger.
      router.replace(`/${locale}/store/checkout`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  const t = {
    title: locale === "ar" ? "الدفع" : "Checkout",
    back: locale === "ar" ? "العودة للمتجر" : "Back to store",
    total: locale === "ar" ? "الإجمالي" : "Total",
    pay: locale === "ar" ? "ادفع عبر البوابة" : "Pay with gateway",
    empty: locale === "ar" ? "سلتك فارغة." : "Your cart is empty.",
    success: locale === "ar" ? "تم الدفع بنجاح (بوابة وهمية)." : "Payment successful (fake gateway).",
    cancel: locale === "ar" ? "تم إلغاء الدفع." : "Payment cancelled.",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 sbc-card rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{t.title}</h1>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "هذه خطوة دفع تجريبية — سيتم تحويلك إلى بوابة وهمية ثم العودة."
                : "This is a demo checkout — you’ll be redirected to a fake gateway and back."}
            </p>
          </div>
          <Link
            href={`/${locale}/store`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t.back}
          </Link>
        </div>

        {payment === "success" ? (
          <div className="mt-4 rounded-2xl border border-(--surface-border) bg-(--surface) p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <HiCheckCircle className="h-5 w-5 text-(--muted-foreground)" />
              {t.success}
            </div>
          </div>
        ) : null}

        {payment === "cancel" ? (
          <div className="mt-4 rounded-2xl border border-(--surface-border) bg-(--surface) p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <HiXCircle className="h-5 w-5 text-(--muted-foreground)" />
              {t.cancel}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-2">
          {itemCount === 0 ? (
            <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4 text-sm text-(--muted-foreground)">
              {t.empty}
            </div>
          ) : (
            state.items.map((it) => {
              const p = products.find((x) => x.slug === it.slug);
              if (!p) return null;
              const text = getStoreProductText(p, locale);
              return (
                <div
                  key={it.slug}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{text.name}</div>
                    <div className="text-xs text-(--muted-foreground)">{formatStorePrice(p.price, locale)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={locale === "ar" ? "حذف" : "Remove"}
                    title={locale === "ar" ? "حذف" : "Remove"}
                    className="text-(--muted-foreground) hover:text-foreground"
                    onClick={() => remove(it.slug)}
                  >
                    <HiTrash className="h-5 w-5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <aside className="sbc-card rounded-3xl p-6">
        <div className="text-sm text-(--muted-foreground)">{t.total}</div>
        <div className="mt-1 text-2xl font-semibold">{total}</div>

        <div className="mt-6 grid gap-3">
          <Link
            href={`/${locale}/store/gateway?return=${encodeURIComponent(`/${locale}/store/checkout`)}`}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-[color:var(--accent-foreground)] shadow-[var(--shadow)] hover:brightness-[1.05] active:brightness-[0.97]",
              itemCount === 0 ? "pointer-events-none opacity-60" : "",
            )}
            aria-disabled={itemCount === 0}
          >
            <HiCreditCard className="h-5 w-5" />
            {t.pay}
            <HiArrowRight className={cn("h-5 w-5", rtl ? "rotate-180" : "")} />
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => clear()}
            disabled={itemCount === 0}
          >
            {locale === "ar" ? "مسح السلة" : "Clear cart"}
          </Button>
        </div>

        <div className="mt-4 text-xs text-(--muted-foreground)">
          {locale === "ar"
            ? "هذه بوابة دفع تجريبية (وهمية) لغرض العرض فقط."
            : "This is a demo (fake) gateway for testing the flow."}
        </div>
      </aside>
    </div>
  );
}
