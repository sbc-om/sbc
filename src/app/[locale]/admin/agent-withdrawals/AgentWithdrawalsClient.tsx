"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineSearch, HiOutlineXCircle } from "react-icons/hi";
import { HiOutlineBanknotes, HiOutlineUserGroup } from "react-icons/hi2";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

import type { Locale } from "@/lib/i18n/locales";

function playNotificationSound() {
  try {
    const audioContext = new (
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gainNode.gain.value = 0.25;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.18);
    oscillator.stop(audioContext.currentTime + 0.18);

    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 1140;
      oscillator2.type = "sine";
      gainNode2.gain.value = 0.25;
      oscillator2.start();
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.18);
      oscillator2.stop(audioContext.currentTime + 0.18);
    }, 140);
  } catch {
    // ignore
  }
}

type RequestItem = {
  id: string;
  agentUserId: string;
  requestedAmount: number;
  approvedAmount: number | null;
  status: "pending" | "approved" | "rejected";
  agentNote: string | null;
  adminNote: string | null;
  payoutMethod: string | null;
  payoutReference: string | null;
  payoutReceiptUrl: string | null;
  payoutBankName: string | null;
  payoutAccountName: string | null;
  payoutAccountNumber: string | null;
  payoutIban: string | null;
  processedAt: string | null;
  createdAt: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
};

type ActionResponse = {
  ok?: boolean;
  error?: string;
  url?: string;
};

type ProcessPayload = {
  requestId: string;
  action: "approve" | "reject";
  adminNote: string;
  approvedAmount?: number;
  payoutMethod?: string;
  payoutReference?: string;
  payoutReceiptUrl?: string;
  payoutBankName?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  payoutIban?: string;
};

