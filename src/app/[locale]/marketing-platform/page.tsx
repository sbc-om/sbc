import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function MarketingPlatformPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);

  const ar = locale === "ar";

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {ar ? "منصة التسويق" : "Marketing Platform"}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {ar
              ? "واجهة موحدة لإرسال الرسائل عبر واتساب وتلغرام مع تخصيص كامل وواجهات API قابلة للاستخدام في أي نظام." 
              : "A unified messaging platform with WhatsApp + Telegram APIs, customization, and reusable integrations."}
          </p>
        </div>
        <Link
          href={`/${locale}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "العودة للرئيسية" : "Back to home"}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="sbc-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold">{ar ? "واجهة API لواتساب" : "WhatsApp API"}</h2>
          <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
            {ar
              ? "إرسال رسائل آلية، قوالب، حملات، وإدارة جلسات المحادثة—مع إمكانية دمجها داخل مواقعك وتطبيقاتك." 
              : "Automate messages, templates, campaigns, and conversational sessions—ready to embed into your apps and sites."}
          </p>
        </div>

        <div className="sbc-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold">{ar ? "واجهة API لتلغرام" : "Telegram API"}</h2>
          <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
            {ar
              ? "إرسال وتنظيم الرسائل عبر بوتات تلغرام، مع قواعد توجيه (routing) ووسوم وتقارير." 
              : "Send and orchestrate Telegram bot messages with routing rules, tags, and reporting."}
          </p>
        </div>

        <div className="sbc-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold">{ar ? "التخصيص والدمج" : "Customization & Embedding"}</h2>
          <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
            {ar
              ? "مكوّنات جاهزة لاستخدامها في أي لوحة تحكم أو CRM، مع هوية بصرية قابلة للتخصيص لكل نشاط." 
              : "Reusable components for any dashboard/CRM, with per-business branding and customization."}
          </p>
        </div>
      </div>

      <div className="mt-8 sbc-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{ar ? "ماذا ستحصل عليه" : "What you get"}</h3>
        <ul className="mt-3 grid gap-2 text-sm text-(--muted-foreground)">
          <li>{ar ? "• إدارة قوالب الرسائل" : "• Message templates management"}</li>
          <li>{ar ? "• حملات ورسائل جماعية" : "• Campaigns & broadcasts"}</li>
          <li>{ar ? "• قواعد تخصيص حسب الفئة/المدينة/الوسوم" : "• Targeting rules by category/city/tags"}</li>
          <li>{ar ? "• Webhook + API للاستخدام في أي مكان" : "• Webhooks + API to use anywhere"}</li>
          <li>{ar ? "• لوحة تحكم وتقارير" : "• Dashboard & reporting"}</li>
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/contact`}
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            {ar ? "اطلب عرضاً" : "Request a demo"}
          </Link>
          <Link
            href={`/${locale}/businesses`}
            className={buttonVariants({ variant: "secondary", size: "md" })}
          >
            {ar ? "استكشف الدليل" : "Explore directory"}
          </Link>
        </div>
      </div>

      <div className="mt-8 text-xs text-(--muted-foreground)">
        {ar
          ? "ملاحظة: صفحة المنتج هذه للتعريف—تكاملات واتساب/تلغرام سيتم تفعيلها لاحقاً حسب المتطلبات." 
          : "Note: This page describes the product—WhatsApp/Telegram integrations will be implemented based on your requirements."}
      </div>
    </PublicPage>
  );
}
