"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import type { WithdrawalRequest } from "@/lib/db/wallet";
import {
  HiOutlineCash,
  HiOutlineRefresh,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { useToast } from "@/components/ui/Toast";

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface WithdrawalsClientProps {
  locale: Locale;
  initialRequests: WithdrawalRequest[];
  currentStatus?: "pending" | "approved" | "rejected" | "all";
  initialSearch?: string;
  pagination: Pagination;
}

export function WithdrawalsClient({
  locale,
  initialRequests,
  currentStatus,
  initialSearch = "",
  pagination: initialPagination,
}: WithdrawalsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState<{ [key: string]: string }>({});
  const [showMessageInput, setShowMessageInput] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState<{ [key: string]: string }>({});
  const [activeStatus, setActiveStatus] = useState<string>(currentStatus || "pending");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);

  const isRTL = locale === "ar";

  const texts = {
    title: isRTL ? "طلبات السحب" : "Withdrawal Requests",
    subtitle: isRTL ? "إدارة طلبات السحب" : "Manage withdrawal requests",
    all: isRTL ? "الكل" : "All",
    pending: isRTL ? "قيد الانتظار" : "Pending",
    approved: isRTL ? "موافق عليه" : "Approved",
    rejected: isRTL ? "مرفوض" : "Rejected",
    cancelled: isRTL ? "ملغى" : "Cancelled",
    approve: isRTL ? "موافقة" : "Approve",
    reject: isRTL ? "رفض" : "Reject",
    noRequests: isRTL ? "لا توجد طلبات سحب" : "No withdrawal requests",
    amount: isRTL ? "المبلغ" : "Amount",
    balance: isRTL ? "الرصيد" : "Balance",
    message: isRTL ? "رسالة للمستخدم" : "Message to user",
    currency: isRTL ? "ر.ع" : "OMR",
    send: isRTL ? "إرسال" : "Send",
    cancel: isRTL ? "إلغاء" : "Cancel",
    insufficientBalance: isRTL ? "رصيد غير كافٍ" : "Insufficient balance",
    confirmReject: isRTL ? "هل أنت متأكد من رفض هذا الطلب؟" : "Are you sure you want to reject this request?",
    rejectReason: isRTL ? "سبب الرفض (اختياري)" : "Reason for rejection (optional)",
    yesReject: isRTL ? "نعم، رفض" : "Yes, Reject",
    available: isRTL ? "متاح" : "Available",
    optionalMessage: isRTL ? "رسالة اختيارية..." : "Optional message...",
    reasonPlaceholder: isRTL ? "سبب الرفض..." : "Reason for rejection...",
    searchPlaceholder: isRTL ? "بحث بالاسم أو رقم الهاتف..." : "Search by name or phone...",
    page: isRTL ? "صفحة" : "Page",
    of: isRTL ? "من" : "of",
    showing: isRTL ? "عرض" : "Showing",
    results: isRTL ? "نتيجة" : "results",
    previous: isRTL ? "السابق" : "Previous",
    next: isRTL ? "التالي" : "Next",
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const buildUrl = useCallback((status: string, page: number, search: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (page > 1) params.set("page", String(page));
    if (search) params.set("search", search);
    return `/${locale}/admin/withdrawals?${params.toString()}`;
  }, [locale]);

  const buildApiUrl = useCallback((status: string, page: number, search: string) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    params.set("page", String(page));
    if (search) params.set("search", search);
    return `/api/admin/wallet/withdrawals?${params.toString()}`;
  }, []);

  const fetchRequests = useCallback(async (status: string, page: number, search: string) => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(status, page, search));
      const data = await res.json();
      if (data.ok) {
        setRequests(data.requests);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  }, [buildApiUrl]);

  const refreshRequests = useCallback(async () => {
    await fetchRequests(activeStatus, pagination.page, searchQuery);
  }, [activeStatus, pagination.page, searchQuery, fetchRequests]);

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    const message = action === "approve" 
      ? (messageInput[requestId] || "") 
      : (rejectMessage[requestId] || "");
    setProcessingId(requestId);
    
    try {
      const res = await fetch("/api/admin/wallet/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, message }),
      });

      const data = await res.json();
      if (data.ok) {
        // Update local state
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action === "approve" ? "approved" : "rejected", adminMessage: message || null }
            : req
        ));
        setShowMessageInput(null);
        setShowRejectConfirm(null);
        setMessageInput(prev => ({ ...prev, [requestId]: "" }));
        setRejectMessage(prev => ({ ...prev, [requestId]: "" }));
      } else {
        toast({ message: data.error || "Failed to process request", variant: "error" });
      }
    } catch (error) {
      console.error("Failed to process request:", error);
      toast({ message: "Failed to process request", variant: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusFilter = async (status: string) => {
    setActiveStatus(status);
    await fetchRequests(status, 1, searchQuery);
    router.replace(buildUrl(status, 1, searchQuery), { scroll: false });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    await fetchRequests(activeStatus, 1, searchInput);
    router.replace(buildUrl(activeStatus, 1, searchInput), { scroll: false });
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    await fetchRequests(activeStatus, newPage, searchQuery);
    router.replace(buildUrl(activeStatus, newPage, searchQuery), { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <HiOutlineCash className="h-7 w-7 text-accent" />
            {texts.title}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {texts.subtitle}
          </p>
        </div>
        <button
          onClick={refreshRequests}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-(--surface) transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <HiOutlineRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Status Filter & Search */}
      <div className="space-y-4">
        {/* Status Filter - Full width on mobile */}
        <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-(--surface)">
          {[
            { key: "pending", label: texts.pending },
            { key: "approved", label: texts.approved },
            { key: "rejected", label: texts.rejected },
            { key: "all", label: texts.all },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleStatusFilter(key)}
              disabled={loading}
              className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-70 ${
                activeStatus === key
                  ? "bg-accent text-white shadow-md"
                  : "hover:bg-(--surface-hover) text-(--muted-foreground)"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search - Full width */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-(--muted-foreground)" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={texts.searchPlaceholder}
              className="w-full ps-12 pe-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              style={{ borderColor: "var(--surface-border)" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-all disabled:opacity-70 shadow-sm hover:shadow-md"
          >
            {isRTL ? "بحث" : "Search"}
          </button>
        </form>
      </div>

      {/* Results info */}
      {pagination.total > 0 && (
        <div className="text-sm text-(--muted-foreground)">
          {texts.showing} {((pagination.page - 1) * pagination.perPage) + 1}-{Math.min(pagination.page * pagination.perPage, pagination.total)} {texts.of} {pagination.total} {texts.results}
        </div>
      )}

      {/* Requests List */}
      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--surface-border)" }}>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-(--muted-foreground)">
            {texts.noRequests}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-(--surface) hover:bg-(--surface-hover) transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* User Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <HiOutlineUser className="h-4 w-4 text-(--muted-foreground)" />
                      <span className="font-medium">{req.userDisplayName}</span>
                      <span className="text-(--muted-foreground)">•</span>
                      <HiOutlinePhone className="h-4 w-4 text-(--muted-foreground)" />
                      <span className="text-sm font-mono" dir="ltr">{req.userPhone}</span>
                    </div>

                    {/* Amount & Balance */}
                    <div className="flex items-center gap-4 mb-2 flex-wrap">
                      <div>
                        <span className="text-sm text-(--muted-foreground)">{texts.amount}: </span>
                        <span className="font-semibold text-red-600">
                          {formatAmount(req.amount)} {texts.currency}
                        </span>
                      </div>
                      {req.userBalance !== undefined && (
                        <div>
                          <span className="text-sm text-(--muted-foreground)">{texts.available}: </span>
                          <span className={`font-medium ${req.userBalance < req.amount ? "text-red-500" : "text-green-600"}`}>
                            {formatAmount(req.userBalance)} {texts.currency}
                          </span>
                          {req.userBalance < req.amount && (
                            <span className="text-xs text-red-500 ms-2">({texts.insufficientBalance})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-(--muted-foreground)">
                      {formatDate(req.createdAt)}
                    </div>

                    {/* Admin Message (if exists) */}
                    {req.adminMessage && (
                      <div className="mt-2 text-sm italic text-(--muted-foreground)">
                        &ldquo;{req.adminMessage}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Status Badge */}
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${
                      req.status === "approved" ? "bg-green-500/10 text-green-600" :
                      req.status === "rejected" ? "bg-red-500/10 text-red-600" :
                      req.status === "cancelled" ? "bg-gray-500/10 text-gray-600" :
                      "bg-yellow-500/10 text-yellow-600"
                    }`}>
                      {req.status === "approved" ? (
                        <><HiOutlineCheckCircle className="h-4 w-4" />{texts.approved}</>
                      ) : req.status === "rejected" ? (
                        <><HiOutlineXCircle className="h-4 w-4" />{texts.rejected}</>
                      ) : req.status === "cancelled" ? (
                        <><HiOutlineXCircle className="h-4 w-4" />{texts.cancelled}</>
                      ) : (
                        <><HiOutlineClock className="h-4 w-4" />{texts.pending}</>
                      )}
                    </div>

                    {/* Action Buttons (only for pending) */}
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowMessageInput(showMessageInput === req.id ? null : req.id)}
                          disabled={processingId === req.id || (req.userBalance !== undefined && req.userBalance < req.amount)}
                          className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                          title={texts.approve}
                        >
                          <HiOutlineCheck className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setShowRejectConfirm(showRejectConfirm === req.id ? null : req.id)}
                          disabled={processingId === req.id}
                          className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          title={texts.reject}
                        >
                          <HiOutlineX className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Input (when approving) */}
                {showMessageInput === req.id && req.status === "pending" && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--surface-border)" }}>
                    <label className="block text-sm font-medium mb-2">{texts.message}</label>
                    <input
                      type="text"
                      value={messageInput[req.id] || ""}
                      onChange={(e) => setMessageInput(prev => ({ ...prev, [req.id]: e.target.value }))}
                      placeholder={texts.optionalMessage}
                      className="w-full px-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-accent mb-3"
                      style={{ borderColor: "var(--surface-border)" }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowMessageInput(null)}
                        className="px-4 py-2 rounded-xl border hover:bg-(--surface) transition-colors"
                        style={{ borderColor: "var(--surface-border)" }}
                      >
                        {texts.cancel}
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "approve")}
                        disabled={processingId === req.id || (req.userBalance !== undefined && req.userBalance < req.amount)}
                        className="px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {processingId === req.id ? (
                          <HiOutlineRefresh className="h-5 w-5 animate-spin" />
                        ) : (
                          texts.approve
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Reject Confirmation */}
                {showRejectConfirm === req.id && req.status === "pending" && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--surface-border)" }}>
                    <div className="flex items-center gap-2 mb-3 text-red-600">
                      <HiOutlineXCircle className="h-5 w-5" />
                      <span className="font-medium">{texts.confirmReject}</span>
                    </div>
                    <label className="block text-sm font-medium mb-2">{texts.rejectReason}</label>
                    <input
                      type="text"
                      value={rejectMessage[req.id] || ""}
                      onChange={(e) => setRejectMessage(prev => ({ ...prev, [req.id]: e.target.value }))}
                      placeholder={texts.reasonPlaceholder}
                      className="w-full px-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
                      style={{ borderColor: "var(--surface-border)" }}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowRejectConfirm(null)}
                        className="px-4 py-2 rounded-xl border hover:bg-(--surface) transition-colors"
                        style={{ borderColor: "var(--surface-border)" }}
                      >
                        {texts.cancel}
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "reject")}
                        disabled={processingId === req.id}
                        className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        {processingId === req.id ? (
                          <HiOutlineRefresh className="h-5 w-5 animate-spin" />
                        ) : (
                          texts.yesReject
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={loading || pagination.page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-(--surface) transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--surface-border)" }}
          >
            <HiOutlineChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{texts.previous}</span>
          </button>

          <div className="flex items-center gap-1">
            {/* First page */}
            {pagination.page > 2 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl hover:bg-(--surface) transition-colors"
                >
                  1
                </button>
                {pagination.page > 3 && <span className="px-2">...</span>}
              </>
            )}

            {/* Previous page */}
            {pagination.page > 1 && (
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={loading}
                className="px-3 py-2 rounded-xl hover:bg-(--surface) transition-colors"
              >
                {pagination.page - 1}
              </button>
            )}

            {/* Current page */}
            <button
              disabled
              className="px-3 py-2 rounded-xl bg-accent text-white"
            >
              {pagination.page}
            </button>

            {/* Next page */}
            {pagination.page < pagination.totalPages && (
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={loading}
                className="px-3 py-2 rounded-xl hover:bg-(--surface) transition-colors"
              >
                {pagination.page + 1}
              </button>
            )}

            {/* Last page */}
            {pagination.page < pagination.totalPages - 1 && (
              <>
                {pagination.page < pagination.totalPages - 2 && <span className="px-2">...</span>}
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl hover:bg-(--surface) transition-colors"
                >
                  {pagination.totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={loading || pagination.page >= pagination.totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-(--surface) transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--surface-border)" }}
          >
            <span className="hidden sm:inline">{texts.next}</span>
            <HiOutlineChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
