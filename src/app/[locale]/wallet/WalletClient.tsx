"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { WalletTransaction, WithdrawalRequest, WalletTransactionDetail } from "@/lib/db/wallet";
import {
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
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { IoWalletOutline } from "react-icons/io5";

// Notification sound (simple beep using Web Audio API)
function playNotificationSound() {
  try {
    const webkitAudioContext = (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const AudioContextCtor = window.AudioContext || webkitAudioContext;
    if (!AudioContextCtor) return;
    const audioContext = new AudioContextCtor();
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
    pendingWithdrawals: number;
    availableBalance: number;
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
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransactionDetail | null>(null);
  const [txDetailsLoading, setTxDetailsLoading] = useState(false);
  const [txDetailsError, setTxDetailsError] = useState<string | null>(null);
  const [hideBalance, setHideBalance] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("wallet_hide_balance") === "true";
    }
    return false;
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBalanceRef = useRef<number>(initialWallet.balance);
  const sseConnectedRef = useRef<boolean>(false);

  const isRTL = locale === "ar";
  const isAdmin = user.role === "admin";
  const isAgent = user.role === "agent";

  // Show toast notification
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const walletDict = useMemo(() => {
    const root = dict as unknown as { wallet?: Record<string, string> };
    const defaults: Record<string, string> = {
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
      cancelled: isRTL ? "ملغى" : "Cancelled",
      noRequests: isRTL ? "لا توجد طلبات سحب" : "No withdrawal requests",
      requestSubmitted: isRTL ? "تم تقديم طلب السحب" : "Withdrawal request submitted",
      requestCancelled: isRTL ? "تم إلغاء طلب السحب" : "Withdrawal request cancelled",
      availableBalance: isRTL ? "الرصيد المتاح" : "Available Balance",
      pendingAmount: isRTL ? "قيد الانتظار" : "Pending",
      max: isRTL ? "الحد الأقصى" : "Max",
      cancelRequest: isRTL ? "إلغاء" : "Cancel",
      viewDetails: isRTL ? "عرض التفاصيل" : "View details",
      txDetailsTitle: isRTL ? "تفاصيل المعاملة" : "Transaction Details",
      transactionId: isRTL ? "معرّف المعاملة" : "Transaction ID",
      transactionType: isRTL ? "نوع العملية" : "Transaction Type",
      createdAt: isRTL ? "تاريخ العملية" : "Created At",
      sender: isRTL ? "المرسل" : "Sender",
      receiver: isRTL ? "المستلم" : "Receiver",
      walletOwner: isRTL ? "صاحب هذه المحفظة" : "Wallet Owner",
      accountNo: isRTL ? "رقم الحساب" : "Account Number",
      userName: isRTL ? "الاسم" : "Name",
      phone: isRTL ? "الهاتف" : "Phone",
      balanceBefore: isRTL ? "الرصيد قبل العملية" : "Balance Before",
      balanceAfter: isRTL ? "الرصيد بعد العملية" : "Balance After",
      close: isRTL ? "إغلاق" : "Close",
      txNotAvailable: isRTL ? "تفاصيل هذه المعاملة غير متوفرة" : "Transaction details are not available",
      unknownParty: isRTL ? "غير محدد" : "Unknown",
    };
    return {
      ...defaults,
      ...(root.wallet ?? {}),
    };
  }, [dict, isRTL]);

  const copyAccountNumber = useCallback(() => {
    navigator.clipboard.writeText(wallet.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [wallet.accountNumber]);

  const refreshWallet = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [walletRes, requestsRes] = await Promise.all([
        fetch("/api/wallet"),
        fetch("/api/wallet/withdraw"),
      ]);
      const walletData = await walletRes.json();
      const requestsData = await requestsRes.json();
      
      if (walletData.ok) {
        const newBalance = walletData.wallet.balance;
        const oldBalance = lastBalanceRef.current;
        
        // Check if balance changed (for polling fallback notification)
        if (!sseConnectedRef.current && newBalance !== oldBalance) {
          const diff = newBalance - oldBalance;
          playNotificationSound();
          
          if (diff > 0) {
            showToast(
              isRTL
                ? `تم استلام ${diff.toFixed(3)} ر.ع`
                : `Received ${diff.toFixed(3)} OMR`,
              "success"
            );
          } else {
            showToast(
              isRTL
                ? `تم إرسال ${Math.abs(diff).toFixed(3)} ر.ع`
                : `Sent ${Math.abs(diff).toFixed(3)} OMR`,
              "info"
            );
          }
        }
        
        lastBalanceRef.current = newBalance;
        setWallet({
          balance: newBalance,
          accountNumber: walletData.wallet.accountNumber,
          pendingWithdrawals: walletData.wallet.pendingWithdrawals || 0,
          availableBalance: walletData.wallet.availableBalance ?? newBalance,
        });
        setTransactions(walletData.transactions);
      }
      
      if (requestsData.ok) {
        setWithdrawalRequests(requestsData.requests);
      }
    } catch (error) {
      console.error("Failed to refresh wallet:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isRTL, showToast]);

  // Cancel withdrawal request
  const cancelWithdrawalRequest = useCallback(async (requestId: string) => {
    try {
      const res = await fetch(`/api/wallet/withdraw?id=${requestId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      
      if (data.ok) {
        showToast(walletDict.requestCancelled, "success");
        refreshWallet();
      } else {
        showToast(data.error || walletDict.error, "error");
      }
    } catch {
      showToast(walletDict.error, "error");
    }
  }, [showToast, walletDict, refreshWallet]);

  const openTransactionDetails = useCallback(async (transactionId: string) => {
    setTxDetailsLoading(true);
    setTxDetailsError(null);
    setSelectedTransaction(null);
    try {
      const res = await fetch(`/api/wallet/transactions/${encodeURIComponent(transactionId)}`);
      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.transaction) {
        throw new Error(data?.error || walletDict.txNotAvailable);
      }
      setSelectedTransaction(data.transaction as WalletTransactionDetail);
    } catch (error) {
      setTxDetailsError(error instanceof Error ? error.message : walletDict.txNotAvailable);
    } finally {
      setTxDetailsLoading(false);
    }
  }, [walletDict.txNotAvailable]);

  const closeTransactionDetails = useCallback(() => {
    setSelectedTransaction(null);
    setTxDetailsError(null);
    setTxDetailsLoading(false);
  }, []);

  // Connect to SSE for real-time updates with polling fallback
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout | null = null;
    
    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource("/api/wallet/stream");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("Wallet SSE connected");
        sseConnectedRef.current = true;
        // Stop polling when SSE is connected
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "connected") {
            return;
          }

          // Play notification sound
          playNotificationSound();

          // Update balance if provided
          if (data.balance !== undefined) {
            lastBalanceRef.current = data.balance;
            setWallet(prev => ({ 
              ...prev, 
              balance: data.balance,
              availableBalance: data.balance - prev.pendingWithdrawals,
            }));
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

          // Refresh data to get full transaction details
          refreshWallet(true);
        } catch (e) {
          console.error("Error parsing SSE message:", e);
        }
      };

      eventSource.onerror = () => {
        console.log("Wallet SSE error, starting polling fallback...");
        sseConnectedRef.current = false;
        eventSource.close();
        
        // Start polling as fallback
        if (!pollingIntervalRef.current) {
          pollingIntervalRef.current = setInterval(() => {
            refreshWallet(true);
          }, 5000); // Poll every 5 seconds
        }
        
        // Try to reconnect SSE after 10 seconds
        reconnectTimeout = setTimeout(connectSSE, 10000);
      };
    };

    connectSSE();

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
        return <IoWalletOutline className="h-5 w-5" />;
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
            <IoWalletOutline className="h-7 w-7 text-accent" />
            {walletDict.title}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {isRTL ? "إدارة محفظتك" : "Manage your wallet"}
          </p>
        </div>
        <button
          onClick={() => refreshWallet()}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-(--surface) transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <HiOutlineRefresh className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl border p-6 bg-gradient-to-br from-accent/10 to-accent-2/10" style={{ borderColor: "var(--surface-border)" }}>
        {/* Main Balance */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm text-(--muted-foreground)">{walletDict.balance}</div>
          <button
            onClick={() => {
              const newValue = !hideBalance;
              setHideBalance(newValue);
              localStorage.setItem("wallet_hide_balance", String(newValue));
            }}
            className="p-1.5 rounded-lg hover:bg-(--surface) transition-colors text-(--muted-foreground) hover:text-foreground"
            aria-label={hideBalance ? "Show balance" : "Hide balance"}
          >
            {hideBalance ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
          </button>
        </div>
        <div className="text-4xl font-bold text-accent mb-4">
          {hideBalance ? "***" : formatAmount(wallet.balance)} <span className="text-lg">{walletDict.currency}</span>
        </div>
        
        {/* Available Balance Info - Only show if there are pending withdrawals */}
        {wallet.pendingWithdrawals > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <HiOutlineClock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  {isRTL ? "مبلغ محجوز" : "Reserved Amount"}
                </span>
              </div>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {hideBalance ? "***" : `-${formatAmount(wallet.pendingWithdrawals)}`} {walletDict.currency}
              </span>
            </div>
            <div className="h-px bg-amber-200 dark:bg-amber-700/50 my-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <IoWalletOutline className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-green-700 dark:text-green-400">
                  {isRTL ? "المتاح للاستخدام" : "Available to Use"}
                </span>
              </div>
              <span className="font-bold text-green-700 dark:text-green-400 text-lg">
                {hideBalance ? "***" : formatAmount(wallet.availableBalance)} {walletDict.currency}
              </span>
            </div>
          </div>
        )}
        
        {/* Account Number */}
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
          onClick={isAgent ? undefined : () => setModalType("withdraw")}
          disabled={isAgent}
          title={isAgent ? (isRTL ? "رصید شما فقط برای شارژ مشتریان قابل استفاده است" : "Your balance can only be used for client operations") : undefined}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            isAgent
              ? "bg-gray-500/10 text-gray-400 cursor-not-allowed opacity-60"
              : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
          }`}
        >
          <HiOutlineArrowUp className="h-5 w-5" />
          {walletDict.withdraw}
        </button>
        <button
          onClick={isAgent ? undefined : () => setModalType("transfer")}
          disabled={isAgent}
          title={isAgent ? (isRTL ? "رصید شما فقط برای شارژ مشتریان قابل استفاده است" : "Your balance can only be used for client operations") : undefined}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            isAgent
              ? "bg-gray-500/10 text-gray-400 cursor-not-allowed opacity-60"
              : "bg-accent/10 text-accent hover:bg-accent/20"
          }`}
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
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => openTransactionDetails(tx.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.10] transition-colors text-start"
                  title={walletDict.viewDetails}
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
                  <div className="text-xs text-(--muted-foreground) hidden sm:block">
                    {walletDict.viewDetails}
                  </div>
                  <div className={`font-semibold ${getTransactionColor(tx.type)}`}>
                    {getTransactionSign(tx.type)}{formatAmount(tx.amount)} {walletDict.currency}
                  </div>
                </button>
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.10] transition-colors"
                >
                  <div className="p-2 rounded-full bg-background">
                    {req.status === "pending" && <HiOutlineClock className="h-5 w-5 text-yellow-500" />}
                    {req.status === "approved" && <HiOutlineCheckCircle className="h-5 w-5 text-green-500" />}
                    {req.status === "rejected" && <HiOutlineXCircle className="h-5 w-5 text-red-500" />}
                    {req.status === "cancelled" && <HiOutlineXCircle className="h-5 w-5 text-gray-500" />}
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
                  <div className="flex items-center gap-2">
                    {/* Cancel button for pending requests */}
                    {req.status === "pending" && (
                      <button
                        onClick={() => cancelWithdrawalRequest(req.id)}
                        className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                      >
                        {walletDict.cancelRequest}
                      </button>
                    )}
                    {/* Status badge */}
                    <div className={`text-sm font-medium px-2 py-1 rounded-lg ${
                      req.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                      req.status === "approved" ? "bg-green-500/10 text-green-600" :
                      req.status === "cancelled" ? "bg-gray-500/10 text-gray-600" :
                      "bg-red-500/10 text-red-600"
                    }`}>
                      {req.status === "pending" && walletDict.pending}
                      {req.status === "approved" && walletDict.approved}
                      {req.status === "rejected" && walletDict.rejected}
                      {req.status === "cancelled" && walletDict.cancelled}
                    </div>
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
          availableBalance={wallet.availableBalance}
          onClose={() => setModalType(null)}
          onSuccess={() => refreshWallet()}
        />
      )}

      {/* Toast Notification - Portal to body */}
      {toast && typeof document !== 'undefined' && createPortal(
        <div 
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 ${
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
        </div>,
        document.body
      )}

      {(txDetailsLoading || txDetailsError || selectedTransaction) && typeof document !== "undefined" && createPortal(
        <TransactionDetailsModal
          locale={locale}
          walletDict={walletDict}
          loading={txDetailsLoading}
          error={txDetailsError}
          transaction={selectedTransaction}
          onClose={closeTransactionDetails}
        />,
        document.body
      )}
    </div>
  );
}

function TransactionDetailsModal({
  locale,
  walletDict,
  loading,
  error,
  transaction,
  onClose,
}: {
  locale: Locale;
  walletDict: Record<string, string>;
  loading: boolean;
  error: string | null;
  transaction: WalletTransactionDetail | null;
  onClose: () => void;
}) {
  const isRTL = locale === "ar";

  const formatDateTime = (value: Date | string) => {
    const date = typeof value === "string" ? new Date(value) : value;
    return new Intl.DateTimeFormat(isRTL ? "ar-OM" : "en-OM", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  const renderParty = (
    title: string,
    party: WalletTransactionDetail["sender"] | WalletTransactionDetail["receiver"] | WalletTransactionDetail["walletOwner"]
  ) => (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--surface-border)" }}>
      <p className="text-xs font-semibold text-(--muted-foreground)">{title}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p><span className="text-(--muted-foreground)">{walletDict.userName}: </span>{party?.displayName || walletDict.unknownParty}</p>
        <p><span className="text-(--muted-foreground)">{walletDict.phone}: </span>{party?.phone || "-"}</p>
        <p className="font-mono text-xs"><span className="text-(--muted-foreground) font-sans">{walletDict.accountNo}: </span>{party?.accountNumber || "-"}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border bg-background p-6 shadow-xl"
        style={{ borderColor: "var(--surface-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold">{walletDict.txDetailsTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--surface-border)" }}
          >
            {walletDict.close}
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-(--muted-foreground)">{isRTL ? "جارٍ تحميل التفاصيل..." : "Loading details..."}</div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</div>
        ) : transaction ? (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--surface-border)" }}>
              <p><span className="text-(--muted-foreground)">{walletDict.transactionId}: </span><span className="font-mono text-xs">{transaction.id}</span></p>
              <p><span className="text-(--muted-foreground)">{walletDict.transactionType}: </span>{transaction.type}</p>
              <p><span className="text-(--muted-foreground)">{walletDict.amount}: </span>{transaction.amount.toFixed(3)} {walletDict.currency}</p>
              <p><span className="text-(--muted-foreground)">{walletDict.balanceBefore}: </span>{transaction.balanceBefore.toFixed(3)} {walletDict.currency}</p>
              <p><span className="text-(--muted-foreground)">{walletDict.balanceAfter}: </span>{transaction.balanceAfter.toFixed(3)} {walletDict.currency}</p>
              <p><span className="text-(--muted-foreground)">{walletDict.createdAt}: </span>{formatDateTime(transaction.createdAt)}</p>
              <p><span className="text-(--muted-foreground)">{walletDict.description}: </span>{transaction.description || "-"}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {renderParty(walletDict.sender, transaction.sender)}
              {renderParty(walletDict.receiver, transaction.receiver)}
            </div>

            {renderParty(walletDict.walletOwner, transaction.walletOwner)}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-(--muted-foreground)">{walletDict.txNotAvailable}</div>
        )}
      </div>
    </div>
  );
}

// Modal Component
function WalletModal({
  type,
  locale,
  walletDict,
  availableBalance,
  onClose,
  onSuccess,
}: {
  type: "deposit" | "withdraw" | "transfer";
  locale: Locale;
  walletDict: Record<string, string>;
  availableBalance: number;
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

    if ((type === "withdraw" || type === "transfer") && amountNum > availableBalance) {
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
      let body: Record<string, unknown> = {};

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
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-2 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                  style={{ borderColor: "var(--surface-border)" }}
                  dir="ltr"
                  required
                />
                {/* Max button for withdraw and transfer */}
                {(type === "withdraw" || type === "transfer") && (
                  <button
                    type="button"
                    onClick={() => setAmount(availableBalance.toFixed(3))}
                    disabled={availableBalance <= 0}
                    className="px-4 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 font-medium text-sm"
                  >
                    {walletDict.max || "Max"}
                  </button>
                )}
              </div>
              {(type === "withdraw" || type === "transfer") && (
                <div className="mt-1 text-xs text-(--muted-foreground)">
                  {isRTL ? "الرصيد المتاح:" : "Available:"} {availableBalance.toFixed(3)} {walletDict.currency}
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
