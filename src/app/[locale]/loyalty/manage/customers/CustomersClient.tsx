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
import { LuEye, LuCreditCard, LuQrCode } from "react-icons/lu";
import { HiMiniMagnifyingGlass } from "react-icons/hi2";

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
  const surfaceClassName = "bg-(--surface) shadow-[0_22px_55px_rgba(15,23,42,0.08)]";
  const innerSurfaceClassName = "bg-(--chip-bg) backdrop-blur";

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

  async function openQr(customerId: string, phone?: string) {
    setQrForCustomerId(customerId);
    setQrDataUrl(null);
    setQrBusy(true);
    try {
      const value = (phone ?? "").replace(/^\+/, "") || customerId;
      const mod = await import("qrcode");
      const data = await mod.toDataURL(value, {
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
    <div className="grid gap-4 sm:gap-5">
      <section className={cn("rounded-[1.6rem] p-3 sm:p-5", surfaceClassName)}>
        <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", rtl ? "sm:flex-row-reverse" : "")}>
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <HiMiniMagnifyingGlass
                size={18}
                className="pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-foreground/60 ltr:left-3 rtl:right-3"
                aria-hidden
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={ar ? "ابحث بالاسم أو الهاتف…" : "Search by name or phone…"}
                className={cn("h-11 pl-11 rtl:pr-11 rtl:pl-4", innerSurfaceClassName)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowScanner(true)}
              className="h-11 shrink-0 gap-1.5 bg-accent/10 px-3 text-accent hover:bg-accent/20 dark:bg-accent/15 dark:hover:bg-accent/25"
            >
              <LuQrCode size={16} />
              <span className="hidden sm:inline">{ar ? "مسح" : "Scan"}</span>
            </Button>
          </div>
        </div>
      </section>

      {showScanner && (
        <QrScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
          locale={locale}
        />
      )}

      {filtered.length === 0 ? (
        <div className={cn("rounded-[1.6rem] p-6 text-sm text-(--muted-foreground)", surfaceClassName, rtl ? "text-right" : "text-left")}>
          {ar ? "لا توجد نتائج." : "No results."}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:gap-4">
            {paginatedCustomers.map((c) => (
              <article key={c.id} className="rounded-2xl bg-(--surface) p-3.5 shadow-[0_22px_55px_rgba(15,23,42,0.08)] sm:rounded-[1.6rem] sm:p-5">
                <div className="grid gap-3 sm:gap-4">
                  {/* Top row: Name + Points badge (always side by side) */}
                  <div className={cn("flex items-start gap-3", rtl ? "flex-row-reverse text-right" : "")}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="truncate text-[15px] font-semibold text-foreground sm:text-lg">{c.fullName}</span>
                        <span className="shrink-0 text-xs text-(--muted-foreground)" dir="ltr">
                          {c.phone ? c.phone.replace(/^\+/, "") : (ar ? "بدون هاتف" : "No phone")}
                        </span>
                      </div>
                      {c.email ? <div className="mt-0.5 truncate text-xs text-(--muted-foreground)">{c.email}</div> : null}
                    </div>
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-accent/10 dark:bg-accent/15">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-accent/60">{ar ? "نقاط" : "pts"}</span>
                      <span className="text-base font-bold leading-none text-accent">{c.points}</span>
                    </div>
                  </div>

                  {/* Action buttons row */}
                  <div className={cn("flex gap-1.5 sm:gap-2", rtl ? "flex-row-reverse" : "")}>
                    <Link
                      href={`/${locale}/loyalty/manage/customers/${c.id}`}
                      className={`${buttonVariants({ variant: "secondary", size: "sm" })} flex-1 justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50 sm:flex-none`}
                    >
                      <LuEye size={14} />
                      {ar ? "التفاصيل" : "Details"}
                    </Link>
                    <Link
                      href={`/${locale}/loyalty/card/${c.cardId}`}
                      className={`${buttonVariants({ variant: "secondary", size: "sm" })} flex-1 justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50 sm:flex-none`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <LuCreditCard size={14} />
                      {ar ? "البطاقة" : "Card"}
                    </Link>
                    <Button type="button" variant="secondary" size="sm" onClick={() => openQr(c.id, c.phone)} className="flex-1 justify-center gap-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:bg-violet-950/50 sm:flex-none">
                      <LuQrCode size={14} />
                      QR
                    </Button>
                  </div>

                  {/* Points Adjustment Section */}
                  <div className={cn("rounded-[1.35rem] p-4", innerSurfaceClassName, rtl ? "text-right" : "text-left")}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="text-xs font-medium text-(--muted-foreground)">
                        {ar ? "تعديل النقاط" : "Adjust points"}
                      </div>
                      {busyById[c.id] && (
                        <div className="text-xs text-(--muted-foreground)">{ar ? "جارٍ الحفظ…" : "Saving…"}</div>
                      )}
                    </div>
                    
                    <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div className={cn("grid grid-cols-4 gap-1.5", rtl ? "[direction:ltr]" : "")}>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          disabled={!!busyById[c.id]} 
                          onClick={() => adjustPoints(c.id, -5)}
                          className="h-9 bg-(--chip-bg) hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        >
                          -5
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          disabled={!!busyById[c.id]} 
                          onClick={() => adjustPoints(c.id, -1)}
                          className="h-9 bg-(--chip-bg) hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-300"
                        >
                          -1
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          disabled={!!busyById[c.id]} 
                          onClick={() => adjustPoints(c.id, +1)}
                          className="h-9 bg-(--chip-bg) hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/20 dark:hover:text-green-300"
                        >
                          +1
                        </Button>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          disabled={!!busyById[c.id]} 
                          onClick={() => adjustPoints(c.id, +5)}
                          className="h-9 bg-(--chip-bg) hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950/30 dark:hover:text-green-400"
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
                          className={cn("h-9 w-24", innerSurfaceClassName)}
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
                          className="h-9"
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
              </article>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={cn("mt-6 flex flex-col gap-3 rounded-[1.35rem] px-4 py-4 sm:flex-row sm:items-center sm:justify-between", surfaceClassName, rtl ? "sm:flex-row-reverse" : "") }>
              <div className="text-sm text-(--muted-foreground)">
                {ar 
                  ? `صفحة ${currentPage} من ${totalPages}`
                  : `Page ${currentPage} of ${totalPages}`}
              </div>
              <div className={cn("flex flex-wrap items-center gap-2", rtl ? "flex-row-reverse" : "") }>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="bg-(--chip-bg) hover:bg-(--surface-hover) dark:hover:bg-(--surface)"
                >
                  {ar ? "السابق" : "Previous"}
                </Button>
                <div className="flex flex-wrap items-center gap-1">
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
                          className={`min-w-9 ${page === currentPage ? "bg-(--chip-bg) font-semibold" : "hover:bg-(--surface-hover) dark:hover:bg-(--surface)"}`}
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
                  className="bg-(--chip-bg) hover:bg-(--surface-hover) dark:hover:bg-(--surface)"
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
          <div className="w-full max-w-sm rounded-[1.8rem] bg-(--surface) p-5 shadow-[0_28px_80px_rgba(15,23,42,0.22)]" onClick={(e) => e.stopPropagation()}>
            <div className={cn("flex items-start justify-between gap-3", rtl ? "flex-row-reverse" : "")}>
              <div className={cn(rtl ? "text-right" : "text-left")}>
                <div className="text-sm font-semibold">{ar ? "QR للعميل" : "Customer QR"}</div>
                <div className="mt-1 text-xs text-(--muted-foreground)">
                  {ar ? "رقم هاتف العميل في QR" : "Customer phone number in QR"}
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeQr}>
                {ar ? "إغلاق" : "Close"}
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-center">
              {qrDataUrl ? (
                <div className="h-64 w-64 rounded-[1.4rem] bg-white p-3 shadow-[0_16px_36px_rgba(15,23,42,0.1)]">
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
                <div className="flex h-64 w-64 items-center justify-center rounded-[1.4rem] bg-(--background) text-sm text-(--muted-foreground) shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_10px_24px_rgba(15,23,42,0.05)]">
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
