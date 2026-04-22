import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  HiOutlineArrowRight,
  HiOutlineChip,
  HiOutlineCode,
  HiOutlineCube,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineGift,
  HiOutlineGlobeAlt,
  HiOutlineLightBulb,
  HiOutlineSparkles,
} from "react-icons/hi";

import { PublicPage } from "@/components/PublicPage";
import { ServicesScrollLottie } from "@/components/ServicesScrollLottie";
import { DashboardCard } from "@/components/DashboardCard";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getProgramSubscriptionByUser,
  isProgramSubscriptionActive,
} from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

type Service = {
  number: string;
  title: string;
  description: string;
  technical: readonly [string, string];
  benefits: readonly [string, string];
  icon: IconType;
  theme: string;
  iconTone: string;
};

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

  const chevron = (
    <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
  );

  const copy = ar
    ? {
        companyBadge: "شركة سينيور بلوكتشين",
        companyTitle: "حلول برمجية، بلوكتشين، وذكاء اصطناعي.",
        companyDescription:
          "منتجات رقمية ذكية للشركات.",
        featuredLabel: "منتج الشركة",
        featuredTitle: "Smart Business Center",
        featuredDescription: "منصة موحدة لإدارة الأعمال.",
        featuredPoints: ["إدارة الخدمات", "عرض العملاء"],
        servicesEyebrow: "خدمات الشركة",
        servicesTitle: "خدماتنا.",
        servicesSubtitle: "ست خدمات متكاملة.",
        labelTech: "القدرات التقنية",
        labelBenefits: "الفوائد",
        platformEyebrow: "متاح الآن",
        platformTitle: "خدمات جاهزة للاستخدام.",
        platformSubtitle: "دليل الأعمال ونظام الولاء.",
        ctaPrimary: "ابدأ النمو الآن",
        ctaPrimaryActive: "ابدأ الآن",
        ctaDemo: "تواصل معنا",
        ctaHome: "العودة للرئيسية",
        sectionServices: "خدماتنا",
      }
    : {
        companyBadge: "Senior Blockchain Company",
        companyTitle: "Blockchain, AI & Software.",
        companyDescription: "Smart digital products for businesses.",
        featuredLabel: "Our Product",
        featuredTitle: "Smart Business Center",
        featuredDescription: "A unified platform for business.",
        featuredPoints: ["Service management", "Customer showcase"],
        servicesEyebrow: "Company Services",
        servicesTitle: "Our Services.",
        servicesSubtitle: "Six connected services.",
        labelTech: "Technical capabilities",
        labelBenefits: "Business benefits",
        platformEyebrow: "Available Now",
        platformTitle: "Ready-to-use Services.",
        platformSubtitle: "Business Directory and Loyalty System.",
        ctaPrimary: "Start Growing",
        ctaPrimaryActive: "Get Started",
        ctaDemo: "Contact Us",
        ctaHome: "Back to Home",
        sectionServices: "Our Services",
      };

  const services: readonly Service[] = ar
    ? [
        {
          number: "01",
          title: "البرمجة",
          description: "تطوير حلول برمجية متقدمة للشركات الحديثة.",
          technical: ["تطوير Full-Stack", "أنظمة Backend"],
          benefits: ["أداء أعلى", "حلول قابلة للتوسع"],
          icon: HiOutlineCode,
          theme:
            "from-sky-500/15 via-cyan-500/10 to-emerald-500/15 dark:from-sky-500/22 dark:via-cyan-500/16 dark:to-emerald-500/22",
          iconTone: "text-sky-600 dark:text-sky-300",
        },
        {
          number: "02",
          title: "تصميم المواقع",
          description: "مواقع حديثة وسريعة تعزز الحضور الرقمي.",
          technical: ["تصميم متجاوب", "تحسين السرعة"],
          benefits: ["زيادة التفاعل", "تحسين الظهور"],
          icon: HiOutlineDesktopComputer,
          theme:
            "from-amber-500/15 via-orange-500/10 to-rose-500/15 dark:from-amber-500/22 dark:via-orange-500/16 dark:to-rose-500/22",
          iconTone: "text-orange-600 dark:text-orange-300",
        },
        {
          number: "03",
          title: "تطبيقات الجوال",
          description: "تطبيقات جوال احترافية بتجربة سلسة على iOS و Android.",
          technical: ["تطوير متعدد المنصات", "أداء Native"],
          benefits: ["وصول أوسع", "تجربة متسقة"],
          icon: HiOutlineDeviceMobile,
          theme:
            "from-fuchsia-500/15 via-violet-500/10 to-indigo-500/15 dark:from-fuchsia-500/22 dark:via-violet-500/16 dark:to-indigo-500/22",
          iconTone: "text-violet-600 dark:text-violet-300",
        },
        {
          number: "04",
          title: "الاستشارات البرمجية",
          description: "استشارات ذكية للتحول الرقمي وتحسين العمليات.",
          technical: ["استراتيجية رقمية", "تحليل الأنظمة"],
          benefits: ["تقليل العمل اليدوي", "رفع الكفاءة"],
          icon: HiOutlineLightBulb,
          theme:
            "from-emerald-500/15 via-teal-500/10 to-cyan-500/15 dark:from-emerald-500/22 dark:via-teal-500/16 dark:to-cyan-500/22",
          iconTone: "text-emerald-600 dark:text-emerald-300",
        },
        {
          number: "05",
          title: "الذكاء الاصطناعي",
          description: "أنظمة ذكاء اصطناعي لتحسين القرار وأتمتة العمليات.",
          technical: ["تعلم الآلة", "معالجة اللغة الطبيعية"],
          benefits: ["أتمتة العمليات", "رؤى قائمة على البيانات"],
          icon: HiOutlineChip,
          theme:
            "from-rose-500/15 via-pink-500/10 to-fuchsia-500/15 dark:from-rose-500/22 dark:via-pink-500/16 dark:to-fuchsia-500/22",
          iconTone: "text-rose-600 dark:text-rose-300",
        },
        {
          number: "06",
          title: "تطوير البلوكتشين",
          description:
            "حلول بلوكتشين آمنة تشمل العقود الذكية والتطبيقات اللامركزية.",
          technical: ["العقود الذكية", "بروتوكولات DeFi"],
          benefits: ["أمان أعلى", "شفافية أكبر"],
          icon: HiOutlineCube,
          theme:
            "from-slate-500/15 via-zinc-500/10 to-neutral-500/15 dark:from-slate-500/22 dark:via-zinc-500/16 dark:to-neutral-500/22",
          iconTone: "text-slate-700 dark:text-slate-200",
        },
      ]
    : [
        {
          number: "01",
          title: "Programming",
          description:
            "Advanced software development for modern business systems.",
          technical: ["Full-Stack Development", "Backend Systems"],
          benefits: ["Enhanced Performance", "Scalable Solutions"],
          icon: HiOutlineCode,
          theme:
            "from-sky-500/15 via-cyan-500/10 to-emerald-500/15 dark:from-sky-500/22 dark:via-cyan-500/16 dark:to-emerald-500/22",
          iconTone: "text-sky-600 dark:text-sky-300",
        },
        {
          number: "02",
          title: "Website Design",
          description:
            "Modern, fast, and responsive websites for strong digital presence.",
          technical: ["Responsive Design", "Speed Optimization"],
          benefits: ["Increased Engagement", "Improved Rankings"],
          icon: HiOutlineDesktopComputer,
          theme:
            "from-amber-500/15 via-orange-500/10 to-rose-500/15 dark:from-amber-500/22 dark:via-orange-500/16 dark:to-rose-500/22",
          iconTone: "text-orange-600 dark:text-orange-300",
        },
        {
          number: "03",
          title: "Mobile Applications",
          description:
            "Professional mobile apps with smooth experience on iOS and Android.",
          technical: ["Cross-Platform Development", "Native Performance"],
          benefits: ["Wider Accessibility", "Consistent Experience"],
          icon: HiOutlineDeviceMobile,
          theme:
            "from-fuchsia-500/15 via-violet-500/10 to-indigo-500/15 dark:from-fuchsia-500/22 dark:via-violet-500/16 dark:to-indigo-500/22",
          iconTone: "text-violet-600 dark:text-violet-300",
        },
        {
          number: "04",
          title: "Software Consulting",
          description:
            "Smart consulting for digital transformation and process improvement.",
          technical: ["Digital Strategy", "System Analysis"],
          benefits: ["Reduced Manual Work", "Increased Efficiency"],
          icon: HiOutlineLightBulb,
          theme:
            "from-emerald-500/15 via-teal-500/10 to-cyan-500/15 dark:from-emerald-500/22 dark:via-teal-500/16 dark:to-cyan-500/22",
          iconTone: "text-emerald-600 dark:text-emerald-300",
        },
        {
          number: "05",
          title: "Artificial Intelligence",
          description:
            "AI systems that automate work and improve decision-making.",
          technical: ["Machine Learning", "Natural Language Processing"],
          benefits: ["Process Automation", "Data-Driven Insights"],
          icon: HiOutlineChip,
          theme:
            "from-rose-500/15 via-pink-500/10 to-fuchsia-500/15 dark:from-rose-500/22 dark:via-pink-500/16 dark:to-fuchsia-500/22",
          iconTone: "text-rose-600 dark:text-rose-300",
        },
        {
          number: "06",
          title: "Blockchain Development",
          description:
            "Secure blockchain solutions including smart contracts and decentralized apps.",
          technical: ["Smart Contracts", "DeFi Protocols"],
          benefits: ["Enhanced Security", "Transparency"],
          icon: HiOutlineCube,
          theme:
            "from-slate-500/15 via-zinc-500/10 to-neutral-500/15 dark:from-slate-500/22 dark:via-zinc-500/16 dark:to-neutral-500/22",
          iconTone: "text-slate-700 dark:text-slate-200",
        },
      ];

  const featuredCoreServices = [
    {
      icon: HiOutlineGift,
      title: ar ? "نظام الولاء" : "Loyalty System",
      desc: ar
        ? "نظام بسيط للنقاط وبطاقات العملاء."
        : "A simple way to manage points and customer cards.",
      href: `/${locale}/loyalty/staff`,
      hrefLabel: ar ? "دخول الموظفين" : "Staff Login",
      secondaryHref: `/${locale}/loyalty/customer-login`,
      secondaryHrefLabel: ar ? "دخول العملاء" : "Customer Login",
      iconWrap: "from-amber-300 via-rose-400 to-fuchsia-500",
      iconTone: "text-white",
      borderClassName: "border-rose-400/35 hover:border-fuchsia-500/50",
      glowColor: "rgba(244,63,94,0.16)",
    },
    {
      icon: HiOutlineGlobeAlt,
      title: ar ? "دليل الأعمال" : "Business Directory",
      desc: ar
        ? "اكتشف الأنشطة التجارية من مكان واحد."
        : "An easy place to discover businesses.",
      href: `/${locale}/businesses`,
      hrefLabel: ar ? "استعرض الأنشطة" : "Browse Businesses",
      iconWrap: "from-sky-300 via-cyan-400 to-emerald-500",
      iconTone: "text-white",
      borderClassName: "border-cyan-400/35 hover:border-emerald-500/50",
      glowColor: "rgba(6,182,212,0.16)",
    },
  ];

  return (
    <PublicPage>
      <section className="pt-6 sm:pt-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)] lg:items-center lg:gap-10">
          <div>
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)] sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {copy.companyBadge}
            </span>

            <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {copy.companyTitle}
            </h1>

            <p className="mt-2 text-sm text-[color:var(--muted-foreground)] sm:text-base">
              {copy.companyDescription}
            </p>
          </div>

          <div className="rounded-[1.25rem] border border-[color:var(--surface-border)] p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)] sm:text-[11px]">
              {copy.featuredLabel}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              {copy.featuredTitle}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              {copy.featuredDescription}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {copy.featuredPoints.map((point) => (
                <span
                  key={point}
                  className="rounded-full border border-[color:var(--surface-border)] px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  {point}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 sm:mt-6">
        <ServicesScrollLottie className="max-w-[320px] sm:max-w-[420px] lg:max-w-[480px]" />
      </section>

      <section className="mt-10 sm:mt-14">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)] sm:text-[11px]">
            {copy.servicesEyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            {copy.servicesTitle}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)] sm:text-base">
            {copy.servicesSubtitle}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <DashboardCard
                key={service.title}
                borderClassName="border-[color:var(--surface-border)] hover:border-foreground/25"
                glowColor="rgba(15,23,42,0.10)"
                noShadow
                className={`group relative flex flex-col rounded-[1.25rem] bg-linear-to-br ${service.theme} p-5 sm:rounded-[1.5rem] sm:p-6`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--surface-border)] bg-background/70 shadow-sm sm:h-12 sm:w-12 ${service.iconTone}`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                  <span className="text-xs font-bold tracking-[0.22em] text-foreground/55">
                    {service.number}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-foreground sm:mt-5 sm:text-xl">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {service.description}
                </p>

                <div className="mt-5 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                      {copy.labelTech}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {service.technical.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-[color:var(--surface-border)] bg-background/60 px-2.5 py-1 text-[11px] font-medium text-foreground"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                      {copy.labelBenefits}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {service.benefits.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-sm text-foreground/85"
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full bg-current ${service.iconTone}`}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </DashboardCard>
            );
          })}
        </div>
      </section>

      <section className="mt-12 sm:mt-16">
        <div className="max-w-3xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)] sm:text-[11px]">
            {copy.platformEyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {copy.platformTitle}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)] sm:text-base">
            {copy.platformSubtitle}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {user && isActive ? (
            <Link
              href={`/${locale}/services/app`}
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className:
                  "w-full justify-center sm:w-auto sm:min-w-[180px] !shadow-none hover:!shadow-none",
              })}
            >
              {copy.ctaPrimaryActive}
              {chevron}
            </Link>
          ) : (
            <Link
              href={`/${locale}/store`}
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                className:
                  "w-full justify-center sm:w-auto sm:min-w-[180px] !shadow-none hover:!shadow-none",
              })}
            >
              {copy.ctaPrimary}
              {chevron}
            </Link>
          )}
          <Link
            href={`/${locale}/contact`}
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className:
                "w-full justify-center sm:w-auto sm:min-w-[180px] !shadow-none hover:!shadow-none",
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
              className:
                "w-full justify-center sm:w-auto sm:min-w-[180px] !shadow-none hover:!shadow-none",
            })}
          >
            <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "" : "rotate-180")} />
            {copy.ctaHome}
          </Link>
        </div>
      </section>

      <section className="mt-10 sm:mt-12">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {copy.sectionServices}
        </h2>

        <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
          {featuredCoreServices.map((service) => {
            const Icon = service.icon;
            return (
              <DashboardCard
                key={service.title}
                borderClassName={service.borderClassName}
                glowColor={service.glowColor}
                noShadow
                className="rounded-[1.5rem] p-5 sm:rounded-3xl sm:p-8"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br sm:h-24 sm:w-24 sm:rounded-3xl ${service.iconWrap}`}
                    >
                      <Icon
                        className={`h-8 w-8 sm:h-14 sm:w-14 ${service.iconTone}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold leading-tight tracking-tight sm:text-2xl">
                        {service.title}
                      </h3>
                      <p className="mt-1.5 text-sm font-medium leading-6 text-[color:var(--muted-foreground)] sm:mt-2 sm:text-base sm:leading-7">
                        {service.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-col lg:min-w-[240px] lg:gap-3">
                    <Link
                      href={service.href}
                      className={buttonVariants({
                        variant: "primary",
                        size: "lg",
                        className:
                          "w-full justify-center sm:flex-1 lg:flex-none !shadow-none hover:!shadow-none",
                      })}
                    >
                      {service.hrefLabel}
                      {chevron}
                    </Link>
                    {service.secondaryHref ? (
                      <Link
                        href={service.secondaryHref}
                        className={buttonVariants({
                          variant: "primary",
                          size: "lg",
                          className:
                            "w-full justify-center sm:flex-1 lg:flex-none !shadow-none hover:!shadow-none",
                        })}
                      >
                        {service.secondaryHrefLabel}
                        {chevron}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </DashboardCard>
            );
          })}
        </div>
      </section>
    </PublicPage>
  );
}
