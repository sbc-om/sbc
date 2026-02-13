import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { requireUser } from "@/lib/auth/requireUser";
import { listCategories } from "@/lib/db/categories";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";
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

  const active = await isProgramSubscriptionActive(user.id);

  const categories = await listCategories();

  return (
    <AppPage>
        <h1 className="text-2xl font-semibold tracking-tight">
          {locale === "ar" ? "طلب إضافة عمل" : "Request a Business Listing"}
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {locale === "ar"
            ? "املأ النموذج بالكامل وحدد موقعك على الخريطة."
            : "Fill the complete form and select your location on the map."}
        </p>

        {success ? (
          <div className="mt-6 sbc-card rounded-2xl p-5">
            <div className="font-semibold">
              {locale === "ar" ? "تم إرسال الطلب" : "Request submitted"}
            </div>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "سنقوم بمراجعته قريباً."
                : "We will review it shortly."}
            </p>
          </div>
        ) : null}

        {!active ? (
          <div className="mt-6 sbc-card rounded-2xl p-6">
            <div className="font-semibold">
              {locale === "ar" ? "تحتاج إلى باقة دليل الأعمال" : "Directory package required"}
            </div>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "لإرسال طلب إضافة/ربط نشاطك، يرجى شراء باقة (عضوية) من دليل الأعمال أولاً." 
                : "To submit a listing request, please purchase a Business Directory package first."}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/store?q=directory`}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-accent text-(--accent-foreground)"
              >
                {locale === "ar" ? "اذهب للمتجر" : "Go to store"}
              </Link>
              <Link
                href={`/${locale}/directory`}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-(--chip-bg) text-foreground"
              >
                {locale === "ar" ? "إدارة الاشتراك" : "Manage subscription"}
              </Link>
            </div>
          </div>
        ) : (
          <BusinessRequestForm locale={locale as Locale} categories={categories} />
        )}
    </AppPage>
  );
}
