"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineBell,
  HiOutlineCash,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { HiOutlineBanknotes, HiOutlineReceiptPercent, HiOutlineWallet } from "react-icons/hi2";

import type { Locale } from "@/lib/i18n/locales";
import type { AgentWithdrawalRequest } from "@/lib/db/agents";

function playNotificationSound() {
  try {
    const audioContextClass =
      window.AudioContext ||
      (
        window as Window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!audioContextClass) return;
    const audioContext = new audioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 820;
    oscillator.type = "sine";
    gainNode.gain.value = 0.25;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.stop(audioContext.currentTime + 0.2);

    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 1020;
      oscillator2.type = "sine";
      gainNode2.gain.value = 0.25;
      oscillator2.start();
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator2.stop(audioContext.currentTime + 0.2);
    }, 140);
  } catch {
    // ignore
  }
}

type Props = {
  locale: Locale;
  commissionRate: number;
  summary: {
    totalSales: number;
    totalEarned: number;
    totalWithdrawn: number;
    pendingWithdrawRequests: number;
    availableWallet: number;
    totalTransactions: number;
  };
  requests: AgentWithdrawalRequest[];
};

export default function AgentWalletClient({ locale, commissionRate, summary, requests }: Props) {
  const router = useRouter();
  const ar = locale === "ar";
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sseConnectedRef = useRef(false);
  const [hideBalance, setHideBalance] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("agent_wallet_hide_balance") === "true";
  });

  const t = {
    title: ar ? "المحفظة" : "Wallet",
    subtitle: ar ? "الأرباح" : "Earnings",
    commissionRate: ar ? "العمولة" : "Commission",
    totalSales: ar ? "المبيعات" : "Sales",
    totalEarned: ar ? "العمولة" : "Earned",
    available: ar ? "المتاح" : "Available",
    withdrawn: ar ? "المسحوب" : "Withdrawn",
    pendingReq: ar ? "المعلق" : "Pending",
    totalTransactions: ar ? "العمليات" : "Transactions",
    requestWithdraw: ar ? "سحب" : "Withdraw",
    history: ar ? "سجل طلبات السحب" : "Withdrawal Request History",
    approved: ar ? "معتمد" : "Approved",
    noRequests: ar ? "لا توجد طلبات سحب بعد" : "No withdrawal requests yet",
    adminMessage: ar ? "رسالة الإدارة" : "Admin Message",
    receipt: ar ? "إيصال التحويل" : "Payment Receipt",
    reference: ar ? "المرجع" : "Reference",
    openReceipt: ar ? "عرض الإيصال" : "View receipt",
    requestCreatedToast: ar ? "تم إرسال طلب السحب" : "Withdrawal request submitted",
    requestApprovedToast: ar ? "تمت الموافقة على طلب السحب" : "Withdrawal approved",
    requestRejectedToast: ar ? "تم رفض طلب السحب" : "Withdrawal rejected",
  };

  const surfaceCard = "rounded-2xl bg-white p-4 shadow-(--shadow) dark:bg-white/[0.02]";

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat(ar ? "ar-OM" : "en-OM", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      }),
    [ar]
  );
  const formatAmountValue = useCallback((value: number) => amountFormatter.format(value), [amountFormatter]);
  const formatAmount = (value: number) => (hideBalance ? "***" : formatAmountValue(value));
  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString(ar ? "ar-OM" : "en-OM", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const refreshData = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router, startTransition]);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource("/api/agent/wallet/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        sseConnectedRef.current = true;
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "connected") return;

          playNotificationSound();

          if (data.type === "withdrawal_requested") {
            showToast(t.requestCreatedToast, "info");
          }

          if (data.type === "withdrawal_processed") {
            if (data.status === "approved") {
                showToast(
                data.approvedAmount
                  ? `${t.requestApprovedToast}: ${formatAmountValue(Number(data.approvedAmount))} OMR`
                  : t.requestApprovedToast,
                "success"
              );
            } else if (data.status === "rejected") {
              showToast(
                data.adminNote ? `${t.requestRejectedToast}: ${data.adminNote}` : t.requestRejectedToast,
                "error"
              );
            }
          }

          refreshData();
        } catch {
          // ignore invalid events
        }
      };

      eventSource.onerror = () => {
        sseConnectedRef.current = false;
        eventSource.close();

        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(() => {
            if (!sseConnectedRef.current) {
              refreshData();
            }
          }, 5000);
        }

        reconnectTimeout = setTimeout(connect, 7000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [formatAmountValue, refreshData, showToast, t.requestApprovedToast, t.requestCreatedToast, t.requestRejectedToast]);

  const statusBadge = (status: AgentWithdrawalRequest["status"]) => {
    if (status === "approved") {
      return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400"><HiOutlineCheckCircle className="h-3.5 w-3.5" />{ar ? "مقبول" : "Approved"}</span>;
    }
    if (status === "rejected") {
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400"><HiOutlineXCircle className="h-3.5 w-3.5" />{ar ? "مرفوض" : "Rejected"}</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"><HiOutlineClock className="h-3.5 w-3.5" />{ar ? "معلق" : "Pending"}</span>;
  };

  return (
    <div className="agent-view-root space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-(--surface) p-5 sm:p-6 shadow-(--shadow)">
        <div className="pointer-events-none absolute -top-20 -end-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -start-14 h-56 w-56 rounded-full bg-accent-2/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
            <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
            <div className="mt-4">
              <p className="text-xs text-(--muted-foreground)">{t.available}</p>
              <p className="mt-1 text-3xl sm:text-4xl font-bold tabular-nums">
                {formatAmount(summary.availableWallet)} <span className="text-lg font-semibold">OMR</span>
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => {
                const next = !hideBalance;
                setHideBalance(next);
                localStorage.setItem("agent_wallet_hide_balance", String(next));
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--chip-bg) px-3.5 py-2 text-xs font-semibold text-(--foreground) shadow-xs hover:bg-(--surface)"
            >
              {hideBalance ? <HiOutlineEye className="h-4 w-4" /> : <HiOutlineEyeOff className="h-4 w-4" />}
              {hideBalance ? (ar ? "إظهار الرصيد" : "Show balance") : (ar ? "إخفاء الرصيد" : "Hide balance")}
            </button>
            <button
              type="button"
              onClick={refreshData}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--chip-bg) px-3.5 py-2 text-xs font-semibold text-(--foreground) shadow-xs hover:bg-(--surface)"
            >
              <HiOutlineRefresh className="h-4 w-4" />
              {ar ? "تحديث" : "Refresh"}
            </button>
            <Link
              href={`/${locale}/agent/wallet/request`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
            >
              <HiOutlineCash className="h-4 w-4" />
              {t.requestWithdraw}
            </Link>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950/35 dark:text-indigo-300">
            <HiOutlineReceiptPercent className="h-3.5 w-3.5" />
            {t.commissionRate}: {commissionRate}%
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/35 dark:text-amber-300">
            <HiOutlineClock className="h-3.5 w-3.5" />
            {t.pendingReq}: {summary.pendingWithdrawRequests}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={surfaceCard}>
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <HiOutlineBanknotes className="h-4 w-4" />
          </div>
          <p className="truncate whitespace-nowrap text-xs text-(--muted-foreground)">{t.totalEarned}</p>
          <p className="text-lg font-bold tabular-nums">{formatAmount(summary.totalEarned)} OMR</p>
        </div>
        <div className={surfaceCard}>
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <HiOutlineCash className="h-4 w-4" />
          </div>
          <p className="truncate whitespace-nowrap text-xs text-(--muted-foreground)">{t.withdrawn}</p>
          <p className="text-lg font-bold tabular-nums">{formatAmount(summary.totalWithdrawn)} OMR</p>
        </div>
        <div className={surfaceCard}>
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
            <HiOutlineBanknotes className="h-4 w-4" />
          </div>
          <p className="truncate whitespace-nowrap text-xs text-(--muted-foreground)">{t.totalSales}</p>
          <p className="text-lg font-bold tabular-nums">{formatAmount(summary.totalSales)} OMR</p>
        </div>
        <div className={surfaceCard}>
          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <HiOutlineWallet className="h-4 w-4" />
          </div>
          <p className="truncate whitespace-nowrap text-xs text-(--muted-foreground)">{t.totalTransactions}</p>
          <p className="text-lg font-bold tabular-nums">{summary.totalTransactions}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-(--shadow) dark:bg-white/[0.02]">
        <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold">
          <HiOutlineBanknotes className="h-4 w-4" />
          {t.history}
        </div>

        <div className="p-4">
          {requests.length === 0 ? (
            <div className="rounded-xl bg-(--chip-bg) p-6 text-center text-sm text-(--muted-foreground)">
              {t.noRequests}
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-xl bg-(--surface) p-3.5 shadow-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-bold tabular-nums">
                        {formatAmount(request.requestedAmount)} OMR
                      </p>
                      <p className="text-xs text-(--muted-foreground)">{formatDateTime(request.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(request.status)}
                      {request.status === "approved" && request.approvedAmount != null ? (
                        <span className="text-xs font-medium text-(--muted-foreground)">
                          {t.approved}: {formatAmount(request.approvedAmount)} OMR
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {(request.adminNote || request.payoutReference || request.payoutReceiptUrl) ? (
                    <div className="mt-3 grid gap-1.5 text-xs text-(--muted-foreground)">
                      {request.adminNote ? (
                        <p>
                          <span className="font-medium text-(--foreground)">{t.adminMessage}: </span>
                          {request.adminNote}
                        </p>
                      ) : null}
                      {request.payoutReference ? (
                        <p>
                          <span className="font-medium text-(--foreground)">{t.reference}: </span>
                          {request.payoutReference}
                        </p>
                      ) : null}
                      {request.payoutReceiptUrl ? (
                        <a
                          href={request.payoutReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                        >
                          {t.receipt}: {t.openReceipt}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {toast && typeof document !== "undefined" && createPortal(
        <div
          className={`fixed bottom-4 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-600"
              : toast.type === "error"
                ? "bg-rose-600"
                : "bg-accent"
          }`}
        >
          <HiOutlineBell className="h-4 w-4" />
          <span>{toast.message}</span>
          <button
            type="button"
            className="rounded p-0.5 hover:bg-white/20"
            onClick={() => setToast(null)}
            aria-label="close"
          >
            <HiOutlineXCircle className="h-4 w-4" />
          </button>
        </div>,
        document.getElementById("sbc-app-root") ?? document.body
      )}
    </div>
  );
}