export default function AgentWithdrawalsClient({
  locale,
  initialRequests,
  currentStatus,
  initialSearch,
  initialAgentUserId,
  initialAgentName,
  pagination,
}: {
  locale: Locale;
  initialRequests: RequestItem[];
  currentStatus: "pending" | "approved" | "rejected" | "all";
  initialSearch: string;
  initialAgentUserId: string;
  initialAgentName: string;
  pagination: { page: number; perPage: number; total: number; totalPages: number };
}) {
  const router = useRouter();
  const ar = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [activeRequest, setActiveRequest] = useState<RequestItem | null>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [payoutReference, setPayoutReference] = useState("");
  const [payoutReceiptUrl, setPayoutReceiptUrl] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutAccountName, setPayoutAccountName] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutIban, setPayoutIban] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sseConnectedRef = useRef(false);

  const t = {
    title: ar ? "طلبات سحب الوكلاء" : "Agent Withdrawal Requests",
    subtitle: ar ? "إدارة سحب أرباح الوكلاء مع إثبات التحويل" : "Manage agent payout withdrawals with transfer proof",
    pending: ar ? "معلقة" : "Pending",
    approved: ar ? "مقبولة" : "Approved",
    rejected: ar ? "مرفوضة" : "Rejected",
    all: ar ? "الكل" : "All",
    search: ar ? "بحث باسم/إيميل الوكيل..." : "Search by agent name/email...",
    agent: ar ? "الوكيل" : "Agent",
    amount: ar ? "المبلغ" : "Amount",
    status: ar ? "الحالة" : "Status",
    date: ar ? "التاريخ" : "Date",
    action: ar ? "الإجراء" : "Action",
    process: ar ? "معالجة" : "Process",
    noData: ar ? "لا توجد طلبات" : "No requests",
    approve: ar ? "اعتماد" : "Approve",
    reject: ar ? "رفض" : "Reject",
    close: ar ? "إغلاق" : "Close",
    bankName: ar ? "اسم البنك" : "Bank Name",
    accountName: ar ? "اسم صاحب الحساب" : "Account Holder",
    accountNumber: ar ? "رقم الحساب" : "Account Number",
    iban: ar ? "الآيبان" : "IBAN",
    receiptUrl: ar ? "رابط الفيش" : "Receipt URL",
    uploadReceipt: ar ? "رفع الفيش (صورة أو PDF)" : "Upload Receipt (Image or PDF)",
    upload: ar ? "رفع" : "Upload",
    uploading: ar ? "جاري الرفع..." : "Uploading...",
    uploaded: ar ? "تم رفع الملف" : "File uploaded",
    replaceFile: ar ? "استبدال الملف" : "Replace file",
    fileHint: ar ? "الأنواع: JPG, PNG, WEBP, GIF, PDF (حد أقصى 10MB)" : "Types: JPG, PNG, WEBP, GIF, PDF (max 10MB)",
    uploadFailed: ar ? "فشل رفع الملف" : "Upload failed",
    reference: ar ? "كود التتبع" : "Transfer Reference",
    adminNote: ar ? "ملاحظات الإدارة" : "Admin Note",
    totalRequests: ar ? "إجمالي الطلبات" : "Total Requests",
    visibleAmount: ar ? "إجمالي المبالغ الظاهرة" : "Visible Amount",
    items: ar ? "عنصر" : "items",
    prev: ar ? "السابق" : "Prev",
    next: ar ? "التالي" : "Next",
    page: ar ? "الصفحة" : "Page",
    closeModal: ar ? "إغلاق النافذة" : "Close modal",
    minAmountError: ar ? "المبلغ يجب أن يكون 0.001 أو أكثر" : "Amount must be at least 0.001",
    newRequestToast: ar ? "طلب سحب جديد من" : "New withdrawal request from",
    processedToast: ar ? "تم تحديث حالة الطلب" : "Withdrawal request status updated",
    filteredByAgent: ar ? "فلترة حسب الوكيل" : "Filtered by agent",
    clearAgentFilter: ar ? "إزالة الفلتر" : "Clear filter",
  };

  const surfaceCard = "rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]";
  const statusTabs = [
    { key: "pending", label: t.pending },
    { key: "approved", label: t.approved },
    { key: "rejected", label: t.rejected },
    { key: "all", label: t.all },
  ] as const;

  const statusClass = (status: RequestItem["status"]) => {
    if (status === "approved") return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
    if (status === "rejected") return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
    return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  };

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
            const amount = typeof data.amount === "number" ? ` (${data.amount.toFixed(3)} OMR)` : "";
            showToast(`${t.newRequestToast} ${data.agentName || "Agent"}${amount}`, "info");
          } else if (data.type === "withdrawal_processed") {
            const status = data.status || "updated";
            showToast(`${t.processedToast}: ${status}`, status === "rejected" ? "error" : "success");
          }

          refreshData();
        } catch {
          // ignore invalid event
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
  }, [refreshData, showToast, t.newRequestToast, t.processedToast]);

  function updateQuery(next: { status?: string; page?: number; search?: string }) {
    const params = new URLSearchParams();
    params.set("status", next.status ?? currentStatus);
    params.set("page", String(next.page ?? 1));
    if ((next.search ?? initialSearch).trim()) params.set("search", (next.search ?? initialSearch).trim());
    if (initialAgentUserId.trim()) params.set("agentUserId", initialAgentUserId.trim());
    if (initialAgentName.trim()) params.set("agentName", initialAgentName.trim());
    startTransition(() => router.push(`/${locale}/admin/agent-withdrawals?${params.toString()}`));
  }

  async function uploadReceipt(file: File) {
    setUploadingReceipt(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/agent-withdrawals/receipt", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as ActionResponse;
      if (!data.ok || !data.url) {
        throw new Error(data.error || "UPLOAD_FAILED");
      }

      setPayoutReceiptUrl(data.url);
      setReceiptFileName(file.name);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.uploadFailed);
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function processRequest(action: "approve" | "reject") {
    if (!activeRequest) return;
    setSaving(true);
    setError("");
    try {
      const parsedApprovedAmount = approvedAmount ? Number(approvedAmount) : activeRequest.requestedAmount;

      if (action === "approve" && !payoutReceiptUrl.trim()) {
        throw new Error(ar ? "يجب رفع الفيش أولاً" : "Please upload a receipt file first");
      }

      if (action === "approve" && (!Number.isFinite(parsedApprovedAmount) || parsedApprovedAmount < 0.001)) {
        throw new Error(t.minAmountError);
      }

      const payload: ProcessPayload = {
        requestId: activeRequest.id,
        action,
        adminNote,
      };
      if (action === "approve") {
        payload.approvedAmount = parsedApprovedAmount;
        payload.payoutMethod = "bank_transfer";
        payload.payoutReference = payoutReference;
        payload.payoutReceiptUrl = payoutReceiptUrl;
        payload.payoutBankName = payoutBankName;
        payload.payoutAccountName = payoutAccountName;
        payload.payoutAccountNumber = payoutAccountNumber;
        payload.payoutIban = payoutIban;
      }

      const res = await fetch("/api/admin/agent-withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ActionResponse;
      if (!data.ok) throw new Error(data.error || "ACTION_FAILED");

      setActiveRequest(null);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "ACTION_FAILED");
    } finally {
      setSaving(false);
    }
  }

  const filteredTotal = useMemo(() => pagination.total, [pagination.total]);
  const visibleAmount = useMemo(() => {
    return initialRequests.reduce((sum, request) => sum + request.requestedAmount, 0);
  }, [initialRequests]);

  const visibleStatusCounts = useMemo(() => {
    const pending = initialRequests.filter((request) => request.status === "pending").length;
    const approved = initialRequests.filter((request) => request.status === "approved").length;
    const rejected = initialRequests.filter((request) => request.status === "rejected").length;
    return { pending, approved, rejected };
  }, [initialRequests]);

  const clearAgentFilterHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("status", currentStatus);
    params.set("page", "1");
    if (initialSearch.trim()) params.set("search", initialSearch.trim());
    return `/${locale}/admin/agent-withdrawals?${params.toString()}`;
  }, [currentStatus, initialSearch, locale]);

  const filteredAgentLabel = useMemo(() => {
    if (!initialAgentUserId.trim()) return "";
    if (initialAgentName.trim()) return initialAgentName.trim();
    const fromList = initialRequests.find((request) => request.agentUserId === initialAgentUserId)?.agentName;
    if (fromList?.trim()) return fromList.trim();
    return initialAgentUserId;
  }, [initialAgentName, initialAgentUserId, initialRequests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400">
          <HiOutlineUserGroup className="h-4 w-4" />
          {t.totalRequests}: {filteredTotal}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className={`${surfaceCard} p-4`}>
          <p className="text-xs text-(--muted-foreground)">{t.pending}</p>
          <p className="mt-1 text-lg font-bold text-amber-600">{visibleStatusCounts.pending}</p>
        </div>
        <div className={`${surfaceCard} p-4`}>
          <p className="text-xs text-(--muted-foreground)">{t.approved}</p>
          <p className="mt-1 text-lg font-bold text-emerald-600">{visibleStatusCounts.approved}</p>
        </div>
        <div className={`${surfaceCard} p-4`}>
          <p className="text-xs text-(--muted-foreground)">{t.rejected}</p>
          <p className="mt-1 text-lg font-bold text-rose-600">{visibleStatusCounts.rejected}</p>
        </div>
        <div className={`${surfaceCard} p-4`}>
          <p className="text-xs text-(--muted-foreground)">{t.visibleAmount}</p>
          <p className="mt-1 text-lg font-bold">{visibleAmount.toFixed(3)} OMR</p>
        </div>
      </div>

      {initialAgentUserId.trim() ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-200/70 bg-indigo-50/60 px-4 py-3 text-xs font-medium text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300">
          <span>{t.filteredByAgent}: {filteredAgentLabel}</span>
          <a href={clearAgentFilterHref} className="font-semibold underline underline-offset-4 hover:opacity-80">
            {t.clearAgentFilter}
          </a>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200/70 bg-white p-2 dark:border-white/[0.06] dark:bg-white/[0.02]">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => updateQuery({ status: tab.key, page: 1 })}
            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${currentStatus === tab.key ? "bg-accent text-white shadow-sm" : "text-(--muted-foreground) hover:bg-gray-100 dark:hover:bg-white/[0.06]"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <HiOutlineSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted-foreground)/60" />
        <Input
          defaultValue={initialSearch}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateQuery({ search: (e.target as HTMLInputElement).value, page: 1 });
            }
          }}
          placeholder={t.search}
          className="py-2.5 ps-9 pe-3"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="hidden grid-cols-12 gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5 text-xs font-semibold text-(--muted-foreground) dark:border-white/[0.06] dark:bg-white/[0.02] md:grid">
          <div className="col-span-4">{t.agent}</div>
          <div className="col-span-2">{t.amount}</div>
          <div className="col-span-2">{t.status}</div>
          <div className="col-span-2">{t.date}</div>
          <div className="col-span-2 text-end">{t.action}</div>
        </div>

        {initialRequests.length === 0 ? (
          <div className="p-10 text-center text-sm text-(--muted-foreground)">{t.noData}</div>
        ) : (
          <>
            <div className="hidden divide-y divide-gray-100 dark:divide-white/[0.05] md:block">
              {initialRequests.map((request) => (
                <div
                  key={request.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm ${
                    initialAgentUserId.trim() && request.agentUserId === initialAgentUserId
                      ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                      : ""
                  }`}
                >
                  <div className="col-span-4 min-w-0">
                    <p className="truncate font-semibold">{request.agentName}</p>
                    <p className="truncate text-xs text-(--muted-foreground)">{request.agentEmail}</p>
                  </div>
                  <div className="col-span-2 tabular-nums font-medium">{request.requestedAmount.toFixed(3)} OMR</div>
                  <div className="col-span-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(request.status)}`}>{request.status}</span>
                  </div>
                  <div className="col-span-2 text-xs text-(--muted-foreground)">{new Date(request.createdAt).toLocaleDateString(ar ? "ar-OM" : "en-OM")}</div>
                  <div className="col-span-2 text-end">
                    {request.status === "pending" ? (
                      <button type="button" className="rounded-lg border border-gray-200/80 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.06]" onClick={() => {
                        setActiveRequest(request);
                        setApprovedAmount(request.requestedAmount.toString());
                        setAdminNote("");
                        setPayoutReference("");
                        setPayoutReceiptUrl("");
                        setReceiptFileName("");
                        setPayoutBankName(request.payoutBankName || "");
                        setPayoutAccountName(request.payoutAccountName || "");
                        setPayoutAccountNumber(request.payoutAccountNumber || "");
                        setPayoutIban(request.payoutIban || "");
                      }}>{t.process}</button>
                    ) : (
                      <span className="text-xs text-(--muted-foreground)">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 p-3 md:hidden">
              {initialRequests.map((request) => (
                <div
                  key={request.id}
                  className={`rounded-xl border bg-white p-3 dark:bg-white/[0.01] ${
                    initialAgentUserId.trim() && request.agentUserId === initialAgentUserId
                      ? "border-indigo-200/80 bg-indigo-50/30 dark:border-indigo-900/60 dark:bg-indigo-950/15"
                      : "border-gray-200/70 dark:border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{request.agentName}</p>
                      <p className="truncate text-xs text-(--muted-foreground)">{request.agentEmail}</p>
                    </div>
                    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass(request.status)}`}>{request.status}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-medium tabular-nums">{request.requestedAmount.toFixed(3)} OMR</span>
                    <span className="text-(--muted-foreground)">{new Date(request.createdAt).toLocaleDateString(ar ? "ar-OM" : "en-OM")}</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    {request.status === "pending" ? (
                      <button type="button" className="rounded-lg border border-gray-200/80 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.06]" onClick={() => {
                        setActiveRequest(request);
                        setApprovedAmount(request.requestedAmount.toString());
                        setAdminNote("");
                        setPayoutReference("");
                        setPayoutReceiptUrl("");
                        setReceiptFileName("");
                        setPayoutBankName(request.payoutBankName || "");
                        setPayoutAccountName(request.payoutAccountName || "");
                        setPayoutAccountNumber(request.payoutAccountNumber || "");
                        setPayoutIban(request.payoutIban || "");
                      }}>{t.process}</button>
                    ) : (
                      <span className="text-xs text-(--muted-foreground)">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200/70 bg-white px-3 py-2 text-xs text-(--muted-foreground) dark:border-white/[0.06] dark:bg-white/[0.02]">
        <span>{filteredTotal} {t.items}</span>
        <div className="flex items-center gap-2">
          <button disabled={pagination.page <= 1 || isPending} className="rounded-lg border border-gray-200/80 px-2.5 py-1 disabled:opacity-50 dark:border-white/[0.08]" onClick={() => updateQuery({ page: pagination.page - 1 })}>{t.prev}</button>
          <span>{t.page} {pagination.page}/{pagination.totalPages}</span>
          <button disabled={pagination.page >= pagination.totalPages || isPending} className="rounded-lg border border-gray-200/80 px-2.5 py-1 disabled:opacity-50 dark:border-white/[0.08]" onClick={() => updateQuery({ page: pagination.page + 1 })}>{t.next}</button>
        </div>
      </div>

      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
          <div className="relative w-full max-w-3xl rounded-2xl border border-gray-200/70 bg-white/95 p-6 shadow-2xl dark:border-white/[0.08] dark:bg-gray-900/95">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{t.process} #{activeRequest.id}</h3>
              <p className="mt-1 text-xs text-(--muted-foreground)">{activeRequest.agentName} • {activeRequest.agentEmail}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                <HiOutlineBanknotes className="h-3.5 w-3.5" />
                {activeRequest.requestedAmount.toFixed(3)} OMR
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.amount}</label>
                <Input type="number" min={0.001} step={0.001} value={approvedAmount} onChange={(e) => setApprovedAmount(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.reference}</label>
                <Input value={payoutReference} onChange={(e) => setPayoutReference(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.bankName}</label>
                <Input value={payoutBankName} onChange={(e) => setPayoutBankName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.accountName}</label>
                <Input value={payoutAccountName} onChange={(e) => setPayoutAccountName(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.accountNumber}</label>
                <Input value={payoutAccountNumber} onChange={(e) => setPayoutAccountNumber(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t.iban}</label>
                <Input value={payoutIban} onChange={(e) => setPayoutIban(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-(--muted-foreground)">{t.uploadReceipt}</label>
                <div className="rounded-xl border border-dashed border-gray-300/90 p-3 dark:border-white/[0.12]">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200/90 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.06]">
                      {uploadingReceipt ? t.uploading : payoutReceiptUrl ? t.replaceFile : t.upload}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        disabled={uploadingReceipt}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void uploadReceipt(file);
                        }}
                      />
                    </label>
                    {receiptFileName && <span className="text-xs text-(--muted-foreground)">{receiptFileName}</span>}
                    {payoutReceiptUrl && (
                      <a
                        href={payoutReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
                      >
                        {t.uploaded}
                      </a>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-(--muted-foreground)">{t.fileHint}</p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">{t.adminNote}</label>
                <Textarea rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="min-h-24" />
              </div>
            </div>
            {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
            <div className="mt-5 flex flex-col-reverse justify-between gap-2 sm:flex-row">
              <button type="button" className="rounded-xl border border-gray-200/80 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.06]" onClick={() => setActiveRequest(null)}>{t.close}</button>
              <div className="flex gap-2">
                <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-800/70 dark:text-rose-400 dark:hover:bg-rose-950/20" disabled={saving || isPending} onClick={() => processRequest("reject")}><HiOutlineXCircle className="h-4 w-4" />{t.reject}</button>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50" disabled={saving || isPending} onClick={() => processRequest("approve")}><HiOutlineCheckCircle className="h-4 w-4" />{t.approve}</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
