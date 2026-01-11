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

  React.useEffect(() => {
    let cancelled = false;

    async function gen() {
      try {
        const origin = window.location.origin;
        const url = `${origin}/${locale}/loyalty/manage/customers/${customerId}`;
        const mod = await import("qrcode");
        const data = await mod.toDataURL(url, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setQrDataUrl(data);
      } catch {
        if (!cancelled) setQrDataUrl(null);
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
    <div className="mt-8 rounded-2xl border border-(--surface-border) bg-(--surface) p-6">
      <div className={cn("flex items-start justify-between gap-4", rtl ? "flex-row-reverse" : "")}>
        <div className={cn(rtl ? "text-right" : "text-left")}>
          <div className="text-sm font-semibold">{ar ? "QR للمتجر" : "Store QR"}</div>
          <div className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "اعرض هذا QR للموظف ليقوم بمسحه وإضافة النقاط بسرعة."
              : "Show this QR to the staff to scan and add points quickly."}
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" disabled={!qrDataUrl} onClick={downloadQr}>
          {ar ? "تحميل" : "Download"}
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-center">
        {qrDataUrl ? (
          <div className="h-64 w-64 rounded-2xl border border-(--surface-border) bg-white p-2">
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
          <div className="flex h-64 w-64 items-center justify-center rounded-2xl border border-(--surface-border) bg-(--surface) text-sm text-(--muted-foreground)">
            {ar ? "جارٍ التحضير…" : "Generating…"}
          </div>
        )}
      </div>
    </div>
  );
}
