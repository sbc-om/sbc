import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/requireUser";
import { getProgramSubscriptionByUser, isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function MarketingAppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const ar = locale === "ar";

  const sub = await getProgramSubscriptionByUser(user.id);
  const active = await isProgramSubscriptionActive(user.id);

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "منصة التسويق" : "Marketing Platform"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "لوحة التحكم الخاصة بأدوات التسويق (نسخة أولية)." 
              : "Your marketing tools dashboard (early version)."}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {dict.nav.dashboard}
        </Link>
      </div>

      {!active ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="font-semibold">
            {ar ? "الاشتراك غير مفعل" : "Subscription not active"}
          </div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "لاستخدام خدمات المنصة، اشترِ الباقة المناسبة من المتجر."
              : "To use platform services, purchase a suitable package from the store."}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/store`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "اذهب للمتجر" : "Go to store"}
            </Link>
            <Link
              href={`/${locale}/services`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {ar ? "صفحة المنتج" : "Product page"}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 sbc-card rounded-2xl p-6">
            <div className="font-semibold">
              {ar ? "اشتراكك مفعل" : "Your subscription is active"}
            </div>
            {sub ? (
              <p className="mt-2 text-sm text-(--muted-foreground)">
                {ar ? "ينتهي في" : "Expires on"}: <span className="font-medium">{new Date(sub.expiresAt).toLocaleDateString(ar ? "ar-OM" : "en-OM")}</span>
              </p>
            ) : null}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="sbc-card rounded-2xl p-6">
              <div className="font-semibold">{ar ? "خدمات CRM للشركات الصغيرة" : "CRM Services for Small Businesses"}</div>
              <p className="mt-2 text-sm text-(--muted-foreground)">
                {ar
                  ? "إدارة العملاء، سجل التواصل، وتقسيم العملاء في مكان واحد."
                  : "Manage customer records, touchpoints, and audience segments in one place."}
              </p>
            </div>

            <div className="sbc-card rounded-2xl p-6">
              <div className="font-semibold">{ar ? "خدمات المحاسبة للشركات الصغيرة" : "Accounting Services for Small Businesses"}</div>
              <p className="mt-2 text-sm text-(--muted-foreground)">
                {ar
                  ? "فواتير، متابعة المصاريف، وتقارير مالية مبسطة."
                  : "Invoicing, expense tracking, and simplified financial reporting."}
              </p>
            </div>

            <div className="sbc-card rounded-2xl p-6">
              <div className="font-semibold">{ar ? "خدمات الاجتماعات والكلاسات الأونلاين" : "Online Meetings & Virtual Classes"}</div>
              <p className="mt-2 text-sm text-(--muted-foreground)">
                {ar
                  ? "إدارة الجلسات المباشرة والصفوف الافتراضية وجدولة المواعيد."
                  : "Run live meetings and virtual classes with scheduling tools."}
              </p>
            </div>

            <div className="sbc-card rounded-2xl p-6">
              <div className="font-semibold">{ar ? "خدمات شبكة SBCClaw الذكية" : "SBCClaw Smart Business Network"}</div>
              <p className="mt-2 text-sm text-(--muted-foreground)">
                {ar
                  ? "خدمات الشبكات والأتمتة لربط أدوات عملك بشكل ذكي."
                  : "Smart networking and automation services to connect your business tools."}
              </p>
            </div>
          </div>

          <div className="mt-10 text-xs text-(--muted-foreground)">
            {ar
              ? "لتغيير الباقة أو تمديد المدة، قم بالشراء مرة أخرى من المتجر—وسيتم إضافة المدة تلقائياً." 
              : "To change package or extend time, purchase again from the store—time will be added automatically."}
          </div>
        </>
      )}
    </AppPage>
  );
}
