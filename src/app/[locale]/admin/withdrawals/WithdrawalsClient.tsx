"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
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
} from "react-icons/hi";

interface WithdrawalsClientProps {
  locale: Locale;
  dict: Dictionary;
  initialRequests: WithdrawalRequest[];
  currentStatus?: "pending" | "approved" | "rejected" | "all";
}

export function WithdrawalsClient({
  locale,
  dict,
  initialRequests,
  currentStatus,
}: WithdrawalsClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState<{ [key: string]: string }>({});
  const [showMessageInput, setShowMessageInput] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState<{ [key: string]: string }>({});
  const [activeStatus, setActiveStatus] = useState<string>(currentStatus || "pending");

  const isRTL = locale === "ar";

  const texts = {
    title: isRTL ? "طلبات السحب" : "Withdrawal Requests",
    subtitle: isRTL ? "إدارة طلبات السحب" : "Manage withdrawal requests",
    all: isRTL ? "الكل" : "All",
    pending: isRTL ? "قيد الانتظار" : "Pending",
    approved: isRTL ? "موافق عليه" : "Approved",
    rejected: isRTL ? "مرفوض" : "Rejected",
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

  const refreshRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = activeStatus && activeStatus !== "all"
        ? `/api/admin/wallet/withdrawals?status=${activeStatus}`
        : "/api/admin/wallet/withdrawals";
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to refresh requests:", error);
    } finally {
      setLoading(false);
    }
  }, [activeStatus]);

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
        alert(data.error || "Failed to process request");
      }
    } catch (error) {
      console.error("Failed to process request:", error);
      alert("Failed to process request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusFilter = async (status: string) => {
    setActiveStatus(status);
    setLoading(true);
    try {
      const url = status === "all"
        ? "/api/admin/wallet/withdrawals"
        : `/api/admin/wallet/withdrawals?status=${status}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to filter requests:", error);
    } finally {
      setLoading(false);
    }
    // Update URL without full page reload
    router.replace(`/${locale}/admin/withdrawals?status=${status}`, { scroll: false });
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

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
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
            className={`px-4 py-2 rounded-xl transition-colors disabled:opacity-70 ${
              activeStatus === key
                ? "bg-accent text-white"
                : "bg-(--surface) hover:bg-(--surface-hover)"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
                          <span className="text-sm text-(--muted-foreground)">{isRTL ? "متاح:" : "Available:"} </span>
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
                        "{req.adminMessage}"
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Status Badge */}
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium ${
                      req.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                      req.status === "approved" ? "bg-green-500/10 text-green-600" :
                      "bg-red-500/10 text-red-600"
                    }`}>
                      {req.status === "pending" && <HiOutlineClock className="h-4 w-4" />}
                      {req.status === "approved" && <HiOutlineCheckCircle className="h-4 w-4" />}
                      {req.status === "rejected" && <HiOutlineXCircle className="h-4 w-4" />}
                      {req.status === "pending" && texts.pending}
                      {req.status === "approved" && texts.approved}
                      {req.status === "rejected" && texts.rejected}
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
                      placeholder={isRTL ? "رسالة اختيارية..." : "Optional message..."}
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
                      placeholder={isRTL ? "سبب الرفض..." : "Reason for rejection..."}
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
    </div>
  );
}
