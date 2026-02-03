"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { WalletTransaction, WithdrawalRequest } from "@/lib/db/wallet";
import {
  HiOutlineCash,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineSwitchHorizontal,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBell,
} from "react-icons/hi";

// Notification sound (simple beep using Web Audio API)
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    gainNode.gain.value = 0.3;
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    // Second beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1000;
      osc2.type = "sine";
      gain2.gain.value = 0.3;
      osc2.start();
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      osc2.stop(audioContext.currentTime + 0.3);
    }, 150);
  } catch (e) {
    console.log("Could not play notification sound:", e);
  }
}

interface WalletClientProps {
  locale: Locale;
  dict: Dictionary;
  user: {
    id: string;
    role: string;
    displayName: string;
    phone: string;
  };
  initialWallet: {
    balance: number;
    accountNumber: string;
  };
  initialTransactions: WalletTransaction[];
  initialWithdrawalRequests?: WithdrawalRequest[];
}

type ModalType = "deposit" | "withdraw" | "transfer" | null;

export function WalletClient({
  locale,
  dict,
  user,
  initialWallet,
  initialTransactions,
  initialWithdrawalRequests = [],
}: WalletClientProps) {
  const [wallet, setWallet] = useState(initialWallet);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(initialWithdrawalRequests);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "requests">("transactions");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const isRTL = locale === "ar";
  const isAdmin = user.role === "admin";

  // Show toast notification
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const walletDict = (dict as Record<string, any>).wallet ?? {
    title: isRTL ? "المحفظة" : "Wallet",
    balance: isRTL ? "الرصيد" : "Balance",
    accountNumber: isRTL ? "رقم الحساب" : "Account Number",
    deposit: isRTL ? "إيداع" : "Deposit",
    withdraw: isRTL ? "سحب" : "Withdraw",
    transfer: isRTL ? "تحويل" : "Transfer",
    transactions: isRTL ? "المعاملات" : "Transactions",
    noTransactions: isRTL ? "لا توجد معاملات بعد" : "No transactions yet",
    amount: isRTL ? "المبلغ" : "Amount",
    description: isRTL ? "الوصف" : "Description",
    toAccount: isRTL ? "إلى رقم الحساب" : "To Account",
    confirm: isRTL ? "تأكيد" : "Confirm",
    cancel: isRTL ? "إلغاء" : "Cancel",
    copied: isRTL ? "تم النسخ" : "Copied",
    insufficientBalance: isRTL ? "رصيد غير كافٍ" : "Insufficient balance",
    success: isRTL ? "نجاح" : "Success",
    error: isRTL ? "خطأ" : "Error",
    lookupUser: isRTL ? "البحث عن المستخدم" : "Lookup User",
    receiverNotFound: isRTL ? "المستخدم غير موجود" : "User not found",
    currency: isRTL ? "ر.ع" : "OMR",
    withdrawalRequests: isRTL ? "طلبات السحب" : "Withdrawal Requests",
    pending: isRTL ? "قيد الانتظار" : "Pending",
    approved: isRTL ? "موافق عليه" : "Approved",
    rejected: isRTL ? "مرفوض" : "Rejected",
    noRequests: isRTL ? "لا توجد طلبات سحب" : "No withdrawal requests",
    requestSubmitted: isRTL ? "تم تقديم طلب السحب" : "Withdrawal request submitted",
  };

  const copyAccountNumber = useCallback(() => {
    navigator.clipboard.writeText(wallet.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [wallet.accountNumber]);

  const refreshWallet = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, requestsRes] = await Promise.all([
        fetch("/api/wallet"),
        fetch("/api/wallet/withdraw"),
      ]);
      const walletData = await walletRes.json();
      const requestsData = await requestsRes.json();
      
      if (walletData.ok) {
        setWallet({
          balance: walletData.wallet.balance,
          accountNumber: walletData.wallet.accountNumber,
        });
        setTransactions(walletData.transactions);
      }
      
      if (requestsData.ok) {
        setWithdrawalRequests(requestsData.requests);
      }
    } catch (error) {
      console.error("Failed to refresh wallet:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect to SSE for real-time updates
  useEffect(() => {
    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource("/api/wallet/stream");
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "connected") {
            console.log("Wallet SSE connected");
            return;
          }

          // Play notification sound
          playNotificationSound();

          // Update balance if provided
          if (data.balance !== undefined) {
            setWallet(prev => ({ ...prev, balance: data.balance }));
          }

          // Show appropriate toast message
          switch (data.type) {
            case "deposit":
              showToast(
                isRTL 
                  ? `تم إيداع ${data.amount?.toFixed(3)} ر.ع إلى حسابك`
                  : `${data.amount?.toFixed(3)} OMR deposited to your account`,
                "success"
              );
              break;
            case "transfer_in":
              showToast(
                isRTL 
                  ? `تم استلام ${data.amount?.toFixed(3)} ر.ع من ${data.fromUser}`
                  : `Received ${data.amount?.toFixed(3)} OMR from ${data.fromUser}`,
                "success"
              );
              break;
            case "transfer_out":
              showToast(
                isRTL 
                  ? `تم إرسال ${data.amount?.toFixed(3)} ر.ع إلى ${data.toUser}`
                  : `Sent ${data.amount?.toFixed(3)} OMR to ${data.toUser}`,
                "info"
              );
              break;
            case "withdraw_approved":
              showToast(
                isRTL 
                  ? `تمت الموافقة على طلب السحب: ${data.amount?.toFixed(3)} ر.ع`
                  : `Withdrawal approved: ${data.amount?.toFixed(3)} OMR`,
                "success"
              );
              setActiveTab("requests");
              break;
            case "withdraw_rejected":
              showToast(
                isRTL 
                  ? `تم رفض طلب السحب: ${data.message || ""}`
                  : `Withdrawal rejected: ${data.message || ""}`,
                "error"
              );
              setActiveTab("requests");
              break;
          }

          // Refresh data
          refreshWallet();
        } catch (e) {
          console.error("Error parsing SSE message:", e);
        }
      };

      eventSource.onerror = () => {
        console.log("Wallet SSE error, reconnecting...");
        eventSource.close();
        // Reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isRTL, showToast, refreshWallet]);

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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <HiOutlineArrowDown className="h-5 w-5 text-green-500" />;
      case "withdraw":
        return <HiOutlineArrowUp className="h-5 w-5 text-red-500" />;
      case "transfer_in":
        return <HiOutlineSwitchHorizontal className="h-5 w-5 text-green-500" />;
      case "transfer_out":
        return <HiOutlineSwitchHorizontal className="h-5 w-5 text-red-500" />;
      default:
        return <HiOutlineCash className="h-5 w-5" />;
    }
  };

  const getTransactionColor = (type: string) => {
    return type === "deposit" || type === "transfer_in"
      ? "text-green-600"
      : "text-red-600";
  };

  const getTransactionSign = (type: string) => {
    return type === "deposit" || type === "transfer_in" ? "+" : "-";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <HiOutlineCash className="h-7 w-7 text-accent" />
            {walletDict.title}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {isRTL ? "إدارة محفظتك" : "Manage your wallet"}
          </p>
        </div>
        <button
          onClick={refreshWallet}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-(--surface) transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <HiOutlineRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl border p-6 bg-gradient-to-br from-accent/10 to-accent-2/10" style={{ borderColor: "var(--surface-border)" }}>
        <div className="text-sm text-(--muted-foreground) mb-1">{walletDict.balance}</div>
        <div className="text-4xl font-bold text-accent mb-4">
          {formatAmount(wallet.balance)} <span className="text-lg">{walletDict.currency}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="text-(--muted-foreground)">{walletDict.accountNumber}:</span>
          <code className="font-mono bg-(--surface) px-2 py-1 rounded">{wallet.accountNumber}</code>
          <button
            onClick={copyAccountNumber}
            className="p-1 rounded hover:bg-(--surface) transition-colors"
            aria-label="Copy"
          >
            <HiOutlineClipboardCopy className="h-4 w-4" />
          </button>
          {copied && <span className="text-green-500 text-xs">{walletDict.copied}</span>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {/* Deposit - Admin can use, non-admin sees disabled */}
        <button
          onClick={isAdmin ? () => setModalType("deposit") : undefined}
          disabled={!isAdmin}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            isAdmin 
              ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 cursor-pointer" 
              : "bg-gray-500/10 text-gray-400 cursor-not-allowed"
          }`}
        >
          <HiOutlineArrowDown className="h-5 w-5" />
          {walletDict.deposit}
        </button>
        <button
          onClick={() => setModalType("withdraw")}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors font-medium"
        >
          <HiOutlineArrowUp className="h-5 w-5" />
          {walletDict.withdraw}
        </button>
        <button
          onClick={() => setModalType("transfer")}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-medium"
        >
          <HiOutlineSwitchHorizontal className="h-5 w-5" />
          {walletDict.transfer}
        </button>
      </div>

      {/* Transactions / Withdrawal Requests Tabs */}
      <div className="rounded-2xl border p-4" style={{ borderColor: "var(--surface-border)" }}>
        {/* Tab Headers */}
        <div className="flex gap-4 border-b pb-2 mb-4" style={{ borderColor: "var(--surface-border)" }}>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`font-semibold px-2 pb-2 transition-colors ${
              activeTab === "transactions"
                ? "text-accent border-b-2 border-accent"
                : "text-(--muted-foreground) hover:text-(--foreground)"
            }`}
          >
            {walletDict.transactions}
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`font-semibold px-2 pb-2 transition-colors ${
              activeTab === "requests"
                ? "text-accent border-b-2 border-accent"
                : "text-(--muted-foreground) hover:text-(--foreground)"
            }`}
          >
            {walletDict.withdrawalRequests}
            {withdrawalRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="ms-2 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {withdrawalRequests.filter(r => r.status === "pending").length}
              </span>
            )}
          </button>
        </div>

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <>
            <h3 className="text-lg font-semibold mb-4">{walletDict.transactions}</h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-(--muted-foreground)">
                {walletDict.noTransactions}
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-(--surface) hover:bg-(--surface-hover) transition-colors"
                >
                  <div className="p-2 rounded-full bg-background">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{tx.description}</div>
                    <div className="text-xs text-(--muted-foreground)">
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                  <div className={`font-semibold ${getTransactionColor(tx.type)}`}>
                    {getTransactionSign(tx.type)}{formatAmount(tx.amount)} {walletDict.currency}
                  </div>
                </div>
              ))}
            </div>
            )}
          </>
        )}

        {/* Withdrawal Requests Tab */}
        {activeTab === "requests" && (
          <>
            <h3 className="text-lg font-semibold mb-4">{walletDict.withdrawalRequests}</h3>
            {withdrawalRequests.length === 0 ? (
              <div className="text-center py-8 text-(--muted-foreground)">
                {walletDict.noRequests}
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawalRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-(--surface) hover:bg-(--surface-hover) transition-colors"
                >
                  <div className="p-2 rounded-full bg-background">
                    {req.status === "pending" && <HiOutlineClock className="h-5 w-5 text-yellow-500" />}
                    {req.status === "approved" && <HiOutlineCheckCircle className="h-5 w-5 text-green-500" />}
                    {req.status === "rejected" && <HiOutlineXCircle className="h-5 w-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {formatAmount(req.amount)} {walletDict.currency}
                    </div>
                    <div className="text-xs text-(--muted-foreground)">
                      {formatDate(req.createdAt)}
                    </div>
                    {req.adminMessage && (
                      <div className="text-xs mt-1 text-(--muted-foreground) italic">
                        {req.adminMessage}
                      </div>
                    )}
                  </div>
                  <div className={`text-sm font-medium px-2 py-1 rounded-lg ${
                    req.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                    req.status === "approved" ? "bg-green-500/10 text-green-600" :
                    "bg-red-500/10 text-red-600"
                  }`}>
                    {req.status === "pending" && walletDict.pending}
                    {req.status === "approved" && walletDict.approved}
                    {req.status === "rejected" && walletDict.rejected}
                  </div>
                </div>
              ))}
            </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {modalType && (
        <WalletModal
          type={modalType}
          locale={locale}
          walletDict={walletDict}
          isAdmin={isAdmin}
          currentBalance={wallet.balance}
          onClose={() => setModalType(null)}
          onSuccess={refreshWallet}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 ${
            toast.type === "success" 
              ? "bg-green-500 text-white" 
              : toast.type === "error" 
                ? "bg-red-500 text-white" 
                : "bg-accent text-white"
          }`}
        >
          <HiOutlineBell className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="ms-2 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <HiOutlineXCircle className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Modal Component
function WalletModal({
  type,
  locale,
  walletDict,
  isAdmin,
  currentBalance,
  onClose,
  onSuccess,
}: {
  type: "deposit" | "withdraw" | "transfer";
  locale: Locale;
  walletDict: Record<string, string>;
  isAdmin: boolean;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [receiverInfo, setReceiverInfo] = useState<{ displayName: string; accountNumber: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isRTL = locale === "ar";

  const handleLookup = async () => {
    if (!toAccount.trim()) return;
    
    setLookupLoading(true);
    setError(null);
    setReceiverInfo(null);
    
    try {
      const res = await fetch(`/api/wallet/lookup?phone=${encodeURIComponent(toAccount)}`);
      const data = await res.json();
      
      if (data.ok) {
        setReceiverInfo(data.user);
      } else {
        setError(data.error || walletDict.receiverNotFound);
      }
    } catch {
      setError(walletDict.error);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError(isRTL ? "المبلغ غير صالح" : "Invalid amount");
      return;
    }

    if (type === "withdraw" && amountNum > currentBalance) {
      setError(walletDict.insufficientBalance);
      return;
    }

    if (type === "transfer" && !receiverInfo) {
      setError(walletDict.receiverNotFound);
      return;
    }

    setLoading(true);

    try {
      let endpoint = "";
      let body: Record<string, any> = {};

      if (type === "deposit") {
        endpoint = "/api/wallet/deposit";
        body = { accountNumber: toAccount, amount: amountNum, description };
      } else if (type === "withdraw") {
        endpoint = "/api/wallet/withdraw";
        body = { amount: amountNum, description };
      } else {
        endpoint = "/api/wallet/transfer";
        body = { toAccountNumber: receiverInfo!.accountNumber, amount: amountNum, description };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.ok) {
        setSuccess(true);
        // Set appropriate success message
        if (type === "withdraw") {
          setSuccessMessage(walletDict.requestSubmitted);
        } else {
          setSuccessMessage(walletDict.success);
        }
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || walletDict.error);
      }
    } catch {
      setError(walletDict.error);
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = type === "deposit" 
    ? walletDict.deposit 
    : type === "withdraw" 
      ? walletDict.withdraw 
      : walletDict.transfer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl"
        style={{ borderColor: "var(--surface-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">{modalTitle}</h3>

        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✓</div>
            <div className="text-green-500 font-semibold">{successMessage || walletDict.success}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Number (for deposit by admin or transfer) */}
            {(type === "deposit" || type === "transfer") && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  {walletDict.toAccount}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={toAccount}
                    onChange={(e) => {
                      setToAccount(e.target.value);
                      setReceiverInfo(null);
                    }}
                    placeholder={isRTL ? "رقم هاتف المستلم" : "Receiver phone number"}
                    className="flex-1 px-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                    style={{ borderColor: "var(--surface-border)" }}
                    dir="ltr"
                  />
                  {type === "transfer" && (
                    <button
                      type="button"
                      onClick={handleLookup}
                      disabled={lookupLoading || !toAccount.trim()}
                      className="px-4 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                    >
                      {lookupLoading ? (
                        <HiOutlineRefresh className="h-5 w-5 animate-spin" />
                      ) : (
                        <HiOutlineSearch className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
                {receiverInfo && (
                  <div className="mt-2 p-2 rounded-lg bg-green-500/10 text-green-600 text-sm">
                    {isRTL ? "المستلم:" : "Receiver:"} {receiverInfo.displayName}
                  </div>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {walletDict.amount} ({walletDict.currency})
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                style={{ borderColor: "var(--surface-border)" }}
                dir="ltr"
                required
              />
              {type === "withdraw" && (
                <div className="mt-1 text-xs text-(--muted-foreground)">
                  {isRTL ? "الرصيد المتاح:" : "Available:"} {currentBalance.toFixed(3)} {walletDict.currency}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {walletDict.description} ({isRTL ? "اختياري" : "Optional"})
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isRTL ? "وصف المعاملة" : "Transaction description"}
                className="w-full px-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                style={{ borderColor: "var(--surface-border)" }}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl border hover:bg-(--surface) transition-colors"
                style={{ borderColor: "var(--surface-border)" }}
              >
                {walletDict.cancel}
              </button>
              <button
                type="submit"
                disabled={loading || (type === "transfer" && !receiverInfo)}
                className="flex-1 px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <HiOutlineRefresh className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  walletDict.confirm
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
