"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type CustomerDTO = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  points: number;
  cardId: string;
  createdAt: string;
  updatedAt: string;
};

export function CustomersClient({
  locale,
  customers,
  initialQuery,
}: {
  locale: Locale;
  customers: CustomerDTO[];
  initialQuery?: string;
}) {
  const rtl = localeDir(locale) === "rtl";
  const ar = locale === "ar";

  const [q, setQ] = useState(initialQuery ?? "");
  const [qrForCustomerId, setQrForCustomerId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers;

    return customers.filter((c) => {
      const hay = [c.fullName, c.phone ?? "", c.email ?? "", c.cardId, c.id]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [customers, q]);

  async function openQr(customerId: string) {
    setQrForCustomerId(customerId);
    setQrDataUrl(null);
    setQrBusy(true);
    try {
      const origin = window.location.origin;
      const url = `${origin}/${locale}/loyalty/manage/customers/${customerId}`;
      const mod = await import("qrcode");
      const data = await mod.toDataURL(url, {
        margin: 1,
        width: 300,
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(data);
    } finally {
      setQrBusy(false);
    }
  }

  function closeQr() {
    setQrForCustomerId(null);
    setQrDataUrl(null);
    setQrBusy(false);
  }

  return (
    <div className="grid gap-4">
      <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", rtl ? "sm:flex-row-reverse" : "")}>
        <div className={cn(rtl ? "text-right" : "text-left")}> 
          <div className="text-sm font-medium">{ar ? "بحث" : "Search"}</div>
          <div className="mt-1 text-xs text-(--muted-foreground)">
            {ar
              ? "ابحث بالاسم أو رقم الهاتف أو الكود."
              : "Search by name, phone, or code."}
          </div>
        </div>
        <div className="w-full sm:max-w-md">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "ابحث…" : "Search…"}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={cn("sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
          {ar ? "لا توجد نتائج." : "No results."}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="sbc-card rounded-2xl p-5">
              <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", rtl ? "sm:flex-row-reverse" : "")}>
                <div className={cn("min-w-0", rtl ? "text-right" : "text-left")}>
                  <div className="font-semibold truncate">{c.fullName}</div>
                  <div className="mt-1 text-xs text-(--muted-foreground)">
                    {c.phone ? c.phone : (ar ? "بدون هاتف" : "No phone")}
                    {c.email ? ` • ${c.email}` : ""}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-2">
                      <div className="text-[11px] text-(--muted-foreground)">{ar ? "النقاط" : "Points"}</div>
                      <div className="mt-0.5 text-lg font-semibold">{c.points}</div>
                    </div>
                    <div className="rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-2">
                      <div className="text-[11px] text-(--muted-foreground)">{ar ? "الكود" : "Code"}</div>
                      <div className="mt-0.5 font-mono text-xs truncate" dir="ltr">{c.cardId}</div>
                    </div>
                  </div>

                  <div className={cn("mt-3 flex flex-wrap items-center gap-2", rtl ? "justify-start" : "justify-start")}>
                    <Link
                      href={`/${locale}/loyalty/manage/customers/${c.id}`}
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      {ar ? "فتح" : "Open"}
                    </Link>
                    <Link
                      href={`/${locale}/loyalty/card/${c.cardId}`}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ar ? "بطاقة العميل" : "Customer card"}
                    </Link>
                    <Button type="button" variant="ghost" size="sm" onClick={() => openQr(c.id)}>
                      {ar ? "QR" : "QR"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {qrForCustomerId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeQr}>
          <div className="w-full max-w-sm rounded-3xl border border-(--surface-border) bg-(--surface) p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className={cn("flex items-start justify-between gap-3", rtl ? "flex-row-reverse" : "")}>
              <div className={cn(rtl ? "text-right" : "text-left")}>
                <div className="text-sm font-semibold">{ar ? "QR للعميل" : "Customer QR"}</div>
                <div className="mt-1 text-xs text-(--muted-foreground)" dir="ltr">
                  {qrForCustomerId}
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeQr}>
                {ar ? "إغلاق" : "Close"}
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
                  {qrBusy ? (ar ? "جارٍ التحضير…" : "Generating…") : (ar ? "لا يوجد QR" : "No QR")}
                </div>
              )}
            </div>

            <div className={cn("mt-3 text-xs text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
              {ar
                ? "امسح هذا الـ QR لفتح صفحة العميل داخل لوحة الإدارة."
                : "Scan this QR to open the customer page in the management panel."}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
