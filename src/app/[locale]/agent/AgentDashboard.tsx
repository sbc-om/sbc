"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineSearch,
  HiOutlineCash,
  HiOutlineShoppingCart,
  HiOutlineX,
} from "react-icons/hi";
import {
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineReceiptPercent,
  HiOutlineWallet,
  HiOutlineCheckBadge,
} from "react-icons/hi2";

import type { Locale } from "@/lib/i18n/locales";
import type { Agent, AgentClientWithUser } from "@/lib/db/agents";
import type { Product } from "@/lib/db/products";

type ClientItem = AgentClientWithUser & { walletBalance: number };

type Props = {
  locale: Locale;
  agent: Agent;
  userName: string;
  clients: ClientItem[];
  stats: {
    totalClients: number;
    totalEarned: number;
    pendingAmount: number;
    totalTransactions: number;
  };
  walletBalance: number;
  products: Product[];
};

type ModalType = null | "transfer" | "purchase";

export default function AgentDashboard({
  locale,
  agent,
  userName,
  clients,
  stats,
  walletBalance,
  products,
}: Props) {
  const router = useRouter();
  const ar = locale === "ar";
  const [isPending, startTransition] = useTransition();

  /** Map API error codes → human-readable messages */
  function humanError(code: string): string {
    const map: Record<string, [string, string]> = {
      FORBIDDEN:                    ["Access denied",                          "غير مصرح لك بالوصول"],
      NOT_AGENT:                    ["You are not registered as an agent",     "لست مسجلاً كوكيل"],
      AGENT_INACTIVE:               ["Your agent account is inactive",         "حساب الوكيل غير مفعّل"],
      MISSING_FIELDS:               ["Please fill all required fields",        "يرجى ملء جميع الحقول المطلوبة"],
      USER_EXISTS:                   ["This user already exists",               "هذا المستخدم موجود بالفعل"],
      CLIENT_ID_REQUIRED:           ["Client ID is required",                  "معرّف العميل مطلوب"],
      USER_NOT_FOUND:               ["User not found",                         "المستخدم غير موجود"],
      QUERY_TOO_SHORT:              ["Search query is too short. Enter at least 3 characters.", "نص البحث قصير جدًا. أدخل 3 أحرف على الأقل."],
      INVALID_PARAMS:               ["Invalid parameters",                     "بيانات غير صحيحة"],
      NOT_YOUR_CLIENT:              ["This user is not your client",           "هذا المستخدم ليس من عملائك"],
      INSUFFICIENT_BALANCE:         ["Insufficient balance",                   "رصيدك غير كافٍ"],
      CLIENT_NO_PHONE:              ["Client has no phone number",             "العميل ليس لديه رقم هاتف"],
      MISSING_PARAMS:               ["Missing required parameters",            "بيانات ناقصة"],
      PRODUCT_NOT_FOUND:            ["Product not found",                      "المنتج غير موجود"],
      CLIENT_INSUFFICIENT_BALANCE:  ["Client has insufficient balance",        "رصيد العميل غير كافٍ"],
      UNKNOWN_ACTION:               ["Unknown action",                         "إجراء غير معروف"],
      ACTION_FAILED:                ["Action failed, please try again",        "فشل الإجراء، يرجى المحاولة مجدداً"],
    };
    const entry = map[code];
    if (entry) return ar ? entry[1] : entry[0];
    return code;
  }

  const [modal, setModal] = useState<ModalType>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Transfer form state
  const [transferAmount, setTransferAmount] = useState("");

  // Purchase form state
  const [selectedProductSlug, setSelectedProductSlug] = useState("");

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.clientEmail.toLowerCase().includes(q) ||
        c.clientPhone.includes(q)
    );
  }, [search, clients]);

  const selectedClient = clients.find((c) => c.clientUserId === selectedClientId);

  const t = {
    title: ar ? "لوحة الوكيل" : "Agent Dashboard",
    subtitle: ar ? "إدارة العملاء والمعاملات" : "Manage your clients & transactions",
    welcome: ar ? `مرحباً، ${userName}` : `Welcome, ${userName}`,
    myBalance: ar ? "رصيدي" : "My Balance",
    commission: ar ? "نسبة العمولة" : "Commission",
    totalClients: ar ? "العملاء" : "Clients",
    totalEarned: ar ? "الأرباح" : "Earnings",
    pending: ar ? "معلق" : "Pending",
    myClients: ar ? "عملائي" : "My Clients",
    noClients: ar ? "لا يوجد عملاء بعد" : "No clients yet",
    noClientsSub: ar ? "أضف أو أنشئ عميل جديد للبدء" : "Add or create a new client to get started",
    searchClients: ar ? "بحث في العملاء..." : "Search clients...",
    balance: ar ? "الرصيد" : "Balance",
    transfer: ar ? "تحويل" : "Transfer",
    purchase: ar ? "شراء اشتراك" : "Purchase",
    registerBusiness: ar ? "تسجيل عمل" : "Register Business",
    close: ar ? "إغلاق" : "Close",
    // Transfer
    transferTitle: ar ? "تحويل رصيد" : "Transfer Funds",
    transferTo: ar ? "تحويل إلى" : "Transfer to",
    amount: ar ? "المبلغ" : "Amount",
    transferBtn: ar ? "تحويل" : "Transfer",
    yourBalance: ar ? "رصيدك" : "Your balance",
    // Purchase
    purchaseTitle: ar ? "شراء اشتراك" : "Purchase Subscription",
    purchaseFor: ar ? "شراء لـ" : "Purchase for",
    selectPlan: ar ? "اختر خطة" : "Select a plan",
    clientBalance: ar ? "رصيد العميل" : "Client balance",
    purchaseBtn: ar ? "شراء" : "Purchase",
    // Status
    saving_: ar ? "جاري..." : "Processing...",
    invalidAmount: ar ? "الرجاء إدخال مبلغ صالح" : "Please enter a valid amount",
  };

  const transferValue = parseFloat(transferAmount);
  const isTransferAmountValid = !isNaN(transferValue) && transferValue > 0 && transferValue <= walletBalance;

  function resetModal() {
    setModal(null);
    setError("");
    setSuccess("");
    setTransferAmount("");
    setSelectedProductSlug("");
    setSaving(false);
  }

  async function handleTransfer() {
    if (!selectedClientId) return;
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setError(ar ? "الرجاء إدخال مبلغ صحيح" : "Please enter a valid amount");
      return;
    }
    if (amt > walletBalance) {
      setError(ar ? "رصيدك غير كافٍ" : "Insufficient balance");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transfer-to-client",
          clientId: selectedClientId,
          amount: amt,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccess(ar ? "تم التحويل بنجاح" : "Transfer successful");
      setTimeout(() => {
        resetModal();
        startTransition(() => router.refresh());
      }, 1000);
    } catch (err: any) {
      setError(humanError(err.message));
      setSaving(false);
    }
  }

  async function handlePurchase() {
    if (!selectedClientId || !selectedProductSlug) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "purchase-for-client",
          clientId: selectedClientId,
          productSlug: selectedProductSlug,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccess(ar ? "تم الشراء بنجاح" : "Purchase successful");
      setTimeout(() => {
        resetModal();
        startTransition(() => router.refresh());
      }, 1000);
    } catch (err: any) {
      setError(humanError(err.message));
      setSaving(false);
    }
  }

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">{t.welcome}</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: t.myBalance, value: `${walletBalance.toFixed(3)} OMR`, icon: <HiOutlineWallet className="h-5 w-5" />, color: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
          { label: t.commission, value: `${agent.commissionRate}%`, icon: <HiOutlineReceiptPercent className="h-5 w-5" />, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400" },
          { label: t.totalClients, value: stats.totalClients, icon: <HiOutlineUserGroup className="h-5 w-5" />, color: "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400" },
          { label: t.totalEarned, value: `${stats.totalEarned.toFixed(3)}`, icon: <HiOutlineBanknotes className="h-5 w-5" />, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" },
          { label: t.pending, value: `${stats.pendingAmount.toFixed(3)}`, icon: <HiOutlineClock className="h-5 w-5" />, color: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
        ].map((card, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-gray-200/70 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.02]"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.color}`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-(--muted-foreground)">{card.label}</p>
              <p className="truncate text-lg font-bold tabular-nums leading-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Clients Section ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.04]">
          <h2 className="text-sm font-semibold">{t.myClients} ({clients.length})</h2>

        </div>

        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <HiOutlineUserGroup className="h-10 w-10 text-(--muted-foreground)/30" />
            <p className="text-sm font-semibold">{t.noClients}</p>
            <p className="text-xs text-(--muted-foreground)">{t.noClientsSub}</p>
          </div>
        ) : (
          <>
            {/* Search */}
            {clients.length > 5 && (
              <div className="border-b border-gray-100 px-5 py-3 dark:border-white/[0.04]">
                <div className="relative">
                  <HiOutlineSearch className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--muted-foreground)/50" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.searchClients}
                    className="w-full rounded-xl border border-gray-200/80 bg-transparent py-2 ps-9 pe-3 text-xs transition-colors placeholder:text-(--muted-foreground)/50 focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
                  />
                </div>
              </div>
            )}

            {/* Client List */}
            <div className="divide-y divide-gray-100/80 dark:divide-white/[0.03]">
              {filteredClients.map((c) => (
                <div
                  key={c.clientUserId}
                  className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                >
                  {c.clientAvatar ? (
                    <Image
                      src={c.clientAvatar}
                      alt={c.clientName}
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-sm font-bold text-gray-500 ring-1 ring-gray-200/60 dark:from-white/10 dark:to-white/5 dark:text-gray-400 dark:ring-white/[0.08]">
                      {c.clientName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{c.clientName}</p>
                    <p className="truncate text-xs text-(--muted-foreground)">
                      {c.clientPhone || c.clientEmail}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="flex items-center gap-1 rounded-lg border border-gray-200/70 px-2.5 py-1 text-xs font-semibold tabular-nums dark:border-white/[0.06]">
                      <HiOutlineWallet className="h-3 w-3 text-(--muted-foreground)" />
                      {c.walletBalance.toFixed(3)}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClientId(c.clientUserId);
                        setError("");
                        setSuccess("");
                        setModal("transfer");
                      }}
                      title={t.transfer}
                      className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
                    >
                      <HiOutlineCash className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClientId(c.clientUserId);
                        setError("");
                        setSuccess("");
                        setModal("purchase");
                      }}
                      title={t.purchase}
                      className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                    >
                      <HiOutlineShoppingCart className="h-3.5 w-3.5" />
                    </button>

                    <Link
                      href={`/${locale}/agent/businesses/new?clientId=${encodeURIComponent(c.clientUserId)}&clientName=${encodeURIComponent(c.clientName)}`}
                      title={t.registerBusiness}
                      className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                    >
                      <HiOutlineCheckBadge className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200/70 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-gray-900">
            <button
              type="button"
              onClick={resetModal}
              className="absolute end-4 top-4 rounded-lg p-1 text-(--muted-foreground) hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            >
              <HiOutlineX className="h-4 w-4" />
            </button>

            {/* Transfer Funds */}
            {modal === "transfer" && selectedClient && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">{t.transferTitle}</h3>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    {selectedClient.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedClient.clientName}</p>
                    <p className="text-xs text-(--muted-foreground)">
                      {t.clientBalance}: {selectedClient.walletBalance.toFixed(3)} OMR
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-(--muted-foreground)">
                    {t.amount} (OMR)
                  </label>
                  <input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full rounded-xl border border-gray-200/80 bg-transparent px-4 py-2.5 text-sm tabular-nums focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
                  />
                  <p className="mt-1 text-xs text-(--muted-foreground)">
                    {t.yourBalance}: <span className="font-semibold">{walletBalance.toFixed(3)} OMR</span>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving || isPending || !isTransferAmountValid}
                  onClick={handleTransfer}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <HiOutlineCash className="h-4 w-4" />
                    {saving || isPending ? t.saving_ : t.transferBtn}
                  </span>
                </button>
                {transferAmount && !isTransferAmountValid && (
                  <p className="text-xs font-medium text-red-500">{t.invalidAmount}</p>
                )}
              </div>
            )}

            {/* Purchase Subscription */}
            {modal === "purchase" && selectedClient && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">{t.purchaseTitle}</h3>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-white/[0.03]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    {selectedClient.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedClient.clientName}</p>
                    <p className="text-xs text-(--muted-foreground)">
                      {t.clientBalance}: {selectedClient.walletBalance.toFixed(3)} OMR
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-(--muted-foreground)">
                    {t.selectPlan}
                  </label>
                  <div className="max-h-60 space-y-2 overflow-y-auto">
                    {products.map((p) => {
                      const selected = selectedProductSlug === p.slug;
                      const affordable = selectedClient.walletBalance >= p.price;
                      return (
                        <button
                          key={p.slug}
                          type="button"
                          disabled={!affordable}
                          onClick={() => setSelectedProductSlug(p.slug)}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-all ${
                            selected
                              ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200 dark:border-emerald-600 dark:bg-emerald-950/20 dark:ring-emerald-800"
                              : affordable
                                ? "border-gray-200/80 hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.03]"
                                : "border-gray-200/60 opacity-55 cursor-not-allowed dark:border-white/[0.06]"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">
                              {ar ? p.name.ar : p.name.en}
                            </p>
                            <p className="text-xs text-(--muted-foreground)">
                              {p.program} · {p.durationDays} {ar ? "يوم" : "days"}
                            </p>
                            {!affordable && (
                              <p className="mt-1 text-[11px] font-medium text-red-500">
                                {ar ? "رصيد العميل غير كافٍ" : "Insufficient client balance"}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-sm font-bold tabular-nums">
                            {p.price.toFixed(3)} OMR
                          </span>
                          {selected && (
                            <HiOutlineCheckBadge className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving || isPending || !selectedProductSlug}
                  onClick={handlePurchase}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <HiOutlineShoppingCart className="h-4 w-4" />
                    {saving || isPending ? t.saving_ : t.purchaseBtn}
                  </span>
                </button>
              </div>
            )}

            {/* Error/Success */}
            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}
            {success && (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                {success}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
