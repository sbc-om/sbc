"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineBell,
  HiOutlineCash,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi";
import { HiOutlineBanknotes, HiOutlineChartBar, HiOutlineReceiptPercent, HiOutlineWallet } from "react-icons/hi2";

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

  const t = {
    title: ar ? "محفظة الوكيل" : "Agent Wallet",
    subtitle: ar ? "إدارة أرباحك وطلبات السحب" : "Manage your earnings and withdrawal requests",
    commissionRate: ar ? "نسبة العمولة" : "Commission Rate",
    totalSales: ar ? "إجمالي المبيعات" : "Total Sales",
    totalEarned: ar ? "إجمالي العمولة" : "Total Commission Earned",
    available: ar ? "المتاح للسحب" : "Available for Withdrawal",
    withdrawn: ar ? "تم سحبه" : "Total Withdrawn",
    pendingReq: ar ? "طلبات سحب معلقة" : "Pending Withdrawal Requests",
    totalTransactions: ar ? "إجمالي العمليات" : "Total Transactions",
    requestWithdraw: ar ? "طلب سحب" : "Request Withdrawal",
    amount: ar ? "المبلغ" : "Amount",
    bankName: ar ? "اسم البنك" : "Bank Name",
    accountName: ar ? "اسم صاحب الحساب" : "Account Holder Name",
    accountNumber: ar ? "رقم الحساب" : "Account Number",
    iban: ar ? "رقم الآيبان" : "IBAN",
    note: ar ? "ملاحظات" : "Note",
    submit: ar ? "إرسال الطلب" : "Submit Request",
    cancel: ar ? "إلغاء" : "Cancel",
    history: ar ? "سجل طلبات السحب" : "Withdrawal Request History",
    status: ar ? "الحالة" : "Status",
    requested: ar ? "مطلوب" : "Requested",
    approved: ar ? "معتمد" : "Approved",
    noRequests: ar ? "لا توجد طلبات سحب بعد" : "No withdrawal requests yet",
    availableHint: ar ? "رصيدك المتاح للسحب الآن" : "Your current withdrawable balance",
    adminMessage: ar ? "رسالة الإدارة" : "Admin Message",
    receipt: ar ? "إيصال التحويل" : "Payment Receipt",
    reference: ar ? "المرجع" : "Reference",
    openReceipt: ar ? "عرض الإيصال" : "View receipt",
    requestCreatedToast: ar ? "تم إرسال طلب السحب" : "Withdrawal request submitted",
    requestApprovedToast: ar ? "تمت الموافقة على طلب السحب" : "Withdrawal approved",
    requestRejectedToast: ar ? "تم رفض طلب السحب" : "Withdrawal rejected",
    requestOnPageHint: ar ? "تقديم طلب السحب يتم الآن من صفحة مستقلة" : "Submit withdrawal requests from a dedicated page",
  };

  const surfaceCard = "rounded-2xl border border-gray-200/70 bg-white p-4 shadow-xs dark:border-white/[0.06] dark:bg-white/[0.02]";

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
                  ? `${t.requestApprovedToast}: ${Number(data.approvedAmount).toFixed(3)} OMR`
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
  }, [refreshData, showToast, t.requestApprovedToast, t.requestCreatedToast, t.requestRejectedToast]);

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
    <div className="space-y-7">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
            <HiOutlineWallet className="h-3.5 w-3.5" />
            {t.availableHint}: {summary.availableWallet.toFixed(3)} OMR
          </p>
        </div>
        <Link
          href={`/${locale}/agent/wallet/request`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <HiOutlineCash className="h-4 w-4" />
          {t.requestWithdraw}
        </Link>
      </div>

      <p className="-mt-3 text-xs text-(--muted-foreground)">{t.requestOnPageHint}</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className={surfaceCard}><div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"><HiOutlineReceiptPercent className="h-4 w-4" /></div><p className="text-xs text-(--muted-foreground)">{t.commissionRate}</p><p className="text-lg font-bold">{commissionRate}%</p></div>
        <div className={surfaceCard}><div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400"><HiOutlineChartBar className="h-4 w-4" /></div><p className="text-xs text-(--muted-foreground)">{t.totalSales}</p><p className="text-lg font-bold">{summary.totalSales.toFixed(3)} OMR</p></div>
        <div className={surfaceCard}><div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><HiOutlineBanknotes className="h-4 w-4" /></div><p className="text-xs text-(--muted-foreground)">{t.totalEarned}</p><p className="text-lg font-bold">{summary.totalEarned.toFixed(3)} OMR</p></div>
        <div className={surfaceCard}><div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400"><HiOutlineWallet className="h-4 w-4" /></div><p className="text-xs text-(--muted-foreground)">{t.available}</p><p className="text-lg font-bold text-emerald-600">{summary.availableWallet.toFixed(3)} OMR</p></div>
        <div className={surfaceCard}><div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"><HiOutlineCash className="h-4 w-4" /></div><p className="text-xs text-(--muted-foreground)">{t.withdrawn}</p><p className="text-lg font-bold">{summary.totalWithdrawn.toFixed(3)} OMR</p></div>
        <div className={surfaceCard}><div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"><HiOutlineClock className="h-4 w-4" /></div><p className="text-xs text-(--muted-foreground)">{t.pendingReq}</p><p className="text-lg font-bold">{summary.pendingWithdrawRequests.toFixed(3)} OMR</p></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-semibold dark:border-white/[0.05]">
          <HiOutlineBanknotes className="h-4 w-4" />
          {t.history}
        </div>
        <div className="p-4">
        {requests.length === 0 ? (
          <p className="text-sm text-(--muted-foreground)">{t.noRequests}</p>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200/70 bg-white px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.01]">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{request.requestedAmount.toFixed(3)} OMR</p>
                  <p className="text-xs text-(--muted-foreground)">{new Date(request.createdAt).toLocaleString(ar ? "ar-OM" : "en-OM")}</p>
                  {(request.adminNote || request.payoutReceiptUrl || request.payoutReference) && (
                    <div className="mt-1.5 space-y-1 text-xs text-(--muted-foreground)">
                      {request.adminNote && (
                        <p>
                          <span className="font-medium text-(--foreground)">{t.adminMessage}: </span>
                          {request.adminNote}
                        </p>
                      )}
                      {request.payoutReference && (
                        <p>
                          <span className="font-medium text-(--foreground)">{t.reference}: </span>
                          {request.payoutReference}
                        </p>
                      )}
                      {request.payoutReceiptUrl && (
                        <a
                          href={request.payoutReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                        >
                          {t.receipt}: {t.openReceipt}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(request.status)}
                  {request.status === "approved" && request.approvedAmount != null && (
                    <span className="text-xs font-medium text-(--muted-foreground)">{t.approved}: {request.approvedAmount.toFixed(3)} OMR</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

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
        document.body
      )}
    </div>
  );
}
