import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineChat,
  HiOutlineCurrencyDollar,
  HiOutlineGlobeAlt,
  HiOutlineGift,
  HiOutlineLightningBolt,
  HiOutlineMail,
  HiOutlineQrcode,
  HiOutlineSparkles,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { HiOutlineCpuChip } from "react-icons/hi2";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getProgramSubscriptionByUser,
  isProgramSubscriptionActive,
} from "@/lib/db/subscriptions";
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
  const user = await getCurrentUser();
  if (user) {
    await getProgramSubscriptionByUser(user.id);
  }
  const isActive = user ? await isProgramSubscriptionActive(user.id) : false;

  const copy = {
    title: ar ? "منصة خدمات SBC للأعمال" : "SBC Business Services Platform",
    subtitle: ar
      ? "خدمات متكاملة للأعمال تشمل منصة التسويق، CRM، المحاسبة، الاجتماعات والكلاسات الأونلاين، وشبكة SBCClaw الذكية."
      : "An all-in-one business stack including Marketing Platform, CRM, Accounting, Online Meetings & Virtual Classes, and SBCClaw Smart Network.",
    ctaPrimary: ar ? "افتح منصة النمو" : "Open Growth App",
    ctaDemo: ar ? "تحدث مع المبيعات" : "Talk to Sales",
    ctaHome: ar ? "الرئيسية" : "Back Home",
    sectionServices: ar ? "الخدمات الأساسية" : "Core Services",
    sectionWhy: ar ? "مصممة لنمو الأعمال" : "Built for Business Growth",
    sectionIncludes: ar ? "الخدمات المتوفرة الآن:" : "Services available now:",
    sectionPackages: ar ? "باقات الخدمات" : "Service Packages",
  };

  const services = [
    {
      icon: HiOutlineChat,
      title: ar ? "منصة التسويق" : "Marketing Platform",
      desc: ar
        ? "إدارة حملات واتساب وتلغرام، قوالب الرسائل، وأتمتة المتابعة من لوحة واحدة."
        : "Manage WhatsApp and Telegram campaigns, message templates, and automated follow-ups from one dashboard.",
      href: `/${locale}/store?q=marketing`,
      hrefLabel: ar ? "باقات التسويق" : "Marketing Plans",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineUserGroup,
      title: ar ? "خدمات CRM للشركات الصغيرة" : "CRM Services for Small Businesses",
      desc: ar
        ? "إدارة بيانات العملاء، المراحل البيعية، وتذكيرات المتابعة لفِرق المبيعات الصغيرة."
        : "Manage customer records, sales pipelines, and follow-up reminders for lean sales teams.",
      href: `/${locale}/store?q=crm`,
      hrefLabel: ar ? "باقات CRM" : "CRM Plans",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineCurrencyDollar,
      title: ar ? "خدمات المحاسبة للشركات الصغيرة" : "Accounting Services for Small Businesses",
      desc: ar
        ? "فواتير، تتبع المصروفات، وتقارير مالية مبسطة تساعدك على متابعة الأداء المالي بسهولة."
        : "Invoicing, expense tracking, and simplified financial reports to keep your cash flow under control.",
      href: `/${locale}/store?q=accounting`,
      hrefLabel: ar ? "باقات المحاسبة" : "Accounting Plans",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineQrcode,
      title: ar ? "الاجتماعات والكلاسات الأونلاين" : "Online Meetings & Virtual Classes",
      desc: ar
        ? "تشغيل الجلسات المباشرة، إدارة مواعيد الحصص، ومتابعة حضور المشاركين."
        : "Run live sessions, manage class schedules, and track attendance in one place.",
      href: `/${locale}/store?q=online-classes`,
      hrefLabel: ar ? "باقات الأونلاين" : "Online Plans",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineLightningBolt,
      title: ar ? "شبكة SBCClaw الذكية" : "SBCClaw Smart Network",
      desc: ar
        ? "خدمات الشبكات الذكية وربط أدوات العمل بالأتمتة لتحسين الكفاءة التشغيلية."
        : "Smart networking services and workflow automation to connect your business tools and improve operations.",
      href: `/${locale}/store?q=sbcclaw`,
      hrefLabel: ar ? "باقات SBCClaw" : "SBCClaw Plans",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineGift,
      title: ar ? "SBC Smart Card" : "SBC Smart Card",
      desc: ar
        ? "بطاقة ولاء مشتركة بين الأنشطة المشاركة: استخدمها في أي مكان، اكسب نقاط، واصرف نقاط."
        : "A shared loyalty card ecosystem: use anywhere, earn points, and spend points.",
      href: `/${locale}/loyalty`,
      hrefLabel: ar ? "استكشف Smart Card" : "Explore Smart Card",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineMail,
      title: ar ? "Business Email" : "Business Email",
      desc: ar
        ? "إيميل رسمي باسم نشاطك لثقة أعلى وتواصل أكثر احترافية."
        : "Branded business email to build trust and look professional.",
      href: `/${locale}/email/manage`,
      hrefLabel: ar ? "افتح البريد" : "Open Email",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineCpuChip,
      title: ar ? "AI Agent Builder" : "AI Agent Builder",
      desc: ar
        ? "أنشئ وكلاء ذكاء اصطناعي بدون كود لأتمتة المهام وعمليات المتابعة."
        : "Build no-code AI agents to automate operations and follow-ups.",
      href: `/${locale}/ai`,
      hrefLabel: ar ? "افتح AI Builder" : "Open AI Builder",
      tone: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    },
  ];

  const highlights = [
    {
      icon: HiOutlineGlobeAlt,
      title: ar ? "تشغيل موحد لكل الخدمات" : "One Hub for All Services",
      desc: ar
        ? "منصة واحدة لإدارة التسويق، CRM، المحاسبة، والجلسات الأونلاين."
        : "Use a single workspace for marketing, CRM, accounting, and online sessions.",
      tone: "bg-accent/15 text-accent",
    },
    {
      icon: HiOutlineGift,
      title: ar ? "مناسبة للشركات الصغيرة" : "Built for Small Businesses",
      desc: ar
        ? "خدمات عملية وسهلة الإطلاق بدون تعقيد تقني أو فريق كبير."
        : "Practical services that are easy to launch without heavy technical overhead.",
      tone: "bg-accent-2/15 text-accent-2",
    },
    {
      icon: HiOutlineMail,
      title: ar ? "قابل للتوسع مع نمو نشاطك" : "Scales as You Grow",
      desc: ar
        ? "ابدأ شهرياً ثم وسّع إلى خطط 6 أشهر أو سنوية حسب نمو أعمالك."
        : "Start monthly, then upgrade to 6-month or yearly plans as your business grows.",
      tone: "bg-accent/15 text-accent",
    },
  ];

  return (
    <PublicPage>
      <section>
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-lg leading-8 font-medium text-(--muted-foreground)">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          {user && isActive ? (
            <Link
              href={`/${locale}/services/app`}
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className: "min-w-[180px]",
              })}
            >
              {copy.ctaPrimary}
              <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
            </Link>
          ) : (
            <Link
              href={`/${locale}/store`}
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className: "min-w-[180px]",
              })}
            >
              {ar ? "ابدأ النمو الآن" : "Start Growing"}
              <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
            </Link>
          )}
          <Link
            href={`/${locale}/contact`}
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "min-w-[180px]",
            })}
          >
            <HiOutlineSparkles className="h-5 w-5" />
            {copy.ctaDemo}
          </Link>
          <Link
            href={`/${locale}`}
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "min-w-[180px]",
            })}
          >
            <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "" : "rotate-180")} />
            {copy.ctaHome}
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionServices}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="sbc-card sbc-card--interactive flex flex-col rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${service.tone}`}>
                    <Icon className="h-9 w-9" />
                  </div>
                  <h3 className="text-lg font-semibold leading-7">{service.title}</h3>
                </div>
                <p className="mt-4 flex-1 text-base font-medium leading-8 text-(--muted-foreground)">{service.desc}</p>
                <Link
                  href={service.href}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "md",
                    className: "mt-4 w-full",
                  })}
                >
                  {service.hrefLabel}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionWhy}</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="sbc-card sbc-card--interactive rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
                    <Icon className="h-9 w-9" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                </div>
                <p className="mt-4 text-base font-medium leading-8 text-(--muted-foreground)">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 sbc-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{copy.sectionIncludes}</h3>
        <ul className="mt-3 grid gap-3 text-base font-medium leading-8 text-(--muted-foreground)">
          <li>
            {ar
              ? "• منصة التسويق: حملات واتساب وتلغرام وأتمتة الرسائل."
              : "• Marketing Platform: WhatsApp/Telegram campaigns and message automation."}
          </li>
          <li>
            {ar
              ? "• خدمات CRM: إدارة العملاء والمراحل البيعية للفرق الصغيرة."
              : "• CRM Services: customer and pipeline management for small teams."}
          </li>
          <li>
            {ar
              ? "• خدمات المحاسبة: فواتير، مصروفات، وتقارير مالية مبسطة."
              : "• Accounting Services: invoices, expenses, and simple financial reports."}
          </li>
          <li>
            {ar
              ? "• الاجتماعات والكلاسات الأونلاين: جلسات مباشرة وجدولة ومتابعة حضور."
              : "• Online Meetings & Virtual Classes: live sessions, scheduling, and attendance tracking."}
          </li>
          <li>
            {ar
              ? "• شبكة SBCClaw الذكية: ربط أدوات العمل بالأتمتة لتحسين الكفاءة."
              : "• SBCClaw Smart Network: connect tools with automation for better operations."}
          </li>
          <li>
            {ar
              ? "• SBC Smart Card: استخدم في أي مكان، اكسب نقاط، واصرف نقاط."
              : "• SBC Smart Card: use anywhere, earn points, spend points."}{" "}
            <Link href={`/${locale}/loyalty`} className="text-accent hover:underline">
              {ar ? "افتح الولاء" : "Open Loyalty"}
            </Link>
          </li>
          <li>
            {ar
              ? "• Website Builder: موقع أعمالك الجاهز للبيع."
              : "• Website Builder: launch a sales-ready website."}
          </li>
          <li>
            {ar
              ? "• Business Email: بريد احترافي باسم نشاطك."
              : "• Business Email: branded professional email."}
          </li>
          <li>
            {ar
              ? "• AI Agent Builder: أتمتة ذكية بدون كود."
              : "• AI Agent Builder: no-code intelligent automation."}
          </li>
        </ul>
      </section>

      <section className="mt-8 sbc-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold">{copy.sectionPackages}</h3>
        <p className="mt-2 text-base font-medium text-(--muted-foreground)">
          {ar
            ? "كل خدمة لها باقات شهرية و6 أشهر وسنوية. الهدف من كل باقة موضح أدناه لتختار الأنسب حسب مرحلة نشاطك."
            : "Each service offers monthly, 6-month, and yearly options. Use the guide below to choose what fits your current business stage."}
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sbc-card rounded-2xl p-5">
            <h4 className="font-semibold">{ar ? "منصة التسويق" : "Marketing Platform"}</h4>
            <p className="mt-2 text-base font-medium leading-8 text-(--muted-foreground)">
              {ar
                ? "مناسبة للحملات التسويقية وقنوات الرسائل. ابدأ بالخطة الشهرية للتجربة ثم انتقل إلى 6 أشهر أو سنوي لتكلفة أقل."
                : "Best for campaigns and messaging channels. Start monthly, then move to 6-month or yearly for better value."}
            </p>
          </div>
          <div className="sbc-card rounded-2xl p-5">
            <h4 className="font-semibold">{ar ? "خدمات CRM" : "CRM Services"}</h4>
            <p className="mt-2 text-base font-medium leading-8 text-(--muted-foreground)">
              {ar
                ? "مناسبة لإدارة العملاء والمراحل البيعية. مفيدة للشركات الصغيرة التي تريد تنظيم المتابعات اليومية."
                : "Built for customer management and sales pipeline control. Ideal for small businesses needing structured follow-ups."}
            </p>
          </div>
          <div className="sbc-card rounded-2xl p-5">
            <h4 className="font-semibold">{ar ? "خدمات المحاسبة" : "Accounting Services"}</h4>
            <p className="mt-2 text-base font-medium leading-8 text-(--muted-foreground)">
              {ar
                ? "مناسبة للفواتير والمصروفات والتقارير المالية. تساعدك على وضوح التدفق النقدي واتخاذ قرارات أدق."
                : "Designed for invoices, expenses, and financial summaries. Helps improve cash-flow visibility and decisions."}
            </p>
          </div>
          <div className="sbc-card rounded-2xl p-5">
            <h4 className="font-semibold">{ar ? "الاجتماعات والفصول الافتراضية" : "Online Meetings & Virtual Classes"}</h4>
            <p className="mt-2 text-base font-medium leading-8 text-(--muted-foreground)">
              {ar
                ? "مناسبة للمدربين والفرق التعليمية والاستشارات عبر الإنترنت، مع إدارة جلسات وحضور ومواعيد."
                : "Great for training teams, educators, and online consulting with session scheduling and attendance tracking."}
            </p>
          </div>
          <div className="sbc-card rounded-2xl p-5 sm:col-span-2">
            <h4 className="font-semibold">{ar ? "شبكة SBCClaw الذكية" : "SBCClaw Smart Network"}</h4>
            <p className="mt-2 text-base font-medium leading-8 text-(--muted-foreground)">
              {ar
                ? "مناسبة لربط الأنظمة والأدوات داخل نشاطك بالأتمتة الذكية لرفع الكفاءة وتقليل العمل اليدوي."
                : "Focused on smart integrations and automation across your internal tools to improve operations and reduce manual work."}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 text-sm font-medium text-(--muted-foreground)">
        {ar
          ? "الخدمات الجديدة فعّالة الآن في المتجر: CRM، المحاسبة، الاجتماعات والكلاسات الأونلاين، وشبكة SBCClaw الذكية."
          : "New services are now live in the store: CRM, Accounting, Online Meetings & Virtual Classes, and SBCClaw Smart Network."}
      </div>
    </PublicPage>
  );
}
