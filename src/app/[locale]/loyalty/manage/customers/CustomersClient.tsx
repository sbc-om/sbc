"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { QrScanner } from "@/components/QrScanner";
import { useToast } from "@/components/ui/Toast";

const ITEMS_PER_PAGE = 10;

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
  const { toast } = useToast();

  const [q, setQ] = useState(initialQuery ?? "");
  const [items, setItems] = useState<CustomerDTO[]>(customers);
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});
  const [deltaById, setDeltaById] = useState<Record<string, string>>({});
  const [errorById, setErrorById] = useState<Record<string, string | null>>({});
  const [qrForCustomerId, setQrForCustomerId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((c) => {
      const hay = [c.fullName, c.phone ?? "", c.email ?? "", c.cardId, c.id]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  async function adjustPoints(customerId: string, delta: number) {
    if (!Number.isFinite(delta) || delta === 0) return;

    setBusyById((m) => ({ ...m, [customerId]: true }));
    setErrorById((m) => ({ ...m, [customerId]: null }));

    let prev: CustomerDTO | null = null;

    // Optimistic update
    setItems((list) =>
      list.map((c) => {
        if (c.id !== customerId) return c;
        prev = c;
        return { ...c, points: Math.max(0, (c.points ?? 0) + delta) };
      }),
    );

    try {
      const res = await fetch(`/api/loyalty/customers/${customerId}/points`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      const json = (await res.json()) as
        | { ok: true; customer: { id: string; points: number } }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setItems((list) =>
        list.map((c) => (c.id === customerId ? { ...c, points: json.customer.points } : c)),
      );
    } catch (e) {
      // Rollback optimistic update
      if (prev) {
        setItems((list) => list.map((c) => (c.id === customerId ? prev! : c)));
      }
      setErrorById((m) => ({
        ...m,
        [customerId]: e instanceof Error ? e.message : "UPDATE_FAILED",
      }));
    } finally {
      setBusyById((m) => ({ ...m, [customerId]: false }));
    }
  }

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

  const router = useRouter();

  function handleScan(data: string) {
    // Extract customer ID from URL
    // Expected format: http://domain/locale/loyalty/manage/customers/{customerId}
    try {
      const url = new URL(data);
      const pathParts = url.pathname.split("/");
      const customersIndex = pathParts.indexOf("customers");
      
      if (customersIndex !== -1 && pathParts[customersIndex + 1]) {
        const customerId = pathParts[customersIndex + 1];
        setShowScanner(false);
        router.push(`/${locale}/loyalty/manage/customers/${customerId}`);
      } else {
        toast({ message: ar ? "رمز QR غير صالح" : "Invalid QR code", variant: "error" });
        setShowScanner(false);
      }
    } catch {
      toast({ message: ar ? "رمز QR غير صالح" : "Invalid QR code", variant: "error" });
      setShowScanner(false);
    }
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
        <div className="flex w-full gap-2 sm:max-w-md">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ar ? "ابحث…" : "Search…"}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setShowScanner(true)}
            className="shrink-0"
          >
            {ar ? "مسح QR" : "Scan QR"}
          </Button>
        </div>
      </div>

      {showScanner && (
        <QrScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          locale={locale}
        />
      )}

      {filtered.length === 0 ? (
        <div className={cn("sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
          {ar ? "لا توجد نتائج." : "No results."}
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {paginatedCustomers.map((c) => (
              <div key={c.id} className="sbc-card rounded-xl p-4">
                <div className="grid gap-3">
                  <div
                    className={cn(
                      "grid gap-3 lg:grid-cols-[1fr_auto]",
                      rtl ? "lg:[direction:rtl]" : "",
                    )}
                  >
                    {/* Customer Info */}
                    <div className={cn("min-w-0 flex items-center gap-3", rtl ? "text-right" : "text-left")}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <div className="font-semibold truncate">{c.fullName}</div>
                          <div className="shrink-0 text-xs text-(--muted-foreground)">
                            {c.phone ? c.phone : (ar ? "بدون هاتف" : "No phone")}
                          </div>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-(--muted-foreground)">
                          <div className="flex items-center gap-1.5">
                            <span className={ar ? "hidden" : ""}>{ar ? "الكود" : "Code"}:</span>
                            <span className="font-mono" dir="ltr">{c.cardId}</span>
                          </div>
                          {c.email ? (
                            <div className="truncate hidden sm:inline">• {c.email}</div>
                          ) : null}
                        </div>
                      </div>

                      {/* Points Badge */}
                      <div className={cn("shrink-0 px-3 py-1.5 rounded-lg bg-linear-to-r from-accent/10 to-accent-2/10 border border-accent/20", rtl ? "text-left" : "text-right")}>
                        <div className="text-[10px] text-(--muted-foreground) uppercase tracking-wide">{ar ? "النقاط" : "Points"}</div>
                        <div className="text-lg font-bold leading-none bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
                          {c.points}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-2 lg:border-l lg:border-(--surface-border) lg:pl-4", rtl ? "lg:border-l-0 lg:border-r lg:pr-4 lg:pl-0" : "")}>
                      <Link
                        href={`/${locale}/loyalty/manage/customers/${c.id}`}
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
                      >
                        {ar ? "التفاصيل" : "Details"}
                      </Link>
                      <Link
                        href={`/${locale}/loyalty/card/${c.cardId}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {ar ? "البطاقة" : "Card"}
                      </Link>
                      <Button type="button" variant="ghost" size="sm" onClick={() => openQr(c.id)}>
                        QR
                      </Button>
                    </div>
                  </div>

                  {/* Points Adjustment Section */}
                  <div className={cn("pt-3 border-t border-(--surface-border)", rtl ? "text-right" : "text-left")}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="text-xs font-medium text-(--muted-foreground)">
                        {ar ? "تعديل النقاط" : "Adjust points"}
                      </div>
                      {busyById[c.id] && (
                        <div className="text-xs text-(--muted-foreground)">{ar ? "جارٍ الحفظ…" : "Saving…"}</div>
                      )}
                    </div>
                    
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <div className={cn("grid grid-cols-4 gap-1.5", rtl ? "[direction:ltr]" : "")}>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          disabled={!!busyById[c.id]} 
                          onClick={() => adjustPoints(c.id, -5)}
                          className="h-8 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900/50"
                        >
                          -5
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          disabled={!!busyById[c.id]} 
                          onClick={() => adjustPoints(c.id, -1)}
                          className="h-8 hover:bg-red-50 hover:text-red-600 hover:border-red-100 dark:hover:bg-red-950/20 dark:hover:text-red-300 dark:hover:border-red-900/30"
                        >
                          -1
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          disabled={!!busyById[c.id]} 
                          onClick={() => adjustPoints(c.id, +1)}
                          className="h-8 hover:bg-green-50 hover:text-green-600 hover:border-green-100 dark:hover:bg-green-950/20 dark:hover:text-green-300 dark:hover:border-green-900/30"
                        >
                          +1
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          disabled={!!busyById[c.id]} 
                          onClick={() => adjustPoints(c.id, +5)}
                          className="h-8 hover:bg-green-50 hover:text-green-700 hover:border-green-200 dark:hover:bg-green-950/30 dark:hover:text-green-400 dark:hover:border-green-900/50"
                        >
                          +5
                        </Button>
                      </div>
                      
                      <div className={cn("flex gap-1.5", rtl ? "flex-row-reverse" : "")}>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={deltaById[c.id] ?? ""}
                          onChange={(e) => setDeltaById((m) => ({ ...m, [c.id]: e.target.value }))}
                          placeholder={ar ? "مثلا 10" : "e.g. 10"}
                          disabled={!!busyById[c.id]}
                          className="h-8 w-20"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={!!busyById[c.id] || !String(deltaById[c.id] ?? "").trim()}
                          onClick={() => {
                            const raw = String(deltaById[c.id] ?? "").trim();
                            const n = Number(raw);
                            if (!Number.isFinite(n) || n === 0) return;
                            void adjustPoints(c.id, Math.trunc(n));
                            setDeltaById((m) => ({ ...m, [c.id]: "" }));
                          }}
                          className="h-8"
                        >
                          {ar ? "تطبيق" : "Apply"}
                        </Button>
                      </div>
                    </div>

                    {errorById[c.id] && (
                      <div className="mt-2 text-xs text-red-600 dark:text-red-300">
                        {errorById[c.id]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={cn("mt-6 flex items-center justify-between gap-4 rounded-xl border border-(--surface-border) bg-(--surface) px-4 py-3", rtl ? "flex-row-reverse" : "")}>
              <div className="text-sm text-(--muted-foreground)">
                {ar 
                  ? `صفحة ${currentPage} من ${totalPages}`
                  : `Page ${currentPage} of ${totalPages}`}
              </div>
              <div className={cn("flex items-center gap-2", rtl ? "flex-row-reverse" : "")}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  {ar ? "السابق" : "Previous"}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, current, and adjacent pages
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    ) {
                      return (
                        <Button
                          key={page}
                          type="button"
                          variant={page === currentPage ? "secondary" : "ghost"}
                          size="sm"
                          className="min-w-9"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-1 text-sm text-(--muted-foreground)">
                          …
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  {ar ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* QR Modal */}
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
