"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineArrowLeft, HiOutlineCash, HiOutlineCheckCircle, HiOutlineInformationCircle } from "react-icons/hi";
import { HiOutlineBanknotes, HiOutlineWallet } from "react-icons/hi2";

import type { Locale } from "@/lib/i18n/locales";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type Props = {
  locale: Locale;
  availableWallet: number;
  pendingWithdrawRequests: number;
};

export default function RequestWithdrawalClient({ locale, availableWallet, pendingWithdrawRequests }: Props) {
  const ar = locale === "ar";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const t = {
    title: ar ? "طلب سحب جديد" : "New Withdrawal Request",
    subtitle: ar ? "قدّم طلب السحب من خلال نموذج احترافي ومُراجع" : "Submit your withdrawal through a professional reviewed form",
    back: ar ? "العودة لمحفظة الوكيل" : "Back to Agent Wallet",
    amount: ar ? "المبلغ" : "Amount",
    bankName: ar ? "اسم البنك" : "Bank Name",
    accountName: ar ? "اسم صاحب الحساب" : "Account Holder Name",
    accountNumber: ar ? "رقم الحساب" : "Account Number",
    iban: ar ? "رقم الآيبان" : "IBAN",
    note: ar ? "ملاحظات" : "Note",
    submit: ar ? "إرسال الطلب" : "Submit Request",
    available: ar ? "المتاح للسحب" : "Available to Withdraw",
    pending: ar ? "قيد المعالجة" : "Pending Requests",
    helper: ar ? "يجب أن لا يتجاوز المبلغ رصيدك المتاح" : "Amount must not exceed your available balance",
    success: ar ? "تم إرسال طلب السحب بنجاح" : "Withdrawal request submitted successfully",
    minAmount: ar ? "الحد الأدنى 0.001" : "Minimum 0.001",
    maxBtn: ar ? "الحد الأقصى" : "Max",
  };

  async function submitRequest() {
    const val = parseFloat(amount);
    if (!val || Number.isNaN(val) || val < 0.001) {
      setError(ar ? "أدخل مبلغًا صالحًا (0.001 كحد أدنى)" : "Enter a valid amount (minimum 0.001)");
      return;
    }
    if (val > availableWallet) {
      setError(ar ? "المبلغ أكبر من الرصيد المتاح" : "Amount exceeds available balance");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/agent/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: val,
          agentNote: note,
          payoutMethod: "bank_transfer",
          payoutBankName: bankName,
          payoutAccountName: accountName,
          payoutAccountNumber: accountNumber,
          payoutIban: iban,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "ACTION_FAILED");

      setSuccess(true);
      startTransition(() => {
        router.push(`/${locale}/agent/wallet`);
        router.refresh();
      });
    } catch (e: any) {
      setError(e.message || (ar ? "حدث خطأ أثناء إرسال الطلب" : "Failed to submit request"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
        </div>
        <Link
          href={`/${locale}/agent/wallet`}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:hover:bg-white/[0.06]"
        >
          <HiOutlineArrowLeft className={`h-4 w-4 ${ar ? "rotate-180" : ""}`} />
          {t.back}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/20">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <HiOutlineWallet className="h-4 w-4" />
          </div>
          <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-400/90">{t.available}</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{availableWallet.toFixed(3)} OMR</p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/20">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
            <HiOutlineBanknotes className="h-4 w-4" />
          </div>
          <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-400/90">{t.pending}</p>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{pendingWithdrawRequests.toFixed(3)} OMR</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200/70 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-(--muted-foreground) dark:bg-white/[0.04]">
          <HiOutlineInformationCircle className="h-4 w-4" />
          {t.helper}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="mb-1 flex items-center justify-between">
              <label className="mb-1.5 block text-sm font-medium">{t.amount}</label>
              <button
                type="button"
                onClick={() => setAmount(availableWallet.toFixed(3))}
                className="text-xs font-semibold text-accent hover:underline"
              >
                {t.maxBtn}
              </button>
            </div>
            <Input type="number" min={0.001} step={0.001} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <p className="mt-1 text-[11px] text-(--muted-foreground)">{t.minAmount}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.bankName}</label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.accountName}</label>
            <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.accountNumber}</label>
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t.iban}</label>
            <Input value={iban} onChange={(e) => setIban(e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium">{t.note}</label>
            <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24" />
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
        {success && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <HiOutlineCheckCircle className="h-4 w-4" />
            {t.success}
          </p>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={submitRequest}
            disabled={saving || isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <HiOutlineCash className="h-4 w-4" />
            {t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
