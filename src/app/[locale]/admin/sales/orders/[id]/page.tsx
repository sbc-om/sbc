import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { 
  HiArrowLeft,
  HiCheckCircle, 
  HiClock, 
  HiXCircle, 
  HiRefresh,
  HiUser,
  HiMail,
  HiPhone,
  HiCreditCard,
  HiCalendar,
  HiShoppingBag,
  HiReceiptTax
} from "react-icons/hi";
import { RiWallet3Fill } from "react-icons/ri";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { getOrderById } from "@/lib/db/orders";
import { formatStorePrice } from "@/lib/store/utils";

export const runtime = "nodejs";

function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(date));
}

const statusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const statusIcons: Record<string, React.ElementType> = {
  completed: HiCheckCircle,
  pending: HiClock,
  cancelled: HiXCircle,
  refunded: HiRefresh,
};

const statusLabels = {
  en: {
    completed: "Completed",
    pending: "Pending",
    cancelled: "Cancelled",
    refunded: "Refunded",
  },
  ar: {
    completed: "مكتمل",
    pending: "معلق",
    cancelled: "ملغي",
    refunded: "مسترد",
  },
};

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) redirect("/en/admin/sales/orders");

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect(`/${locale}/login`);
  }

  const order = await getOrderById(id);
  if (!order) {
    notFound();
  }

  const ar = locale === "ar";
  const StatusIcon = statusIcons[order.status] || HiClock;

  const copy = {
    title: ar ? "تفاصيل الطلب" : "Order Details",
    back: ar ? "العودة للطلبات" : "Back to Orders",
    orderNumber: ar ? "رقم الطلب" : "Order Number",
    status: ar ? "الحالة" : "Status",
    createdAt: ar ? "تاريخ الإنشاء" : "Created At",
    updatedAt: ar ? "آخر تحديث" : "Last Updated",
    customer: ar ? "بيانات العميل" : "Customer Information",
    name: ar ? "الاسم" : "Name",
    email: ar ? "البريد الإلكتروني" : "Email",
    phone: ar ? "رقم الهاتف" : "Phone",
    payment: ar ? "معلومات الدفع" : "Payment Information",
    paymentMethod: ar ? "طريقة الدفع" : "Payment Method",
    wallet: ar ? "المحفظة" : "Wallet",
    transactionId: ar ? "رقم المعاملة" : "Transaction ID",
    items: ar ? "المنتجات" : "Order Items",
    product: ar ? "المنتج" : "Product",
    quantity: ar ? "الكمية" : "Qty",
    unitPrice: ar ? "سعر الوحدة" : "Unit Price",
    total: ar ? "الإجمالي" : "Total",
    summary: ar ? "ملخص الطلب" : "Order Summary",
    subtotal: ar ? "المجموع الفرعي" : "Subtotal",
    grandTotal: ar ? "الإجمالي النهائي" : "Grand Total",
    timeline: ar ? "سجل الطلب" : "Order Timeline",
    orderPlaced: ar ? "تم إنشاء الطلب" : "Order placed",
    paymentReceived: ar ? "تم استلام الدفع" : "Payment received",
    orderCompleted: ar ? "تم إكمال الطلب" : "Order completed",
  };

  return (
    <AppPage>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href={`/${locale}/admin/sales/orders`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <HiArrowLeft className={`h-5 w-5 ${ar ? "rotate-180" : ""}`} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{copy.title}</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusColors[order.status]}`}>
                <StatusIcon className="h-4 w-4" />
                {statusLabels[ar ? "ar" : "en"][order.status as keyof typeof statusLabels.en]}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-(--muted-foreground)">
              {order.orderNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <HiShoppingBag className="h-5 w-5 text-blue-500" />
              {copy.items}
            </div>
            
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--surface-border) text-(--muted-foreground)">
                    <th className="pb-3 text-start font-medium">{copy.product}</th>
                    <th className="pb-3 text-center font-medium">{copy.quantity}</th>
                    <th className="pb-3 text-end font-medium">{copy.unitPrice}</th>
                    <th className="pb-3 text-end font-medium">{copy.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--surface-border)">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-(--muted-foreground)">
                          {item.productSlug}
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        {item.quantity}
                      </td>
                      <td className="py-4 text-end">
                        {formatStorePrice({ amount: item.unitPrice, currency: "OMR" }, locale)}
                      </td>
                      <td className="py-4 text-end font-medium">
                        {formatStorePrice({ amount: item.total, currency: "OMR" }, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 border-t border-(--surface-border) pt-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-(--muted-foreground)">{copy.subtotal}</span>
                <span>{formatStorePrice({ amount: order.subtotal, currency: "OMR" }, locale)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-(--surface-border) py-3 text-lg font-semibold">
                <span>{copy.grandTotal}</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatStorePrice({ amount: order.total, currency: "OMR" }, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <HiUser className="h-5 w-5 text-purple-500" />
              {copy.customer}
            </div>
            
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <HiUser className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-(--muted-foreground)">{copy.name}</div>
                  <div className="font-medium">{order.user?.fullName || "—"}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <HiMail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-(--muted-foreground)">{copy.email}</div>
                  <div className="font-medium">{order.user?.email || "—"}</div>
                </div>
              </div>
              
              {order.user?.phone && (
                <div className="flex items-center gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <HiPhone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-(--muted-foreground)">{copy.phone}</div>
                    <div className="font-medium">{order.user.phone}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <HiReceiptTax className="h-5 w-5 text-amber-500" />
              {copy.summary}
            </div>
            
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-xs text-(--muted-foreground)">{copy.orderNumber}</div>
                <div className="mt-1 font-mono font-medium">{order.orderNumber}</div>
              </div>
              
              <div>
                <div className="text-xs text-(--muted-foreground)">{copy.status}</div>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusLabels[ar ? "ar" : "en"][order.status as keyof typeof statusLabels.en]}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-(--muted-foreground)">{copy.createdAt}</div>
                <div className="mt-1 text-sm">{formatDate(order.createdAt, locale)}</div>
              </div>
              
              <div>
                <div className="text-xs text-(--muted-foreground)">{copy.updatedAt}</div>
                <div className="mt-1 text-sm">{formatDate(order.updatedAt, locale)}</div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <RiWallet3Fill className="h-5 w-5 text-emerald-500" />
              {copy.payment}
            </div>
            
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <RiWallet3Fill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-(--muted-foreground)">{copy.paymentMethod}</div>
                  <div className="font-medium">{copy.wallet}</div>
                </div>
              </div>
              
              {order.walletTransactionId && (
                <div>
                  <div className="text-xs text-(--muted-foreground)">{copy.transactionId}</div>
                  <div className="mt-1 font-mono text-xs break-all">{order.walletTransactionId}</div>
                </div>
              )}
              
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <div className="text-sm text-emerald-700 dark:text-emerald-300">{copy.grandTotal}</div>
                <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatStorePrice({ amount: order.total, currency: "OMR" }, locale)}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <HiCalendar className="h-5 w-5 text-blue-500" />
              {copy.timeline}
            </div>
            
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <HiCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="h-full w-0.5 bg-(--surface-border)" />
                </div>
                <div className="pb-4">
                  <div className="font-medium">{copy.orderPlaced}</div>
                  <div className="text-xs text-(--muted-foreground)">
                    {formatDate(order.createdAt, locale)}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <RiWallet3Fill className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="h-full w-0.5 bg-(--surface-border)" />
                </div>
                <div className="pb-4">
                  <div className="font-medium">{copy.paymentReceived}</div>
                  <div className="text-xs text-(--muted-foreground)">
                    {formatDate(order.createdAt, locale)}
                  </div>
                </div>
              </div>
              
              {order.status === "completed" && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      <HiCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">{copy.orderCompleted}</div>
                    <div className="text-xs text-(--muted-foreground)">
                      {formatDate(order.updatedAt, locale)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppPage>
  );
}
