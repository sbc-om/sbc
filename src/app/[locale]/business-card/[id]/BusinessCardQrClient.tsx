"use client";

import React from "react";
import Image from "next/image";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";

export function BusinessCardQrClient({
  locale,
  publicUrl,
  cardId,
}: {
  locale: Locale;
  publicUrl: string;
  cardId: string;
}) {
  const rtl = localeDir(locale) === "rtl";
  const ar = locale === "ar";

  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function gen() {
      try {
        const qrMod = await import("qrcode");
        const qrData = await qrMod.toDataURL(publicUrl, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setQrDataUrl(qrData);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    }

    void gen();
    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `business-card-${cardId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-6">
      <div className={rtl ? "text-right" : "text-left"}>
        <div className="text-sm font-semibold">
          {ar ? "رمز QR للبطاقة" : "Business Card QR"}
        </div>
        <div className="mt-1 text-sm text-(--muted-foreground)">
          {ar
            ? "شارك هذا الرمز لعرض بطاقة الأعمال بشكل فوري."
            : "Share this QR code to open the business card instantly."}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-(--muted-foreground) break-all">{publicUrl}</div>
        <Button type="button" variant="secondary" size="sm" disabled={!qrDataUrl} onClick={downloadQr}>
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
          <div className="text-sm text-(--muted-foreground)">
            {ar ? "جارٍ إنشاء QR..." : "Generating QR..."}
          </div>
        )}
      </div>
    </div>
  );
}
