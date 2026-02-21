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
  const [copied, setCopied] = React.useState(false);

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

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <aside className="sbc-card rounded-3xl border border-(--surface-border) p-6 sm:p-7">
      <div className={rtl ? "text-right" : "text-left"}>
        <div className="text-sm font-semibold tracking-tight">
          {ar ? "رمز QR للبطاقة" : "Business Card QR"}
        </div>
        <div className="mt-1 text-sm text-(--muted-foreground)">
          {ar
            ? "شارك الرابط أو الرمز للوصول الفوري إلى بطاقة الأعمال."
            : "Share this link or QR for instant access to the business card."}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-3">
        <div className="text-xs text-(--muted-foreground) break-all">{publicUrl}</div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="secondary" size="sm" onClick={copyLink}>
          {copied ? (ar ? "تم النسخ" : "Copied") : ar ? "نسخ الرابط" : "Copy link"}
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={!qrDataUrl} onClick={downloadQr}>
          {ar ? "تحميل QR" : "Download QR"}
        </Button>
      </div>

      <div className="mt-5 flex items-center justify-center">
        {qrDataUrl ? (
          <div className="h-56 w-56 max-w-full rounded-2xl border border-(--surface-border) bg-white p-2 shadow-sm sm:h-64 sm:w-64">
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

      <p className="mt-4 text-xs text-(--muted-foreground)">
        {ar
          ? "يمكن حفظ البطاقة مباشرة في Wallet أو مشاركتها كرابط أو QR."
          : "Save this card to Wallet, or share it as a link or QR."}
      </p>
    </aside>
  );
}
