"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { 
  HiCheckCircle, 
  HiXCircle, 
  HiTrash, 
  HiExclamationCircle,
  HiRefresh
} from "react-icons/hi";
import { RiWallet3Fill } from "react-icons/ri";

import type { Locale } from "@/lib/i18n/locales";
import type { StoreProduct } from "@/lib/store/types";
import { cn } from "@/lib/cn";
import { formatStorePrice, getStoreProductText } from "@/lib/store/utils";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useCart } from "@/components/store/CartProvider";

function cartTotalOMR(locale: Locale, slugs: string[], products: StoreProduct[]) {
  let total = 0;
  for (const slug of slugs) {
    const p = products.find((x) => x.slug === slug);
    if (!p) continue;
    total += p.price.amount;
  }
  return formatStorePrice({ amount: total, currency: "OMR" }, locale);
}

function cartTotalAmount(slugs: string[], products: StoreProduct[]) {
  let total = 0;
  for (const slug of slugs) {
    const p = products.find((x) => x.slug === slug);
    if (!p) continue;
    total += p.price.amount;
  }
  return total;
}

interface WalletInfo {
  balance: number;
  availableBalance: number;
  pendingWithdrawals: number;
}

export function CheckoutClient({
  locale,
  products,
}: {
  locale: Locale;
  products: StoreProduct[];
}) {
  const router = useRouter();
  const { state, clear, remove } = useCart();
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false); // Prevent double submission
  const [error, setError] = useState<string | null>(null);
  const [success] = useState<{
    orderId: string;
    orderNumber: string;
    newBalance: number;
  } | null>(null);

  const ar = locale === "ar";

  const slugs = state.items.map((it) => it.slug);
  const totalFormatted = cartTotalOMR(locale, slugs, products);
  const totalAmount = cartTotalAmount(slugs, products);

  const copy = {
    cartEmpty: ar ? "سلتك فارغة." : "Your cart is empty.",
    backToStore: ar ? "العودة للمتجر" : "Back to store",
    payWithWallet: ar ? "الدفع من المحفظة" : "Pay with Wallet",
    processing: ar ? "جارٍ المعالجة..." : "Processing...",
    success: ar ? "تم الدفع بنجاح!" : "Payment successful!",
    orderNumber: ar ? "رقم الطلب" : "Order number",
    newBalance: ar ? "الرصيد الجديد" : "New balance",
    totalLabel: ar ? "الإجمالي" : "Total",
    walletBalance: ar ? "رصيد المحفظة" : "Wallet Balance",
    availableBalance: ar ? "الرصيد المتاح" : "Available Balance",
    insufficientBalance: ar ? "رصيد غير كافٍ" : "Insufficient balance",
    clear: ar ? "مسح السلة" : "Clear cart",
    goDashboard: ar ? "لوحة التحكم" : "Go to dashboard",
    goStore: ar ? "متابعة التسوق" : "Continue shopping",
    chargeWallet: ar ? "شحن المحفظة" : "Top up wallet",
    loadingWallet: ar ? "جارٍ التحميل..." : "Loading wallet...",
    errorOccurred: ar ? "حدث خطأ" : "An error occurred",
    tryAgain: ar ? "حاول مرة أخرى" : "Try again",
    activatedNote: ar 
      ? "تم تفعيل حزمك الآن. يمكنك استخدامها من لوحة التحكم." 
      : "Your packages are now active. You can use them from the dashboard.",
    securePayment: ar ? "دفع آمن عبر المحفظة" : "Secure wallet payment",
    items: ar ? "المشتريات" : "Items",
    view: ar ? "عرض" : "View",
    remove: ar ? "حذف" : "Remove",
    failedLoadWallet: ar ? "تعذر تحميل المحفظة" : "Failed to load wallet",
    pending: ar ? "قيد السحب:" : "Pending:",
  };

  // Fetch wallet info
  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch("/api/wallet/balance");
        if (res.ok) {
          const data = await res.json();
          setWalletInfo({
            balance: data.balance || 0,
            availableBalance: data.availableBalance || data.balance || 0,
            pendingWithdrawals: data.pendingWithdrawals || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch wallet:", error);
      } finally {
        setLoadingWallet(false);
      }
    }
    fetchWallet();
  }, []);

  const hasEnoughBalance = walletInfo && walletInfo.availableBalance >= totalAmount;

  const handlePayment = async () => {
    // Prevent double submission
    if (slugs.length === 0 || !hasEnoughBalance || processingRef.current) return;
    
    processingRef.current = true;
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/store/checkout/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slugs, locale }),
      });

      const data = await res.json();

      if (data.ok) {
        clear();
        // Redirect to dashboard after successful payment
        router.push(`/${locale}/dashboard?order=${data.orderNumber}`);
      } else {
        setError(data.error || "Payment failed");
        processingRef.current = false;
      }
    } catch {
      setError(ar ? "خطأ في الشبكة" : "Network error");
      processingRef.current = false;
    } finally {
      setProcessing(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="mt-6">
        <div className="sbc-card rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <HiCheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {copy.success}
          </h2>
          
          <div className="mt-4 space-y-2 text-sm text-(--muted-foreground)">
            <p>{copy.orderNumber}: <span className="font-mono font-semibold text-(--foreground)">{success.orderNumber}</span></p>
            <p>{copy.newBalance}: <span className="font-semibold text-(--foreground)">{formatStorePrice({ amount: success.newBalance, currency: "OMR" }, locale)}</span></p>
          </div>

          <p className="mt-4 text-sm text-(--muted-foreground)">
            {copy.activatedNote}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/dashboard`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {copy.goDashboard}
            </Link>
            <Link
              href={`/${locale}/store`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {copy.goStore}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      {/* Cart Items */}
      <div className="lg:col-span-2 sbc-card rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{copy.items}</h2>
          <Link
            href={`/${locale}/store`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {copy.backToStore}
          </Link>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <HiXCircle className="h-6 w-6 shrink-0 text-red-500" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-700 dark:text-red-400">
                {copy.errorOccurred}
              </div>
              <div className="mt-1 text-sm text-red-600 dark:text-red-300">
                {error}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="shrink-0"
            >
              <HiRefresh className="h-4 w-4" />
              {copy.tryAgain}
            </Button>
          </div>
        )}

        {slugs.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-(--surface-border) bg-(--surface) p-4 text-sm text-(--muted-foreground)">
            {copy.cartEmpty}
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {slugs.map((slug) => {
              const p = products.find((x) => x.slug === slug);
              if (!p) return null;
              const text = getStoreProductText(p, locale);
              return (
                <div
                  key={slug}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{text.name}</div>
                    <div className="text-xs text-(--muted-foreground)">
                      {formatStorePrice(p.price, locale)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${locale}/store/${p.slug}`}
                      className={buttonVariants({ variant: "secondary", size: "xs" })}
                    >
                      {copy.view}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={copy.remove}
                      title={copy.remove}
                      className="text-(--muted-foreground) hover:text-foreground"
                      onClick={() => remove(slug)}
                    >
                      <HiTrash className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {slugs.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => clear()}>
              {copy.clear}
            </Button>
            <div className="text-sm font-semibold">
              {copy.totalLabel}: {totalFormatted}
            </div>
          </div>
        )}
      </div>

      {/* Payment Sidebar */}
      <aside className="sbc-card rounded-2xl p-6">
        <div className="text-sm text-(--muted-foreground)">{copy.totalLabel}</div>
        <div className="mt-1 text-2xl font-semibold">{totalFormatted}</div>

        {/* Wallet Balance */}
        <div className="mt-4 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <RiWallet3Fill className="h-5 w-5 text-blue-500" />
            {copy.walletBalance}
          </div>
          
          {loadingWallet ? (
            <div className="mt-2 text-sm text-(--muted-foreground)">
              {copy.loadingWallet}
            </div>
          ) : walletInfo ? (
            <div className="mt-2">
              <div className="text-xl font-bold">
                {formatStorePrice({ amount: walletInfo.availableBalance, currency: "OMR" }, locale)}
              </div>
              {walletInfo.pendingWithdrawals > 0 && (
                <div className="mt-1 text-xs text-(--muted-foreground)">
                  {copy.pending} {formatStorePrice({ amount: walletInfo.pendingWithdrawals, currency: "OMR" }, locale)}
                </div>
              )}
              
              {!hasEnoughBalance && slugs.length > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  <HiExclamationCircle className="h-5 w-5 shrink-0" />
                  <span>{copy.insufficientBalance}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2 text-sm text-red-500">
              {copy.failedLoadWallet}
            </div>
          )}

          {walletInfo && !hasEnoughBalance && slugs.length > 0 && (
            <Link
              href={`/${locale}/wallet`}
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-3 w-full")}
            >
              {copy.chargeWallet}
            </Link>
          )}
        </div>

        {/* Pay Button */}
        <div className="mt-4 grid gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={slugs.length === 0 || !hasEnoughBalance || processing || loadingWallet}
            onClick={handlePayment}
          >
            {processing ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {copy.processing}
              </>
            ) : (
              <>
                <RiWallet3Fill className="h-5 w-5" />
                {copy.payWithWallet}
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-(--muted-foreground)">
            <HiCheckCircle className="h-4 w-4 text-emerald-500" />
            {copy.securePayment}
          </div>
        </div>
      </aside>
    </div>
  );
}
