import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineArrowRight,
  HiOutlineGlobeAlt,
  HiOutlineGift,
  HiOutlineSparkles,
} from "react-icons/hi";

import { PublicPage } from "@/components/PublicPage";
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
    title: ar ? "الخدمات المتاحة الآن" : "Services You Can Use Now",
    subtitle: ar
      ? "حالياً نركّز على خدمتين فقط: دليل الأعمال ونظام الولاء."
      : "Right now, we're focused on two things: Business Directory and Loyalty System.",
    ctaPrimary: ar ? "ابدأ الآن" : "Get Started",
    ctaDemo: ar ? "تواصل معنا" : "Contact Us",
    ctaHome: ar ? "العودة للرئيسية" : "Back to Home",
    sectionServices: ar ? "الخدمات" : "Our Services",
  };

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
                className: "min-w-[180px] !shadow-none hover:!shadow-none",
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
                className: "min-w-[180px] !shadow-none hover:!shadow-none",
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
              className: "min-w-[180px] !shadow-none hover:!shadow-none",
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
              className: "min-w-[180px] !shadow-none hover:!shadow-none",
            })}
          >
            <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "" : "rotate-180")} />
            {copy.ctaHome}
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">{copy.sectionServices}</h2>
        <div className="mt-5 space-y-4">
          {featuredCoreServices.map((service) => {
            const Icon = service.icon;
            return (
              <DashboardCard
                key={service.title}
                borderClassName={service.borderClassName}
                glowColor={service.glowColor}
                noShadow
                className="rounded-3xl p-6 sm:p-8"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div
                      className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-linear-to-br ${service.iconWrap}`}
                    >
                      <Icon className={`h-16 w-16 ${service.iconTone}`} />
                    </div>
                    <div className="max-w-3xl">
                      <h3 className="text-2xl font-semibold leading-tight tracking-tight">{service.title}</h3>
                      <p className="mt-2 text-base font-medium leading-7 text-(--muted-foreground)">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[240px]">
                    <Link
                      href={service.href}
                      className={buttonVariants({
                        variant: "primary",
                        size: "lg",
                        className: "w-full justify-center !shadow-none hover:!shadow-none",
                      })}
                    >
                      {service.hrefLabel}
                      <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
                    </Link>
                    {service.secondaryHref ? (
                      <Link
                        href={service.secondaryHref}
                        className={buttonVariants({
                          variant: "primary",
                          size: "lg",
                          className: "w-full justify-center !shadow-none hover:!shadow-none",
                        })}
                      >
                        {service.secondaryHrefLabel}
                        <HiOutlineArrowRight className={"h-5 w-5 " + (ar ? "rotate-180" : "")} />
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
