import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { listAllBusinessRequests } from "@/lib/db/businessRequests";
import { listLoyaltyProfiles } from "@/lib/db/loyalty";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";

export const runtime = "nodejs";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const businesses = listBusinesses({ includeUnverified: true });
  const categories = listCategories();
  const requests = listAllBusinessRequests();
  const loyaltyProfiles = listLoyaltyProfiles();

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "لوحة تحكم الإدارة" : "Admin Dashboard"}
        </h1>
        <p className="mt-2 text-(--muted-foreground)">
          {ar ? "إدارة شاملة لجميع جوانب المنصة" : "Comprehensive management of all platform aspects"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href={`/${locale}/admin/businesses`} className="sbc-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-(--muted-foreground)">
                {ar ? "الأنشطة التجارية" : "Businesses"}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{businesses.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </Link>

        <Link href={`/${locale}/admin/categories`} className="sbc-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-(--muted-foreground)">
                {ar ? "التصنيفات" : "Categories"}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{categories.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link href={`/${locale}/admin/requests`} className="sbc-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-(--muted-foreground)">
                {ar ? "الطلبات المعلقة" : "Pending Requests"}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{pendingRequests.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Link>

        <Link href={`/${locale}/admin/loyalty`} className="sbc-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-(--muted-foreground)">
                {ar ? "برامج الولاء" : "Loyalty Programs"}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{loyaltyProfiles.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "الأنشطة التجارية" : "Businesses"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "إدارة جميع الأنشطة التجارية المسجلة" : "Manage all registered businesses"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/businesses`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? "عرض الكل" : "View All"}
            </Link>
            <Link
              href={`/${locale}/admin/new`}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              {ar ? "إضافة نشاط" : "Add Business"}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "طلبات التسجيل" : "Registration Requests"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "مراجعة والرد على طلبات تسجيل الأنشطة" : "Review and respond to business requests"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/requests`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? `عرض الطلبات (${pendingRequests.length})` : `View Requests (${pendingRequests.length})`}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "التصنيفات" : "Categories"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "إدارة تصنيفات الأنشطة التجارية" : "Manage business categories"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/categories`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? "إدارة التصنيفات" : "Manage Categories"}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "برامج الولاء" : "Loyalty Programs"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "عرض وإدارة برامج الولاء النشطة" : "View and manage active loyalty programs"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/loyalty`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? "عرض البرامج" : "View Programs"}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "المستخدمون" : "Users"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "إدارة حسابات المستخدمين" : "Manage user accounts"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/users`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? "إدارة المستخدمين" : "Manage Users"}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "إشعارات الدفع" : "Push Notifications"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "إرسال إشعارات للمستخدمين المشتركين" : "Send notifications to subscribed users"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/push`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? "إدارة الإشعارات" : "Manage Notifications"}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            {ar ? "المحصولات" : "Products"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "عرض المحصولات النشطة للأنشطة" : "View active business products"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/products`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? "عرض المحصولات" : "View Products"}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-4">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h2 className="text-lg font-semibold">
              {ar ? "النسخ الاحتياطية" : "Backups"}
            </h2>
          </div>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar 
              ? "إدارة النسخ الاحتياطية للبيانات والملفات مع التشفير"
              : "Manage encrypted database and file backups"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/backup`}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              {ar ? "إدارة النسخ الاحتياطية" : "Manage Backups"}
            </Link>
          </div>
        </div>
      </div>
    </AppPage>
  );
}
