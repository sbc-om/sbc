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
import { getAllWithdrawalRequests } from "@/lib/db/wallet";
import { getOrderSummary } from "@/lib/db/orders";
import { listAllProgramSubscriptions } from "@/lib/db/subscriptions";
import { countAgentWithdrawalRequests, listAgents } from "@/lib/db/agents";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

const colorClasses: Record<string, { bg: string; text: string; hover: string }> = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    hover: "group-hover:bg-blue-200 dark:group-hover:bg-blue-800/40",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-600 dark:text-green-400",
    hover: "group-hover:bg-green-200 dark:group-hover:bg-green-800/40",
  },
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-600 dark:text-yellow-400",
    hover: "group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/40",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
    hover: "group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-600 dark:text-indigo-400",
    hover: "group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/40",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-600 dark:text-orange-400",
    hover: "group-hover:bg-orange-200 dark:group-hover:bg-orange-800/40",
  },
  rose: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-600 dark:text-rose-400",
    hover: "group-hover:bg-rose-200 dark:group-hover:bg-rose-800/40",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    text: "text-pink-600 dark:text-pink-400",
    hover: "group-hover:bg-pink-200 dark:group-hover:bg-pink-800/40",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
    hover: "group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/40",
  },
  teal: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-600 dark:text-teal-400",
    hover: "group-hover:bg-teal-200 dark:group-hover:bg-teal-800/40",
  },
  cyan: {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-600 dark:text-cyan-400",
    hover: "group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800/40",
  },
  slate: {
    bg: "bg-slate-100 dark:bg-slate-900/30",
    text: "text-slate-600 dark:text-slate-400",
    hover: "group-hover:bg-slate-200 dark:group-hover:bg-slate-800/40",
  },
};

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
  const pendingWithdrawals = await getAllWithdrawalRequests("pending", 100, 0);
  const orderSummary = await getOrderSummary();
  const allSubscriptions = await listAllProgramSubscriptions();
  const allAgentsList = await listAgents();
  const pendingAgentWithdrawals = await countAgentWithdrawalRequests("pending");
  const activeSubscriptions = allSubscriptions.filter(
    (s) => s.isActive && new Date(s.endDate) > new Date()
  );

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const pendingCards = businessCards.filter((c) => !(c.isApproved ?? false));
  const ar = locale === "ar";

  const sections = [
    {
      href: `/${locale}/admin/businesses`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: ar ? "الأنشطة التجارية" : "Businesses",
      color: "blue",
      badge: businesses.length,
    },
    {
      href: `/${locale}/admin/categories`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      label: ar ? "التصنيفات" : "Categories",
      color: "green",
      badge: categories.length,
    },
    {
      href: `/${locale}/admin/requests`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: ar ? "الطلبات" : "Requests",
      color: "yellow",
      badge: pendingRequests.length > 0 ? pendingRequests.length : undefined,
      badgeType: "warning" as const,
    },
    {
      href: `/${locale}/admin/loyalty`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      label: ar ? "برامج الولاء" : "Loyalty",
      color: "purple",
      badge: loyaltyProfiles.length,
    },
    {
      href: `/${locale}/admin/users`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: ar ? "المستخدمون" : "Users",
      color: "indigo",
    },
    {
      href: `/${locale}/admin/withdrawals`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: ar ? "طلبات السحب" : "Withdrawals",
      color: "rose",
      badge: pendingWithdrawals.length > 0 ? pendingWithdrawals.length : undefined,
      badgeType: "warning" as const,
    },
    {
      href: `/${locale}/admin/agent-withdrawals`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-2-7h8m-8 3h5" />
        </svg>
      ),
      label: ar ? "سحب أرباح الوكلاء" : "Agent Withdrawals",
      color: "teal",
      badge: pendingAgentWithdrawals > 0 ? pendingAgentWithdrawals : undefined,
      badgeType: "warning" as const,
    },
    {
      href: `/${locale}/admin/sales`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: ar ? "المبيعات" : "Sales",
      color: "emerald",
      badge: orderSummary.totalOrders > 0 ? orderSummary.totalOrders : undefined,
    },
    {
      href: `/${locale}/admin/business-cards`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: ar ? "بطاقات الأعمال" : "Business Cards",
      color: "orange",
      badge: pendingCards.length > 0 ? pendingCards.length : undefined,
      badgeType: "warning" as const,
    },
    {
      href: `/${locale}/admin/contact-messages`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m5 6H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8l-3 3z" />
        </svg>
      ),
      label: ar ? "الرسائل" : "Messages",
      color: "pink",
      badge: unreadContactMessages > 0 ? unreadContactMessages : undefined,
      badgeType: "warning" as const,
    },
    {
      href: `/${locale}/admin/push`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      label: ar ? "الإشعارات" : "Notifications",
      color: "pink",
    },
    {
      href: `/${locale}/admin/whatsapp`,
      icon: (
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      label: ar ? "واتساب" : "WhatsApp",
      color: "emerald",
    },
    {
      href: `/${locale}/admin/products`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      label: ar ? "المنتجات" : "Products",
      color: "teal",
    },
    {
      href: `/${locale}/admin/subscriptions`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      label: ar ? "الاشتراكات" : "Subscriptions",
      color: "cyan",
      badge: activeSubscriptions.length > 0 ? activeSubscriptions.length : undefined,
    },
    {
      href: `/${locale}/admin/agents`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      label: ar ? "الوكلاء" : "Agents",
      color: "indigo",
      badge: allAgentsList.length > 0 ? allAgentsList.length : undefined,
    },
    {
      href: `/${locale}/admin/backup`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      label: ar ? "النسخ الاحتياطي" : "Backup",
      color: "cyan",
    },
    {
      href: `/${locale}/admin/settings`,
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: ar ? "الإعدادات" : "Settings",
      color: "slate",
    },
  ];

  return (
    <AppPage>
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {ar ? "لوحة التحكم" : "Admin Dashboard"}
        </h1>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {sections.map((section) => {
          const colors = colorClasses[section.color] || colorClasses.slate;
          const badgeClasses = section.badgeType === "warning"
            ? "bg-amber-500 text-white"
            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";

          return (
            <Link
              key={section.href}
              href={section.href}
              className="group sbc-card sbc-card--interactive relative flex flex-col items-center justify-center p-6 text-center rounded-2xl"
            >
              {section.badge !== undefined && (
                <span className={`absolute -top-2 -end-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${badgeClasses}`}>
                  {section.badge}
                </span>
              )}

              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colors.bg} ${colors.hover} transition-colors`}>
                <span className={colors.text}>{section.icon}</span>
              </div>

              <span className="mt-4 text-sm font-semibold text-foreground">
                {section.label}
              </span>
            </Link>
          );
        })}
      </div>
    </AppPage>
  );
}
