"use client";

import Image from "next/image";
import React from "react";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function CardQrClient({
  locale,
  customerId,
}: {
  locale: Locale;
  customerId: string;
}) {
  const rtl = localeDir(locale) === "rtl";
  const ar = locale === "ar";

  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [barcodeDataUrl, setBarcodeDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function gen() {
      try {
        const origin = window.location.origin;
        const url = `${origin}/${locale}/loyalty/manage/customers/${customerId}`;
        const qrMod = await import("qrcode");
        const qrData = await qrMod.toDataURL(url, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setQrDataUrl(qrData);

        // Generate barcode
        const barcodeMod = await import("jsbarcode");
        const canvas = document.createElement("canvas");
        barcodeMod.default(canvas, customerId, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
        if (!cancelled) setBarcodeDataUrl(canvas.toDataURL());
      } catch {
        if (!cancelled) {
          setQrDataUrl(null);
          setBarcodeDataUrl(null);
        }
      }
    }

    void gen();
    return () => {
      cancelled = true;
    };
  }, [customerId, locale]);

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `loyalty-customer-${customerId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {/* QR Code Section */}
      <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-6">
        <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4", rtl ? "sm:flex-row-reverse" : "")}>
          <div className={cn("min-w-0", rtl ? "text-right" : "text-left")}>
            <div className="text-sm font-semibold">{ar ? "QR للمتجر" : "Store QR"}</div>
            <div className="mt-1 text-sm text-(--muted-foreground)">
              {ar
                ? "اعرض هذا QR للموظف ليقوم بمسحه وإضافة النقاط بسرعة."
                : "Show this QR to the staff to scan and add points quickly."}
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" disabled={!qrDataUrl} onClick={downloadQr} className="shrink-0">
            {ar ? "تحميل" : "Download"}
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center">
          {qrDataUrl ? (
            <div className="h-56 w-56 max-w-full rounded-2xl border border-(--surface-border) bg-white p-2 sm:h-64 sm:w-64">
              <Image
                src={qrDataUrl}
                alt="QR"
                width={240}
                height={240}
                unoptimized
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="flex h-56 w-56 max-w-full items-center justify-center rounded-2xl border border-(--surface-border) bg-(--surface) text-sm text-(--muted-foreground) sm:h-64 sm:w-64">
              {ar ? "جارٍ التحضير…" : "Generating…"}
            </div>
          )}
        </div>
      </div>

      {/* Barcode Section */}
      <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-6">
        <div className={cn("min-w-0", rtl ? "text-right" : "text-left")}>
          <div className="text-sm font-semibold">{ar ? "باركود العميل" : "Customer Barcode"}</div>
          <div className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "يمكن أيضاً مسح الباركود للتعرف على العميل."
              : "Can also scan the barcode to identify the customer."}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center overflow-hidden">
          {barcodeDataUrl ? (
            <div className="w-full max-w-sm overflow-hidden rounded-xl border border-(--surface-border) bg-white p-4">
              <Image
                src={barcodeDataUrl}
                alt="Barcode"
                width={300}
                height={100}
                unoptimized
                className="h-auto w-full"
              />
            </div>
          ) : (
            <div className="flex h-24 w-full max-w-sm items-center justify-center rounded-xl border border-(--surface-border) bg-(--surface) text-sm text-(--muted-foreground)">
              {ar ? "جارٍ التحضير…" : "Generating…"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
