import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiArrowUpRight,
  HiCheckBadge,
  HiOutlineBuildingOffice2,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMegaphone,
  HiOutlineSparkles,
  HiOutlineShoppingBag,
  HiXCircle,
} from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { DashboardCard } from "@/components/DashboardCard";
import { requireUser } from "@/lib/auth/requireUser";
import { listProgramSubscriptionsByUser, hasActiveSubscription } from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getStoreProductText, listStoreProducts } from "@/lib/store/products";

export const runtime = "nodejs";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const ar = locale === "ar";
  const subscriptions = await listProgramSubscriptionsByUser(user.id);
  const products = await listStoreProducts();

  const df = new Intl.DateTimeFormat(ar ? "ar-OM" : "en-OM", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return df.format(d);
  };

  const remainingDays = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - new Date().getTime();
    if (!Number.isFinite(ms)) return 0;
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  const programMeta = {
    directory: {
      title: ar ? "دليل الأعمال" : "Business Directory",
      href: `/${locale}/directory`,
      storeHref: `/${locale}/store?q=directory`,
      subtitle: ar ? "العضوية والظهور" : "Membership & visibility",
      Icon: HiOutlineBuildingOffice2,
      iconClassName: "text-indigo-600 dark:text-indigo-300",
      iconBgClassName: "bg-indigo-500/12 ring-1 ring-indigo-500/18",
      borderClassName: "border-indigo-500/25 dark:border-indigo-400/25",
      glowColor: "rgba(99,102,241,0.12)",
    },
    loyalty: {
      title: ar ? "نظام الولاء" : "Loyalty System",
      href: `/${locale}/loyalty/manage`,
      storeHref: `/${locale}/store?q=loyalty`,
      subtitle: ar ? "العملاء والنقاط" : "Customers & points",
      Icon: HiOutlineSparkles,
      iconClassName: "text-emerald-600 dark:text-emerald-300",
      iconBgClassName: "bg-emerald-500/12 ring-1 ring-emerald-500/18",
      borderClassName: "border-emerald-500/25 dark:border-emerald-400/25",
      glowColor: "rgba(16,185,129,0.12)",
    },
    marketing: {
      title: ar ? "منصة التسويق" : "Marketing Platform",
      href: `/${locale}/marketing-platform/app`,
      storeHref: `/${locale}/store?q=marketing`,
      subtitle: ar ? "الرسائل والحملات" : "Messages & campaigns",
      Icon: HiOutlineMegaphone,
      iconClassName: "text-fuchsia-600 dark:text-fuchsia-300",
      iconBgClassName: "bg-fuchsia-500/12 ring-1 ring-fuchsia-500/18",
      borderClassName: "border-fuchsia-500/25 dark:border-fuchsia-400/25",
      glowColor: "rgba(217,70,239,0.12)",
    },
    website: {
      title: ar ? "منشئ المواقع" : "Website Builder",
      href: `/${locale}/dashboard/websites`,
      storeHref: `/${locale}/store?q=website`,
      subtitle: ar ? "صمم موقعك الخاص" : "Design your own website",
      Icon: HiOutlineGlobeAlt,
      iconClassName: "text-cyan-600 dark:text-cyan-300",
      iconBgClassName: "bg-cyan-500/12 ring-1 ring-cyan-500/18",
      borderClassName: "border-cyan-500/25 dark:border-cyan-400/25",
      glowColor: "rgba(6,182,212,0.12)",
    },
    email: {
      title: ar ? "البريد المؤسسي" : "Business Email",
      href: `/${locale}/email/manage`,
      storeHref: `/${locale}/store?q=email`,
      subtitle: ar ? "بريد إلكتروني بدامنتك الخاصة" : "Email with your own domain",
      Icon: HiOutlineEnvelope,
      iconClassName: "text-orange-600 dark:text-orange-300",
      iconBgClassName: "bg-orange-500/12 ring-1 ring-orange-500/18",
      borderClassName: "border-orange-500/25 dark:border-orange-400/25",
      glowColor: "rgba(249,115,22,0.12)",
    },
  } as const;

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.nav.dashboard}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "مرحباً" : "Welcome"}: <span className="font-medium">{user.email}</span>
          </p>
        </div>

        {user.role === "admin" ? (
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-(--muted-foreground) hover:text-foreground"
          >
            <HiArrowUpRight className="h-4 w-4" />
            {dict.nav.admin}
          </Link>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {await Promise.all((Object.keys(programMeta) as Array<keyof typeof programMeta>).map(async (programId) => {
          const meta = programMeta[programId];
          const isMarketingDisabled = false;
          const sub = subscriptions.find((s) => s.program === programId) ?? null;
          const active = await hasActiveSubscription(user.id, programId);
          const daysLeft = sub ? remainingDays(sub.expiresAt) : 0;

          const product = sub
            ? products.find((p) => p.program === programId && p.plan === sub.plan) ?? null
            : null;

          const planLabel = product
            ? getStoreProductText(product, locale as Locale).name
            : sub
              ? sub.plan
              : ar
                ? "غير مفعل"
                : "Not active";

          const statusLabel = active
            ? ar
              ? "مفعل"
              : "Active"
            : ar
              ? "غير مفعل"
              : "Inactive";

          return (
            <DashboardCard
              key={programId}
              borderClassName={meta.borderClassName}
              glowColor={meta.glowColor}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className={
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl " +
                      meta.iconBgClassName +
                      (active ? "" : " opacity-75")
                    }
                    aria-hidden
                  >
                    <meta.Icon className={"h-8 w-8 " + meta.iconClassName} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold tracking-tight">{meta.title}</h2>
                    <p className="mt-1 line-clamp-1 text-sm text-(--muted-foreground)">{meta.subtitle}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={
                      "sbc-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold " +
                      (active ? "text-foreground" : "text-(--muted-foreground)")
                    }
                  >
                    {active ? (
                      <HiCheckBadge className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                    ) : null}
                    {statusLabel}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="sbc-chip rounded-full px-3 py-1">
                    <span className="text-(--muted-foreground)">{ar ? "الخطة" : "Plan"}: </span>
                    <span className="font-semibold">{planLabel}</span>
                  </span>

                  {sub ? (
                    <>
                      <span className="sbc-chip rounded-full px-3 py-1">
                        <span className="text-(--muted-foreground)">{ar ? "الانتهاء" : "Expires"}: </span>
                        <span className="font-semibold">{formatDate(sub.expiresAt)}</span>
                      </span>
                      <span className="sbc-chip rounded-full px-3 py-1">
                        <span className="text-(--muted-foreground)">{ar ? "المتبقي" : "Remaining"}: </span>
                        <span className="font-semibold">
                          {active
                            ? ar
                              ? `${daysLeft} يوم`
                              : `${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                            : ar
                              ? "منتهي"
                              : "Expired"}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="text-(--muted-foreground)">
                      {ar ? "غير مشتراة" : "Not purchased"}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={active ? meta.href : meta.storeHref}
                  className={
                    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold " +
                    (active
                      ? "bg-accent text-(--accent-foreground)"
                      : "bg-(--chip-bg) text-foreground")
                  }
                >
                  {active ? (ar ? "فتح" : "Open") : (ar ? "اشترك" : "Subscribe")}
                  {active ? (
                    <HiArrowUpRight className="h-4 w-4" />
                  ) : (
                    <HiOutlineShoppingBag className="h-4 w-4" />
                  )}
                </Link>

                <Link
                  href={meta.storeHref}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-(--muted-foreground) hover:text-foreground"
                >
                  {ar ? "ترقية" : "Upgrade"}
                  <HiArrowUpRight className="h-4 w-4" />
                </Link>
                </div>
              </div>
            </DashboardCard>
          );
        }))}
      </div>
    </AppPage>
  );
}
