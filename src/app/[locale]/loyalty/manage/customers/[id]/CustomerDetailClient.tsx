"use client";

import Image from "next/image";
import React from "react";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type CustomerDTO = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  points: number;
  cardId: string;
};

export function CustomerDetailClient({
  locale,
  customer,
}: {
  locale: Locale;
  customer: CustomerDTO;
}) {
  const rtl = localeDir(locale) === "rtl";
  const ar = locale === "ar";

  const [lookupQrDataUrl, setLookupQrDataUrl] = React.useState<string | null>(null);
  const [walletQrDataUrl, setWalletQrDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function gen() {
      try {
        const origin = window.location.origin;
        const lookupUrl = `${origin}/${locale}/loyalty/manage/customers/${customer.id}`;
        const walletUrl = `${origin}/${locale}/loyalty/card/${customer.cardId}?joined=1`;
        const mod = await import("qrcode");
        const lookupData = await mod.toDataURL(lookupUrl, {
          margin: 1,
          width: 360,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setLookupQrDataUrl(lookupData);

        const walletData = await mod.toDataURL(walletUrl, {
          margin: 1,
          width: 360,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setWalletQrDataUrl(walletData);
      } catch {
        if (!cancelled) {
          setLookupQrDataUrl(null);
          setWalletQrDataUrl(null);
        }
      }
    }

    void gen();
    return () => {
      cancelled = true;
    };
  }, [customer.id, customer.cardId, locale]);

  function downloadLookupQr() {
    if (!lookupQrDataUrl) return;
    const a = document.createElement("a");
    a.href = lookupQrDataUrl;
    a.download = `customer-lookup-${customer.cardId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function downloadWalletQr() {
    if (!walletQrDataUrl) return;
    const a = document.createElement("a");
    a.href = walletQrDataUrl;
    a.download = `customer-wallet-${customer.cardId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="rounded-3xl border border-(--surface-border) bg-(--surface) p-6">
      <div className="grid gap-6">
        <div>
          <div className={cn("flex items-start justify-between gap-4", rtl ? "flex-row-reverse" : "")}>
            <div className={cn(rtl ? "text-right" : "text-left")}>
              <div className="text-xs text-(--muted-foreground)">{ar ? "QR للبحث السريع" : "Quick lookup QR"}</div>
              <div className="mt-1 text-sm text-(--muted-foreground)">
                {ar
                  ? "اطلب من العميل عرض QR على هاتفه. امسحه لإيجاد العميل وإضافة النقاط بسرعة."
                  : "Ask the customer to show this QR. Scan it to find them instantly and adjust points."}
              </div>
            </div>
            <Button type="button" variant="secondary" size="sm" disabled={!lookupQrDataUrl} onClick={downloadLookupQr}>
              {ar ? "تحميل" : "Download"}
            </Button>
          </div>

          <div className="mt-5 flex items-center justify-center">
            {lookupQrDataUrl ? (
              <div className="h-72 w-72 rounded-3xl border border-(--surface-border) bg-white p-3">
                <Image
                  src={lookupQrDataUrl}
                  alt="QR"
                  width={264}
                  height={264}
                  unoptimized
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="flex h-72 w-72 items-center justify-center rounded-3xl border border-(--surface-border) bg-(--surface) text-sm text-(--muted-foreground)">
                {ar ? "جارٍ التحضير…" : "Generating…"}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className={cn("flex items-start justify-between gap-4", rtl ? "flex-row-reverse" : "")}>
            <div className={cn(rtl ? "text-right" : "text-left")}>
              <div className="text-xs text-(--muted-foreground)">{ar ? "QR للمحفظة" : "Wallet QR"}</div>
              <div className="mt-1 text-sm text-(--muted-foreground)">
                {ar
                  ? "إذا نسي العميل حسابه، امسح هذا الـ QR لفتح البطاقة وإضافتها للمحفظة مرة أخرى."
                  : "If the customer forgot their account, scan this QR to open the card and add it to Wallet again."}
              </div>
            </div>
            <Button type="button" variant="secondary" size="sm" disabled={!walletQrDataUrl} onClick={downloadWalletQr}>
              {ar ? "تحميل" : "Download"}
            </Button>
          </div>

          <div className="mt-5 flex items-center justify-center">
            {walletQrDataUrl ? (
              <div className="h-72 w-72 rounded-3xl border border-(--surface-border) bg-white p-3">
                <Image
                  src={walletQrDataUrl}
                  alt="Wallet QR"
                  width={264}
                  height={264}
                  unoptimized
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="flex h-72 w-72 items-center justify-center rounded-3xl border border-(--surface-border) bg-(--surface) text-sm text-(--muted-foreground)">
                {ar ? "جارٍ التحضير…" : "Generating…"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={cn("mt-4 grid gap-3 sm:grid-cols-2", rtl ? "text-right" : "text-left")}>
        <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
          <div className="text-xs text-(--muted-foreground)">{ar ? "الهاتف" : "Phone"}</div>
          <div className="mt-1 font-mono text-sm" dir="ltr">{customer.phone ?? "—"}</div>
        </div>
        <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
          <div className="text-xs text-(--muted-foreground)">{ar ? "الكود" : "Code"}</div>
          <div className="mt-1 font-mono text-sm" dir="ltr">{customer.cardId}</div>
        </div>
      </div>
    </div>
  );
}
