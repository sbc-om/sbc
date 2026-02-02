import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { listBusinessRequests } from "@/lib/db/businessRequests";
import { listAllBusinessCards } from "@/lib/db/businessCards";
import { listUnreadContactMessages } from "@/lib/db/contactMessages";
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

  const businesses = await listBusinesses();
  const categories = await listCategories();
  const requests = await listBusinessRequests();
  const loyaltyProfiles = await listLoyaltyProfiles();
  const businessCards = await listAllBusinessCards();
  const unreadContactMessages = (await listUnreadContactMessages()).length;

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const pendingCards = businessCards.filter((c) => !(c.isApproved ?? false));
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

        <Link href={`/${locale}/admin/business-cards`} className="sbc-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-(--muted-foreground)">
                {ar ? "بطاقات الأعمال" : "Business Cards"}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{pendingCards.length}</h3>
              <p className="mt-1 text-xs text-(--muted-foreground)">
                {ar ? "معلّقة" : "Pending"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link href={`/${locale}/admin/contact-messages`} className="sbc-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-(--muted-foreground)">
                {ar ? "رسائل التواصل" : "Contact Messages"}
              </p>
              <h3 className="mt-2 text-3xl font-bold">{unreadContactMessages}</h3>
              <p className="mt-1 text-xs text-(--muted-foreground)">
                {ar ? "غير مقروءة" : "Unread"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m5 6H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8l-3 3z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link href={`/${locale}/admin/settings`} className="sbc-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-(--muted-foreground)">
                {ar ? "إعدادات النظام" : "System Settings"}
              </p>
              <h3 className="mt-2 text-lg font-bold">{ar ? "إدارة" : "Manage"}</h3>
              <p className="mt-1 text-xs text-(--muted-foreground)">
                {ar ? "المصادقة والتطبيق" : "Auth & App"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="sbc-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "الأنشطة التجارية" : "Businesses"}
            </h2>
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "طلبات التسجيل" : "Registration Requests"}
            </h2>
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "التصنيفات" : "Categories"}
            </h2>
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "برامج الولاء" : "Loyalty Programs"}
            </h2>
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "بطاقات الأعمال" : "Business Cards"}
            </h2>
          </div>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "مراجعة واعتماد بطاقات الأعمال" : "Review and approve business cards"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/business-cards`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? `المعلّقة (${pendingCards.length})` : `Pending (${pendingCards.length})`}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m5 6H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8l-3 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "رسائل التواصل" : "Contact Messages"}
            </h2>
          </div>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "عرض رسائل صفحة تواصل معنا" : "Review messages from the contact page"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/contact-messages`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? `غير مقروءة (${unreadContactMessages})` : `Unread (${unreadContactMessages})`}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "المستخدمون" : "Users"}
            </h2>
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "إشعارات الدفع" : "Push Notifications"}
            </h2>
          </div>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "المحصولات" : "Products"}
            </h2>
          </div>
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

        <div className="sbc-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">
              {ar ? "إعدادات النظام" : "System Settings"}
            </h2>
          </div>
          <p className="text-sm text-(--muted-foreground) mb-4">
            {ar ? "إدارة إعدادات المصادقة والتطبيق" : "Manage authentication and application settings"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/admin/settings`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {ar ? "إدارة الإعدادات" : "Manage Settings"}
            </Link>
          </div>
        </div>

        <div className="sbc-card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-200 dark:bg-blue-800/50 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-700 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
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
