"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiOutlineArrowLeft,
  HiOutlineSave,
  HiOutlinePlus,
  HiOutlineBan,
  HiOutlinePlay,
  HiOutlineMail,
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineCurrencyDollar,
  HiOutlineClipboardCheck,
  HiOutlinePhone,
} from "react-icons/hi";
import { HiPaperAirplane } from "react-icons/hi2";

type Subscription = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string | null;
  userPhone?: string;
  productId: string;
  productSlug: string;
  program: string;
  plan: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  paymentId?: string;
  paymentMethod?: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

const programOptions = [
  { value: "directory", label: { en: "Directory", ar: "الدليل" } },
  { value: "loyalty", label: { en: "Loyalty", ar: "الولاء" } },
  { value: "marketing", label: { en: "Marketing", ar: "التسويق" } },
  { value: "website", label: { en: "Website", ar: "الموقع" } },
  { value: "email", label: { en: "Email", ar: "البريد" } },
];

export default function SubscriptionEditForm({
  subscription: initial,
  locale,
}: {
  subscription: Subscription;
  locale: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const ar = locale === "ar";

  const [program, setProgram] = useState(initial.program);
  const [plan, setPlan] = useState(initial.plan || "");
  const [isActive, setIsActive] = useState(initial.isActive);
  const [endDate, setEndDate] = useState(initial.endDate.slice(0, 10));
  const [amount, setAmount] = useState(String(initial.amount));
  const [currency, setCurrency] = useState(initial.currency);
  const [extendDays, setExtendDays] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const expired = new Date(initial.endDate) < new Date();
  const active = initial.isActive && !expired;
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(initial.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const t = {
    title: ar ? "تعديل الاشتراك" : "Edit Subscription",
    back: ar ? "الاشتراكات" : "Subscriptions",
    userInfo: ar ? "معلومات المستخدم" : "User Information",
    userInfoDesc: ar ? "بيانات صاحب الاشتراك" : "Subscriber account details",
    name: ar ? "الاسم" : "Name",
    email: ar ? "البريد الإلكتروني" : "Email",
    userId: ar ? "معرف المستخدم" : "User ID",
    subDetails: ar ? "تفاصيل الاشتراك" : "Subscription Details",
    subDetailsDesc: ar ? "تعديل معلومات الباقة والاشتراك" : "Modify package & subscription info",
    program: ar ? "البرنامج" : "Program",
    plan: ar ? "الباقة" : "Plan / Slug",
    amount: ar ? "المبلغ" : "Amount",
    currency: ar ? "العملة" : "Currency",
    endDate: ar ? "تاريخ الانتهاء" : "End Date",
    status: ar ? "الحالة" : "Status",
    active: ar ? "نشط" : "Active",
    inactive: ar ? "غير نشط" : "Inactive",
    expired: ar ? "منتهي" : "Expired",
    cancelled: ar ? "ملغي" : "Cancelled",
    save: ar ? "حفظ التغييرات" : "Save Changes",
    saving: ar ? "جاري الحفظ..." : "Saving...",
    quickActions: ar ? "إجراءات سريعة" : "Quick Actions",
    quickActionsDesc: ar ? "إجراءات شائعة للاشتراك" : "Common subscription operations",
    extendSub: ar ? "تمديد الاشتراك" : "Extend Subscription",
    extendDays: ar ? "عدد الأيام" : "Number of days",
    extend: ar ? "تمديد" : "Extend",
    cancelSub: ar ? "إلغاء الاشتراك" : "Cancel Subscription",
    cancelDesc: ar ? "سيتم إلغاء الاشتراك فوراً" : "The subscription will be cancelled immediately",
    activate: ar ? "تفعيل الاشتراك" : "Activate Subscription",
    activateDesc: ar ? "سيتم إعادة تفعيل الاشتراك" : "The subscription will be reactivated",
    remaining: ar ? "يوم متبقي" : "days remaining",
    paymentInfo: ar ? "بيانات الدفع" : "Payment Details",
    paymentInfoDesc: ar ? "معلومات العملية المالية" : "Transaction information",
    paymentId: ar ? "معرف الدفع" : "Payment ID",
    paymentMethod: ar ? "طريقة الدفع" : "Method",
    startDate: ar ? "تاريخ البدء" : "Start Date",
    createdAt: ar ? "تاريخ الإنشاء" : "Created At",
    updatedAt: ar ? "آخر تحديث" : "Last Updated",
    productSlug: ar ? "رمز المنتج" : "Product Slug",
    saved: ar ? "تم الحفظ بنجاح" : "Saved successfully",
    extended: ar ? "تم التمديد بنجاح" : "Extended successfully",
    cancelled2: ar ? "تم الإلغاء بنجاح" : "Cancelled successfully",
    activated: ar ? "تم التفعيل بنجاح" : "Activated successfully",
    error: ar ? "حدث خطأ، حاول مجددا" : "An error occurred, please try again",
    phone: ar ? "رقم الهاتف" : "Phone",
    noPhone: ar ? "لا يوجد رقم هاتف" : "No phone number",
    sendInvoice: ar ? "إرسال فاتورة عبر واتساب" : "Send Invoice via WhatsApp",
    sendingInvoice: ar ? "جاري الإرسال..." : "Sending...",
    invoiceSent: ar ? "تم إرسال الفاتورة بنجاح" : "Invoice sent successfully",
    noPhoneWarn: ar ? "لا يوجد رقم هاتف لهذا المستخدم" : "No phone number for this user",
  };

  async function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/subscriptions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: initial.id,
            program,
            plan,
            isActive,
            endDate: new Date(endDate).toISOString(),
            amount: parseFloat(amount),
            currency,
          }),
        });
        if (!res.ok) throw new Error();
        setMessage({ type: "success", text: t.saved });
        router.refresh();
      } catch {
        setMessage({ type: "error", text: t.error });
      }
    });
  }

  async function handleExtend() {
    const days = parseInt(extendDays, 10);
    if (!days || days <= 0) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/subscriptions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, action: "extend", days, locale }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.subscription?.endDate) {
          setEndDate(data.subscription.endDate.slice(0, 10));
        }
        setMessage({ type: "success", text: t.extended });
        setExtendDays("");
        router.refresh();
      } catch {
        setMessage({ type: "error", text: t.error });
      }
    });
  }

  async function handleCancel() {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/subscriptions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, action: "cancel", locale }),
        });
        if (!res.ok) throw new Error();
        setIsActive(false);
        setMessage({ type: "success", text: t.cancelled2 });
        router.refresh();
      } catch {
        setMessage({ type: "error", text: t.error });
      }
    });
  }

  async function handleActivate() {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/subscriptions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, action: "activate", locale }),
        });
        if (!res.ok) throw new Error();
        setIsActive(true);
        setMessage({ type: "success", text: t.activated });
        router.refresh();
      } catch {
        setMessage({ type: "error", text: t.error });
      }
    });
  }

  async function handleSendInvoice() {
    if (!initial.userPhone) {
      setMessage({ type: "error", text: t.noPhoneWarn });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/subscriptions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, action: "send-invoice", locale }),
        });
        if (!res.ok) throw new Error();
        setMessage({ type: "success", text: t.invoiceSent });
      } catch {
        setMessage({ type: "error", text: t.error });
      }
    });
  }

  function fmtDT(d: string) {
    return new Intl.DateTimeFormat(ar ? "ar-OM" : "en-OM", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));
  }

  /* ─── Label + Input wrapper ─── */
  function Field({
    label,
    icon,
    children,
  }: {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) {
    return (
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
          {icon}
          {label}
        </label>
        {children}
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-gray-200/80 bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-(--muted-foreground)/50 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-white/[0.08] dark:bg-white/[0.02] dark:focus:border-white/[0.15] dark:focus:ring-white/[0.06]";

  return (
    <div className="space-y-7">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            onClick={() => router.push(`/${locale}/admin/subscriptions`)}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-(--muted-foreground) hover:text-(--foreground) transition-colors"
          >
            <HiOutlineArrowLeft className="h-3.5 w-3.5" />
            {t.back}
          </button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-1 font-mono text-xs text-(--muted-foreground)/70">{initial.id}</p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-3">
          {active ? (
            <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/70 bg-emerald-50 px-4 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {t.active}
                </span>
                <span className="ms-1.5 text-[11px] font-medium text-emerald-600/70 tabular-nums dark:text-emerald-400/60">
                  {daysLeft} {t.remaining}
                </span>
              </div>
            </div>
          ) : !initial.isActive ? (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200/70 bg-red-50 px-4 py-2.5 dark:border-red-800 dark:bg-red-950/40">
              <HiXCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">{t.cancelled}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200/70 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/40">
              <HiClock className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{t.expired}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Message Toast ═══ */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium transition-all ${
            message.type === "success"
              ? "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "border-red-200/70 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <HiCheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <HiXCircle className="h-5 w-5 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* ═══ Two-column layout ═══ */}
      <div className="grid gap-7 lg:grid-cols-3">
        {/* ── Left column ── */}
        <div className="space-y-7 lg:col-span-2">
          {/* User Card */}
          <section className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-white/[0.04]">
              <h2 className="text-sm font-bold">{t.userInfo}</h2>
              <p className="mt-0.5 text-xs text-(--muted-foreground)">{t.userInfoDesc}</p>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                {initial.userAvatar ? (
                  <Image
                    src={initial.userAvatar}
                    alt={initial.userName}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gray-200/60 dark:ring-white/[0.08]"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50 text-sm font-bold text-gray-500 ring-1 ring-gray-200/60 dark:from-white/10 dark:to-white/5 dark:text-gray-400 dark:ring-white/[0.08]">
                    {initial.userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs text-(--muted-foreground)">{t.name}</p>
                  <p className="text-sm font-semibold">{initial.userName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-800">
                  <HiOutlineMail className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-(--muted-foreground)">{t.email}</p>
                  <p className="truncate text-sm font-semibold">{initial.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${
                  initial.userPhone
                    ? "bg-green-50 text-green-600 ring-green-200/60 dark:bg-green-950/40 dark:text-green-400 dark:ring-green-800"
                    : "bg-gray-50 text-gray-400 ring-gray-200/60 dark:bg-white/[0.04] dark:text-gray-500 dark:ring-white/[0.06]"
                }`}>
                  <HiOutlinePhone className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-(--muted-foreground)">{t.phone}</p>
                  {initial.userPhone ? (
                    <p className="text-sm font-semibold tabular-nums" dir="ltr">{initial.userPhone}</p>
                  ) : (
                    <p className="text-xs text-(--muted-foreground)/50">{t.noPhone}</p>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-(--muted-foreground)">{t.userId}</p>
                <p className="mt-0.5 rounded-lg bg-gray-50 px-3 py-1.5 font-mono text-[11px] text-(--muted-foreground) dark:bg-white/[0.03]">
                  {initial.userId}
                </p>
              </div>
            </div>
          </section>

          {/* Edit Form Card */}
          <section className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-white/[0.04]">
              <h2 className="text-sm font-bold">{t.subDetails}</h2>
              <p className="mt-0.5 text-xs text-(--muted-foreground)">{t.subDetailsDesc}</p>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              {/* Program */}
              <Field label={t.program} icon={<HiOutlineTag className="h-3 w-3" />}>
                <select value={program} onChange={(e) => setProgram(e.target.value)} className={inputCls}>
                  {programOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {ar ? opt.label.ar : opt.label.en}
                    </option>
                  ))}
                </select>
              </Field>
              {/* Plan */}
              <Field label={t.plan} icon={<HiOutlineClipboardCheck className="h-3 w-3" />}>
                <input type="text" value={plan} onChange={(e) => setPlan(e.target.value)} className={inputCls} />
              </Field>
              {/* Amount */}
              <Field label={t.amount} icon={<HiOutlineCurrencyDollar className="h-3 w-3" />}>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputCls}
                />
              </Field>
              {/* Currency */}
              <Field label={t.currency} icon={<HiOutlineCurrencyDollar className="h-3 w-3" />}>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputCls}
                />
              </Field>
              {/* End Date */}
              <Field label={t.endDate} icon={<HiOutlineCalendar className="h-3 w-3" />}>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
              {/* Status */}
              <Field label={t.status} icon={<HiCheckCircle className="h-3 w-3" />}>
                <select
                  value={isActive ? "active" : "inactive"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                  className={inputCls}
                >
                  <option value="active">{t.active}</option>
                  <option value="inactive">{t.inactive}</option>
                </select>
              </Field>
              {/* Product Slug (readonly) */}
              <div className="sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                  {t.productSlug}
                </p>
                <p className="mt-1.5 rounded-lg bg-gray-50 px-3.5 py-2.5 font-mono text-xs text-(--muted-foreground) dark:bg-white/[0.03]">
                  {initial.productSlug}
                </p>
              </div>
            </div>
            {/* Save */}
            <div className="border-t border-gray-100 px-6 py-4 dark:border-white/[0.04]">
              <button
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-(--foreground) px-5 py-2.5 text-sm font-semibold text-(--background) shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
              >
                <HiOutlineSave className="h-4 w-4" />
                {isPending ? t.saving : t.save}
              </button>
            </div>
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-7">
          {/* Quick Actions */}
          <section className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-white/[0.04]">
              <h2 className="text-sm font-bold">{t.quickActions}</h2>
              <p className="mt-0.5 text-xs text-(--muted-foreground)">{t.quickActionsDesc}</p>
            </div>
            <div className="space-y-5 p-6">
              {/* Extend */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--muted-foreground)">
                  {t.extendSub}
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder={t.extendDays}
                    value={extendDays}
                    onChange={(e) => setExtendDays(e.target.value)}
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    onClick={handleExtend}
                    disabled={isPending || !extendDays}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 disabled:opacity-40 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
                  >
                    <HiOutlinePlus className="h-3.5 w-3.5" />
                    {t.extend}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-white/[0.04]" />

              {/* Send Invoice via WhatsApp */}
              <div>
                <button
                  onClick={handleSendInvoice}
                  disabled={isPending || !initial.userPhone}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200/70 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 shadow-sm transition-all hover:bg-green-100 disabled:opacity-40 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-950/60"
                >
                  <HiPaperAirplane className="h-4 w-4" />
                  {isPending ? t.sendingInvoice : t.sendInvoice}
                </button>
                {!initial.userPhone && (
                  <p className="mt-1.5 text-center text-[11px] text-amber-500">{t.noPhoneWarn}</p>
                )}
              </div>
            </div>
          </section>

          {/* Payment Info */}
          <section className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-white/[0.04]">
              <h2 className="text-sm font-bold">{t.paymentInfo}</h2>
              <p className="mt-0.5 text-xs text-(--muted-foreground)">{t.paymentInfoDesc}</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {[
                { label: t.paymentId, value: initial.paymentId, mono: true },
                { label: t.paymentMethod, value: initial.paymentMethod },
                { label: t.startDate, value: fmtDT(initial.startDate) },
                { label: t.createdAt, value: fmtDT(initial.createdAt) },
                { label: t.updatedAt, value: fmtDT(initial.updatedAt) },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <span className="text-xs text-(--muted-foreground)">{row.label}</span>
                  <span
                    className={`text-xs font-medium ${
                      row.mono ? "font-mono text-(--muted-foreground)/80" : ""
                    }`}
                  >
                    {row.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Cancel / Activate */}
          <section className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="p-6">
              {isActive ? (
                <div>
                  <button
                    onClick={handleCancel}
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm transition-all hover:bg-red-100 disabled:opacity-40 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
                  >
                    <HiOutlineBan className="h-4 w-4" />
                    {t.cancelSub}
                  </button>
                  <p className="mt-1.5 text-center text-[11px] text-(--muted-foreground)">
                    {t.cancelDesc}
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    onClick={handleActivate}
                    disabled={isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 disabled:opacity-40 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
                  >
                    <HiOutlinePlay className="h-4 w-4" />
                    {t.activate}
                  </button>
                  <p className="mt-1.5 text-center text-[11px] text-(--muted-foreground)">
                    {t.activateDesc}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
