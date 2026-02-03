import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  HiCurrencyDollar, 
  HiShoppingCart, 
  HiTrendingUp, 
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiRefresh,
  HiChartBar,
  HiCash,
  HiUsers,
  HiArrowRight
} from "react-icons/hi";
import { RiWallet3Fill, RiMoneyDollarCircleFill } from "react-icons/ri";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { 
  listAllOrders, 
  getOrderSummary, 
  getDailySalesReport, 
  getProductSalesReport,
  getTreasuryBalance,
  type OrderWithItems 
} from "@/lib/db/orders";
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

function formatShortDate(dateStr: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
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

export default async function AdminSalesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) redirect("/en/admin/sales");

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect(`/${locale}/login`);
  }

  const ar = locale === "ar";

  // Fetch all data in parallel
  const [
    { orders, total: totalOrders },
    summary,
    dailyReport,
    productReport,
    treasury,
  ] = await Promise.all([
    listAllOrders({ limit: 20 }),
    getOrderSummary(),
    getDailySalesReport({ limit: 14 }),
    getProductSalesReport({ limit: 10 }),
    getTreasuryBalance(),
  ]);

  const copy = {
    title: ar ? "إدارة المبيعات" : "Sales Management",
    subtitle: ar ? "تقارير المبيعات وإحصائيات الطلبات" : "Sales reports and order statistics",
    treasury: ar ? "صندوق SBC" : "SBC Treasury",
    treasuryBalance: ar ? "رصيد الصندوق" : "Treasury Balance",
    totalDeposits: ar ? "إجمالي الإيداعات" : "Total Deposits",
    transactions: ar ? "المعاملات" : "Transactions",
    overview: ar ? "نظرة عامة" : "Overview",
    totalRevenue: ar ? "إجمالي الإيرادات" : "Total Revenue",
    totalOrders: ar ? "إجمالي الطلبات" : "Total Orders",
    completedOrders: ar ? "الطلبات المكتملة" : "Completed Orders",
    pendingOrders: ar ? "الطلبات المعلقة" : "Pending Orders",
    avgOrderValue: ar ? "متوسط قيمة الطلب" : "Avg. Order Value",
    recentOrders: ar ? "آخر الطلبات" : "Recent Orders",
    dailySales: ar ? "المبيعات اليومية" : "Daily Sales",
    topProducts: ar ? "أفضل المنتجات" : "Top Products",
    orderNumber: ar ? "رقم الطلب" : "Order #",
    customer: ar ? "العميل" : "Customer",
    amount: ar ? "المبلغ" : "Amount",
    status: ar ? "الحالة" : "Status",
    date: ar ? "التاريخ" : "Date",
    viewAll: ar ? "عرض الكل" : "View all",
    noOrders: ar ? "لا توجد طلبات بعد" : "No orders yet",
    items: ar ? "المنتجات" : "Items",
    sold: ar ? "تم بيعه" : "Sold",
    revenue: ar ? "الإيرادات" : "Revenue",
    orders: ar ? "طلب" : "orders",
    viewDetails: ar ? "عرض التفاصيل" : "View details",
    product: ar ? "المنتج" : "Product",
    unitsSold: ar ? "الكمية المباعة" : "Units Sold",
  };

  return (
    <AppPage>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{copy.title}</h1>
          <p className="mt-1 text-(--muted-foreground)">{copy.subtitle}</p>
        </div>
      </div>

      {/* Treasury Card */}
      <div className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <RiMoneyDollarCircleFill className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-semibold opacity-90">{copy.treasury}</h2>
            <p className="text-sm opacity-75">{ar ? "الحساب الرئيسي للمبيعات" : "Main sales account"}</p>
          </div>
        </div>
        
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-sm opacity-75">{copy.treasuryBalance}</div>
            <div className="mt-1 text-2xl font-bold">
              {formatStorePrice({ amount: treasury.balance, currency: "OMR" }, locale)}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-sm opacity-75">{copy.totalDeposits}</div>
            <div className="mt-1 text-2xl font-bold">
              {formatStorePrice({ amount: treasury.totalDeposits, currency: "OMR" }, locale)}
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-sm opacity-75">{copy.transactions}</div>
            <div className="mt-1 text-2xl font-bold">
              {treasury.transactionCount.toLocaleString(locale === "ar" ? "ar" : "en")}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="sbc-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <HiCurrencyDollar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-sm text-(--muted-foreground)">{copy.totalRevenue}</div>
              <div className="text-xl font-bold">
                {formatStorePrice({ amount: summary.totalRevenue, currency: "OMR" }, locale)}
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="sbc-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <HiShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-(--muted-foreground)">{copy.totalOrders}</div>
              <div className="text-xl font-bold">
                {summary.totalOrders.toLocaleString(locale === "ar" ? "ar" : "en")}
              </div>
            </div>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="sbc-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <HiCheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-(--muted-foreground)">{copy.completedOrders}</div>
              <div className="text-xl font-bold">
                {summary.completedOrders.toLocaleString(locale === "ar" ? "ar" : "en")}
              </div>
            </div>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="sbc-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <HiTrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-sm text-(--muted-foreground)">{copy.avgOrderValue}</div>
              <div className="text-xl font-bold">
                {formatStorePrice({ amount: summary.averageOrderValue, currency: "OMR" }, locale)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent Orders - Takes 2 columns */}
        <div className="sbc-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{copy.recentOrders}</h3>
            <Link
              href={`/${locale}/admin/sales/orders`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {copy.viewAll}
              <HiArrowRight className={`h-4 w-4 ${ar ? "rotate-180" : ""}`} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-xl border border-(--surface-border) bg-(--surface) p-8 text-center">
              <HiShoppingCart className="mx-auto h-12 w-12 text-(--muted-foreground) opacity-50" />
              <p className="mt-2 text-sm text-(--muted-foreground)">{copy.noOrders}</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--surface-border) text-(--muted-foreground)">
                    <th className="pb-3 text-start font-medium">{copy.orderNumber}</th>
                    <th className="pb-3 text-start font-medium">{copy.customer}</th>
                    <th className="pb-3 text-start font-medium">{copy.amount}</th>
                    <th className="pb-3 text-start font-medium">{copy.status}</th>
                    <th className="pb-3 text-start font-medium">{copy.date}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--surface-border)">
                  {orders.map((order) => {
                    const StatusIcon = statusIcons[order.status] || HiClock;
                    return (
                      <tr key={order.id} className="group">
                        <td className="py-3">
                          <Link 
                            href={`/${locale}/admin/sales/orders/${order.id}`}
                            className="font-mono text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3">
                          <div className="font-medium">{order.user?.fullName || "—"}</div>
                          <div className="text-xs text-(--muted-foreground)">{order.user?.email}</div>
                        </td>
                        <td className="py-3 font-medium">
                          {formatStorePrice({ amount: order.total, currency: "OMR" }, locale)}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusColors[order.status]}`}>
                            <StatusIcon className="h-3 w-3" />
                            {ar ? (order.status === "completed" ? "مكتمل" : order.status === "pending" ? "معلق" : order.status === "cancelled" ? "ملغي" : "مسترد") : order.status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-(--muted-foreground)">
                          {formatDate(order.createdAt, locale)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="sbc-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold">{copy.topProducts}</h3>
          
          {productReport.length === 0 ? (
            <div className="mt-6 rounded-xl border border-(--surface-border) bg-(--surface) p-6 text-center">
              <HiChartBar className="mx-auto h-10 w-10 text-(--muted-foreground) opacity-50" />
              <p className="mt-2 text-sm text-(--muted-foreground)">{copy.noOrders}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {productReport.map((product, index) => (
                <div 
                  key={product.productId} 
                  className="flex items-center gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{product.productName}</div>
                    <div className="text-xs text-(--muted-foreground)">
                      {product.totalSold} {copy.sold}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatStorePrice({ amount: product.totalRevenue, currency: "OMR" }, locale)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Sales Chart */}
      <div className="mt-6 sbc-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{copy.dailySales}</h3>
        <p className="text-sm text-(--muted-foreground)">
          {ar ? "آخر 14 يومًا" : "Last 14 days"}
        </p>

        {dailyReport.length === 0 ? (
          <div className="mt-6 rounded-xl border border-(--surface-border) bg-(--surface) p-8 text-center">
            <HiChartBar className="mx-auto h-12 w-12 text-(--muted-foreground) opacity-50" />
            <p className="mt-2 text-sm text-(--muted-foreground)">{copy.noOrders}</p>
          </div>
        ) : (
          <div className="mt-6">
            {/* Simple bar chart visualization */}
            <div className="flex items-end justify-between gap-2" style={{ height: "200px" }}>
              {dailyReport.slice().reverse().map((day, index) => {
                const maxRevenue = Math.max(...dailyReport.map(d => d.revenue), 1);
                const heightPercent = (day.revenue / maxRevenue) * 100;
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full max-w-[40px] relative flex items-end justify-center" style={{ height: "160px" }}>
                      <div 
                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-700 hover:to-blue-500"
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        title={`${formatStorePrice({ amount: day.revenue, currency: "OMR" }, locale)} - ${day.orders} ${copy.orders}`}
                      />
                    </div>
                    <div className="text-xs text-(--muted-foreground) text-center">
                      {formatShortDate(day.date, locale)}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 border-t border-(--surface-border) pt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-3 w-3 rounded bg-blue-500" />
                <span className="text-(--muted-foreground)">{copy.revenue}</span>
              </div>
              <div className="text-sm text-(--muted-foreground)">
                {ar ? "مرر على الأعمدة للتفاصيل" : "Hover bars for details"}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppPage>
  );
}
