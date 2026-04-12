import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { requireUser } from "@/lib/auth/requireUser";
import { listCategories } from "@/lib/db/categories";
import { countProgramSubscriptions } from "@/lib/db/subscriptions";
import { listBusinessesByOwner } from "@/lib/db/businesses";
import { listBusinessRequestsByUser } from "@/lib/db/businessRequests";
import { AppPage } from "@/components/AppPage";
import { BusinessRequestForm } from "./BusinessRequestForm";
import Link from "next/link";

export default async function BusinessRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  await getDictionary(locale as Locale);

  const sp = await searchParams;
  const success = sp.success === "1";

  const [totalPackages, ownedBusinesses, requests, categories] =
    await Promise.all([
      countProgramSubscriptions(user.id, "directory"),
      listBusinessesByOwner(user.id),
      listBusinessRequestsByUser(user.id),
      listCategories(),
    ]);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const used = ownedBusinesses.length + pendingRequests.length;
  const canRegister = totalPackages > 0 && used < totalPackages;

  const ar = locale === "ar";

  return (
    <AppPage>
        {success ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-6">
              <svg className="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              {ar ? "تم إرسال طلبك بنجاح!" : "Request Submitted Successfully!"}
            </h1>
            <p className="text-sm text-(--muted-foreground) max-w-md">
              {ar
                ? "شكراً لك! سيقوم فريقنا بمراجعة طلبك والرد عليك في أقرب وقت ممكن."
                : "Thank you! Our team will review your request and get back to you as soon as possible."}
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-accent text-(--accent-foreground)"
              >
                {ar ? "لوحة التحكم" : "Dashboard"}
              </Link>
              <Link
                href={`/${locale}/business-request`}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-(--chip-bg) text-foreground"
              >
                {ar ? "طلب جديد" : "New Request"}
              </Link>
            </div>
          </div>
        ) : !canRegister ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-6">
              <svg className="h-10 w-10 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              {totalPackages === 0
                ? (ar ? "تحتاج إلى باقة دليل الأعمال" : "Directory Package Required")
                : (ar ? "تحتاج إلى باقة إضافية" : "Additional Package Required")}
            </h1>
            <p className="text-sm text-(--muted-foreground) max-w-md">
              {totalPackages === 0
                ? (ar
                    ? "لإرسال طلب إضافة أو ربط نشاطك التجاري، يرجى شراء باقة (عضوية) من دليل الأعمال أولاً."
                    : "To submit a business listing request, please purchase a Business Directory package first.")
                : (ar
                    ? `لديك ${totalPackages} باقة وقد استخدمت ${used} منها. لتسجيل عمل جديد، يرجى شراء باقة إضافية.`
                    : `You have ${totalPackages} package${totalPackages > 1 ? "s" : ""} and used ${used}. To register a new business, please purchase an additional package.`)}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/store?q=directory`}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-accent text-(--accent-foreground)"
              >
                {ar ? "اذهب للمتجر" : "Go to Store"}
              </Link>
              <Link
                href={`/${locale}/profile/businesses`}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold bg-(--chip-bg) text-foreground"
              >
                {ar ? "إدارة الاشتراك" : "Manage Subscription"}
              </Link>
            </div>
          </div>
        ) : (
          <BusinessRequestForm locale={locale as Locale} categories={categories} />
        )}
    </AppPage>
  );
}
