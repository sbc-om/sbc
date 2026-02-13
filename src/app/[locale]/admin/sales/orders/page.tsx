import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  HiArrowLeft,
  HiCheckCircle, 
  HiClock, 
  HiXCircle, 
  HiRefresh,
  HiSearch,
  HiFilter,
  HiEye
} from "react-icons/hi";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { listAllOrders, type OrderStatus } from "@/lib/db/orders";
import { formatStorePrice } from "@/lib/store/utils";

export const runtime = "nodejs";

function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { status, page } = await searchParams;
  if (!isLocale(locale)) redirect("/en/admin/sales/orders");

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect(`/${locale}/login`);
  }

  const ar = locale === "ar";
  const currentPage = parseInt(page || "1", 10);
  const limit = 20;
  const offset = (currentPage - 1) * limit;

  const { orders, total } = await listAllOrders({
    status: status as OrderStatus | undefined,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);

  const copy = {
    title: ar ? "جميع الطلبات" : "All Orders",
    subtitle: ar ? "قائمة كاملة بجميع الطلبات" : "Complete list of all orders",
    back: ar ? "العودة" : "Back",
    orderNumber: ar ? "رقم الطلب" : "Order #",
    customer: ar ? "العميل" : "Customer",
    items: ar ? "المنتجات" : "Items",
    amount: ar ? "المبلغ" : "Amount",
    status: ar ? "الحالة" : "Status",
    paymentMethod: ar ? "طريقة الدفع" : "Payment",
    date: ar ? "التاريخ" : "Date",
    actions: ar ? "الإجراءات" : "Actions",
    noOrders: ar ? "لا توجد طلبات" : "No orders found",
    all: ar ? "الكل" : "All",
    wallet: ar ? "المحفظة" : "Wallet",
    view: ar ? "عرض" : "View",
    showing: ar ? "عرض" : "Showing",
    of: ar ? "من" : "of",
    prev: ar ? "السابق" : "Previous",
    next: ar ? "التالي" : "Next",
    filterByStatus: ar ? "تصفية حسب الحالة" : "Filter by status",
    export: ar ? "تصدير" : "Export",
  };

  return (
    <AppPage>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/sales`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <HiArrowLeft className={`h-5 w-5 ${ar ? "rotate-180" : ""}`} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{copy.title}</h1>
            <p className="text-sm text-(--muted-foreground)">{copy.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-(--muted-foreground)">
          <HiFilter className="h-4 w-4" />
          {copy.filterByStatus}:
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/admin/sales/orders`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              !status 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                : "bg-(--surface) text-(--muted-foreground) hover:bg-(--surface-hover)"
            }`}
          >
            {copy.all} ({total})
          </Link>
          {(["completed", "pending", "cancelled", "refunded"] as const).map((s) => (
            <Link
              key={s}
              href={`/${locale}/admin/sales/orders?status=${s}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                status === s 
                  ? statusColors[s]
                  : "bg-(--surface) text-(--muted-foreground) hover:bg-(--surface-hover)"
              }`}
            >
              {statusLabels[ar ? "ar" : "en"][s]}
            </Link>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-6 sbc-card overflow-hidden rounded-2xl">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-(--surface)">
              <HiSearch className="h-8 w-8 text-(--muted-foreground)" />
            </div>
            <p className="text-(--muted-foreground)">{copy.noOrders}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-(--surface-border) bg-(--surface)">
                  <tr className="text-(--muted-foreground)">
                    <th className="px-4 py-3 text-start font-medium">{copy.orderNumber}</th>
                    <th className="px-4 py-3 text-start font-medium">{copy.customer}</th>
                    <th className="px-4 py-3 text-start font-medium">{copy.items}</th>
                    <th className="px-4 py-3 text-start font-medium">{copy.amount}</th>
                    <th className="px-4 py-3 text-start font-medium">{copy.status}</th>
                    <th className="px-4 py-3 text-start font-medium">{copy.paymentMethod}</th>
                    <th className="px-4 py-3 text-start font-medium">{copy.date}</th>
                    <th className="px-4 py-3 text-start font-medium">{copy.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--surface-border)">
                  {orders.map((order) => {
                    const StatusIcon = statusIcons[order.status] || HiClock;
                    return (
                      <tr key={order.id} className="hover:bg-(--surface-hover) transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{order.user?.fullName || "—"}</div>
                          <div className="text-xs text-(--muted-foreground)">
                            {order.user?.email || "—"}
                          </div>
                          {order.user?.phone && (
                            <div className="text-xs text-(--muted-foreground)">
                              {order.user.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="text-xs">
                                <span className="font-medium">{item.productName}</span>
                                <span className="text-(--muted-foreground)"> × {item.quantity}</span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-(--muted-foreground)">
                                +{order.items.length - 2} {ar ? "أخرى" : "more"}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">
                            {formatStorePrice({ amount: order.total, currency: "OMR" }, locale)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusLabels[ar ? "ar" : "en"][order.status as keyof typeof statusLabels.en]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs">
                            💳 {copy.wallet}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-(--muted-foreground)">
                          {formatDate(order.createdAt, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/${locale}/admin/sales/orders/${order.id}`}
                            className={buttonVariants({ variant: "ghost", size: "sm" })}
                          >
                            <HiEye className="h-4 w-4" />
                            {copy.view}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-(--surface-border) px-4 py-3">
                <div className="text-sm text-(--muted-foreground)">
                  {copy.showing} {offset + 1}-{Math.min(offset + limit, total)} {copy.of} {total}
                </div>
                <div className="flex items-center gap-2">
                  {currentPage > 1 && (
                    <Link
                      href={`/${locale}/admin/sales/orders?${status ? `status=${status}&` : ""}page=${currentPage - 1}`}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      {copy.prev}
                    </Link>
                  )}
                  <span className="px-3 py-1 text-sm font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <Link
                      href={`/${locale}/admin/sales/orders?${status ? `status=${status}&` : ""}page=${currentPage + 1}`}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      {copy.next}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppPage>
  );
}
