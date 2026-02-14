"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";

type ProductOption = {
  slug: string;
  name: string;
  price: number;
  currency: string;
};

export default function ClientQuickActions({
  locale,
  clientId,
  clientWalletBalance,
  products,
  isPhoneVerified,
}: {
  locale: Locale;
  clientId: string;
  clientWalletBalance: number;
  products: ProductOption[];
  isPhoneVerified: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ar = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [transferAmount, setTransferAmount] = useState("");
  const [selectedProductSlug, setSelectedProductSlug] = useState(products[0]?.slug || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState<"sent" | "failed" | "disabled" | null>(null);

  const t = {
    title: ar ? "إجراءات سريعة" : "Quick Actions",
    transferTitle: ar ? "شحن محفظة العميل" : "Top up client wallet",
    purchaseTitle: ar ? "شراء اشتراك للعميل" : "Purchase subscription",
    amount: ar ? "المبلغ" : "Amount",
    transfer: ar ? "تحويل" : "Transfer",
    product: ar ? "المنتج" : "Product",
    purchase: ar ? "شراء" : "Purchase",
    processing: ar ? "جاري التنفيذ..." : "Processing...",
    clientBalance: ar ? "رصيد العميل" : "Client balance",
    noProducts: ar ? "لا توجد منتجات فعالة" : "No active products",
    transferOk: ar ? "تم التحويل بنجاح" : "Transfer completed",
    purchaseOk: ar ? "تم شراء الاشتراك بنجاح" : "Subscription purchased",
    waSent: ar ? "واتساب: تم الإرسال" : "WhatsApp: Sent",
    waFailed: ar ? "واتساب: فشل الإرسال" : "WhatsApp: Failed",
    waDisabled: ar ? "واتساب: غير مفعّل" : "WhatsApp: Disabled",
    invalidAmount: ar ? "أدخل مبلغًا صحيحًا" : "Enter a valid amount",
    phoneNotVerified: ar ? "رقم العميل غير مفعّل. لا يمكن تنفيذ أي عملية قبل التفعيل." : "Client phone is not verified. Actions are locked until activation.",
  };

  useEffect(() => {
    const updated = searchParams?.get("updated");
    if (!updated) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("updated");
      const target = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(target);
    }, 2200);

    return () => clearTimeout(timer);
  }, [pathname, router, searchParams]);

  function mapError(code: string) {
    const dict: Record<string, string> = {
      FORBIDDEN: ar ? "غير مصرح" : "Forbidden",
      NOT_YOUR_CLIENT: ar ? "هذا العميل ليس ضمن عملائك" : "This user is not your client",
      INSUFFICIENT_BALANCE: ar ? "رصيدك غير كافٍ" : "Insufficient agent balance",
      CLIENT_NO_PHONE: ar ? "لا يوجد رقم هاتف للعميل" : "Client has no phone",
      CLIENT_PHONE_NOT_VERIFIED: ar ? "رقم العميل غير مفعّل" : "Client phone is not verified",
      PRODUCT_NOT_FOUND: ar ? "المنتج غير موجود" : "Product not found",
      CLIENT_INSUFFICIENT_BALANCE: ar ? "رصيد العميل غير كافٍ" : "Client wallet is insufficient",
      ACTION_FAILED: ar ? "فشلت العملية" : "Action failed",
    };
    return dict[code] || code;
  }

  function refreshWithHighlight(kind: "wallet" | "products") {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("updated", kind);
    const target = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      router.replace(target);
      router.refresh();
    });
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setWhatsappStatus(null);

    const amount = Number(transferAmount);
    if (!isPhoneVerified) {
      setError(t.phoneNotVerified);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t.invalidAmount);
      return;
    }

    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "transfer-to-client",
        clientId,
        amount,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      setError(mapError(String(data.error || "ACTION_FAILED")));
      return;
    }

    setTransferAmount("");
    setSuccess(t.transferOk);
    setWhatsappStatus((data.whatsappStatus as "sent" | "failed" | "disabled" | undefined) || "disabled");
    refreshWithHighlight("wallet");
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setWhatsappStatus(null);

    if (!selectedProductSlug) {
      setError(t.noProducts);
      return;
    }
    if (!isPhoneVerified) {
      setError(t.phoneNotVerified);
      return;
    }

    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "purchase-for-client",
        clientId,
        productSlug: selectedProductSlug,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      setError(mapError(String(data.error || "ACTION_FAILED")));
      return;
    }

    setSuccess(t.purchaseOk);
    refreshWithHighlight("products");
  }

  return (
    <div className="sbc-card rounded-2xl p-5">
      <h2 className="text-sm font-semibold">{t.title}</h2>
      <div className="mt-2 text-xs text-(--muted-foreground)">
        {t.clientBalance}: {clientWalletBalance.toFixed(3)} OMR
      </div>
      {!isPhoneVerified ? (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          {t.phoneNotVerified}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <div>{success}</div>
          {whatsappStatus ? (
            <div className="mt-1">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  whatsappStatus === "sent"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : whatsappStatus === "failed"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {whatsappStatus === "sent"
                  ? t.waSent
                  : whatsappStatus === "failed"
                    ? t.waFailed
                    : t.waDisabled}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <form onSubmit={handleTransfer} className="rounded-xl border border-(--surface-border) p-3">
          <div className="text-xs font-semibold text-(--muted-foreground)">{t.transferTitle}</div>
          <label className="mt-2 block text-xs text-(--muted-foreground)">{t.amount}</label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-3 text-sm"
            placeholder="0.000"
          />
          <Button type="submit" size="sm" className="mt-3" disabled={isPending || !isPhoneVerified}>
            {isPending ? t.processing : t.transfer}
          </Button>
        </form>

        <form onSubmit={handlePurchase} className="rounded-xl border border-(--surface-border) p-3">
          <div className="text-xs font-semibold text-(--muted-foreground)">{t.purchaseTitle}</div>
          <label className="mt-2 block text-xs text-(--muted-foreground)">{t.product}</label>
          <select
            value={selectedProductSlug}
            onChange={(e) => setSelectedProductSlug(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-3 text-sm"
            disabled={products.length === 0}
          >
            {products.length === 0 ? (
              <option value="">{t.noProducts}</option>
            ) : (
              products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} — {p.price.toFixed(3)} {p.currency}
                </option>
              ))
            )}
          </select>
          <Button type="submit" size="sm" className="mt-3" disabled={isPending || products.length === 0 || !isPhoneVerified}>
            {isPending ? t.processing : t.purchase}
          </Button>
        </form>
      </div>
    </div>
  );
}
