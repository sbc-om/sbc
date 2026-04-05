import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiArrowUpRight,
  HiCheckBadge,
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCpuChip,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMegaphone,
  HiOutlineShoppingBag,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { DashboardCard } from "@/components/DashboardCard";
import { cn } from "@/lib/cn";
import { requireUser } from "@/lib/auth/requireUser";
import { hasActiveSubscription, listProgramSubscriptionsByUser } from "@/lib/db/subscriptions";
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

  const ar = locale === "ar";
  const user = await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);
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
      subtitle: ar ? "خلّي العملاء يكتشفون نشاطك بسهولة" : "Get discovered by nearby customers",
      Icon: HiOutlineBuildingOffice2,
      iconClassName: "text-indigo-600 dark:text-indigo-300",
      iconBgClassName: "bg-indigo-500/12 ring-1 ring-indigo-500/18",
      borderClassName: "border-indigo-500/25 dark:border-indigo-400/25",
      glowColor: "rgba(99,102,241,0.15)",
    },
    loyalty: {
      title: ar ? "نظام الولاء" : "Loyalty System",
      href: `/${locale}/loyalty/manage`,
      storeHref: `/${locale}/store?q=loyalty`,
      subtitle: ar ? "زيد تكرار الشراء بالنقاط والمكافآت" : "Bring customers back with points",
      Icon: HiOutlineSparkles,
      iconClassName: "text-emerald-600 dark:text-emerald-300",
      iconBgClassName: "bg-emerald-500/12 ring-1 ring-emerald-500/18",
      borderClassName: "border-emerald-500/25 dark:border-emerald-400/25",
      glowColor: "rgba(16,185,129,0.14)",
    },
    marketing: {
      title: ar ? "منصة التسويق" : "Marketing Platform",
      href: `/${locale}/services/app`,
      storeHref: `/${locale}/store?q=marketing`,
      subtitle: ar ? "تواصل مع العملاء وشغّل الحملات تلقائياً" : "Talk to customers, automate campaigns",
      Icon: HiOutlineMegaphone,
      iconClassName: "text-fuchsia-600 dark:text-fuchsia-300",
      iconBgClassName: "bg-fuchsia-500/12 ring-1 ring-fuchsia-500/18",
      borderClassName: "border-fuchsia-500/25 dark:border-fuchsia-400/25",
      glowColor: "rgba(217,70,239,0.14)",
    },
    crm: {
      title: ar ? "خدمات CRM" : "CRM Services",
      href: `/${locale}/services/app`,
      storeHref: `/${locale}/store?q=crm`,
      subtitle: ar ? "إدارة عملائك للشركات الصغيرة بطريقة أبسط" : "Customer management for small businesses",
      Icon: HiOutlineUserGroup,
      iconClassName: "text-sky-600 dark:text-sky-300",
      iconBgClassName: "bg-sky-500/12 ring-1 ring-sky-500/18",
      borderClassName: "border-sky-500/25 dark:border-sky-400/25",
      glowColor: "rgba(14,165,233,0.14)",
    },
    accounting: {
      title: ar ? "خدمات المحاسبة" : "Accounting Services",
      href: `/${locale}/services/app`,
      storeHref: `/${locale}/store?q=accounting`,
      subtitle: ar ? "فواتير ومصاريف وتقارير مالية للشركات الصغيرة" : "Billing and finance tools for small businesses",
      Icon: HiOutlineBanknotes,
      iconClassName: "text-lime-600 dark:text-lime-300",
      iconBgClassName: "bg-lime-500/12 ring-1 ring-lime-500/18",
      borderClassName: "border-lime-500/25 dark:border-lime-400/25",
      glowColor: "rgba(132,204,22,0.15)",
    },
    "online-classes": {
      title: ar ? "الاجتماعات والفصول الافتراضية" : "Online Meetings & Virtual Classes",
      href: `/${locale}/services/app`,
      storeHref: `/${locale}/store?q=online-classes`,
      subtitle: ar ? "تشغيل الاجتماعات والدروس عبر الإنترنت من لوحة واحدة" : "Run online meetings and virtual classes from one hub",
      Icon: HiOutlineChatBubbleLeftRight,
      iconClassName: "text-teal-600 dark:text-teal-300",
      iconBgClassName: "bg-teal-500/12 ring-1 ring-teal-500/18",
      borderClassName: "border-teal-500/25 dark:border-teal-400/25",
      glowColor: "rgba(20,184,166,0.15)",
    },
    sbcclaw: {
      title: ar ? "شبكة SBCClaw الذكية" : "SBCClaw Smart Network",
      href: `/${locale}/services/app`,
      storeHref: `/${locale}/store?q=sbcclaw`,
      subtitle: ar ? "خدمات الشبكة والأتمتة الذكية للأعمال" : "Smart business networking and automation services",
      Icon: HiOutlineWrenchScrewdriver,
      iconClassName: "text-rose-600 dark:text-rose-300",
      iconBgClassName: "bg-rose-500/12 ring-1 ring-rose-500/18",
      borderClassName: "border-rose-500/25 dark:border-rose-400/25",
      glowColor: "rgba(244,63,94,0.14)",
    },
    website: {
      title: ar ? "منشئ المواقع" : "Website Builder",
      href: `/${locale}/dashboard/websites`,
      storeHref: `/${locale}/store?q=website`,
      subtitle: ar ? "حوّل الزيارات إلى عملاء محتملين 24/7" : "Turn traffic into leads 24/7",
      Icon: HiOutlineGlobeAlt,
      iconClassName: "text-cyan-600 dark:text-cyan-300",
      iconBgClassName: "bg-cyan-500/12 ring-1 ring-cyan-500/18",
      borderClassName: "border-cyan-500/25 dark:border-cyan-400/25",
      glowColor: "rgba(6,182,212,0.15)",
    },
    email: {
      title: ar ? "البريد المؤسسي" : "Business Email",
      href: `/${locale}/email/manage`,
      storeHref: `/${locale}/store?q=email`,
      subtitle: ar ? "ابنِ الثقة ببريد رسمي باسم نشاطك" : "Build trust with branded email",
      Icon: HiOutlineEnvelope,
      iconClassName: "text-orange-600 dark:text-orange-300",
      iconBgClassName: "bg-orange-500/12 ring-1 ring-orange-500/18",
      borderClassName: "border-orange-500/25 dark:border-orange-400/25",
      glowColor: "rgba(249,115,22,0.14)",
    },
    "agent-builder": {
      title: ar ? "منشئ الوكيل الذكي" : "AI Agent Builder",
      href: `/${locale}/ai`,
      storeHref: `/${locale}/store?q=agent-builder`,
      subtitle: ar ? "أتمتة المهام اليومية بدون تعقيد" : "Automate daily work with AI",
      Icon: HiOutlineCpuChip,
      iconClassName: "text-violet-600 dark:text-violet-300",
      iconBgClassName: "bg-violet-500/12 ring-1 ring-violet-500/18",
      borderClassName: "border-violet-500/25 dark:border-violet-400/25",
      glowColor: "rgba(139,92,246,0.14)",
    },
  } as const;

  const cards = await Promise.all(
    (Object.keys(programMeta) as Array<keyof typeof programMeta>).map(async (programId) => {
      const meta = programMeta[programId];
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

      return {
        programId,
        meta,
        sub,
        active,
        daysLeft,
        planLabel,
      };
    }),
  );

  const hiddenProgramIds = new Set([
    "marketing",
    "crm",
    "accounting",
    "online-classes",
    "sbcclaw",
    "website",
    "email",
    "agent-builder",
  ]);

  const visibleCards = cards.filter((card) => !hiddenProgramIds.has(card.programId));

  const totalPrograms = visibleCards.length;
  const activePrograms = visibleCards.filter((card) => card.active).length;
  const purchasedPrograms = visibleCards.filter((card) => card.sub !== null).length;
  const expiringSoon = visibleCards.filter((card) => card.active && card.sub !== null && card.daysLeft <= 14).length;
  const nextRenewal = [...visibleCards]
    .filter((card) => card.active && card.sub !== null)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0];

  return (
    <AppPage className="pt-3 sm:pt-5">
      <div className="[&_.sbc-chip]:!border-0">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-(--surface)/95 p-4 shadow-(--shadow) backdrop-blur-sm sm:p-6 lg:p-8 dark:border-cyan-400/20">
        <div className="pointer-events-none absolute -start-20 -top-24 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -end-28 -bottom-28 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {dict.nav.dashboard}
              </h1>
              <p className="mt-2 text-sm text-(--muted-foreground) sm:text-base">
                {ar ? "مرحباً" : "Welcome"}: <span className="break-all font-semibold text-foreground">{user.email}</span>
              </p>
              <p className="mt-3 max-w-3xl text-sm text-(--muted-foreground) sm:text-base">
                {ar
                  ? "تحكم بكل خدمات نشاطك من شاشة واحدة: اكتشاف العملاء، الولاء، التسويق، CRM، المحاسبة، الاجتماعات الافتراضية، شبكة SBCClaw، الموقع الإلكتروني، البريد المؤسسي، والذكاء الاصطناعي."
                  : "Manage your full business stack in one place: discovery, loyalty, marketing, CRM, accounting, online classes, SBCClaw smart networking, website, business email, and AI automation."}
              </p>
              <p className="mt-3 text-sm font-medium text-(--muted-foreground)">
                {nextRenewal
                  ? ar
                    ? `أقرب تجديد: ${nextRenewal.meta.title} خلال ${nextRenewal.daysLeft} يوم`
                    : `Next renewal: ${nextRenewal.meta.title} in ${nextRenewal.daysLeft} day${nextRenewal.daysLeft === 1 ? "" : "s"}`
                  : ar
                    ? "لا يوجد اشتراك فعّال حالياً"
                    : "No active subscriptions yet"}
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
              <Link
                href={`/${locale}/store`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-(--accent-foreground) shadow-(--shadow) hover:brightness-[1.04]"
              >
                {ar ? "متجر الخطط" : "Plans"}
                <HiOutlineShoppingBag className="h-4 w-4" />
              </Link>

              {user.role === "admin" ? (
                <Link
                  href={`/${locale}/admin`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-(--chip-bg) px-4 py-2.5 text-sm font-semibold text-foreground shadow-(--shadow) hover:bg-(--surface-hover)"
                >
                  {dict.nav.admin}
                  <HiArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <div className="rounded-2xl bg-(--background)/55 p-3 sm:p-4">
              <p className="text-xs font-medium text-(--muted-foreground) sm:text-sm">{ar ? "إجمالي البرامج" : "Total Programs"}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{totalPrograms}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-3 sm:p-4">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-200 sm:text-sm">{ar ? "برامج فعّالة" : "Active Programs"}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-200 sm:text-2xl">
                {activePrograms}
              </p>
            </div>
            <div className="rounded-2xl bg-(--background)/55 p-3 sm:p-4">
              <p className="text-xs font-medium text-(--muted-foreground) sm:text-sm">{ar ? "برامج مشتراة" : "Purchased Plans"}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{purchasedPrograms}</p>
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-3 sm:p-4">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-200 sm:text-sm">{ar ? "تنتهي قريباً" : "Expiring Soon"}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-amber-700 dark:text-amber-200 sm:text-2xl">
                {expiringSoon}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {ar ? "برامجك وخططك" : "Programs & Plans"}
          </h2>
          <p className="text-sm text-(--muted-foreground)">
            {ar
              ? "افتح أي برنامج مباشرة أو قم بالترقية من المتجر."
              : "Open each program directly or upgrade from the store."}
          </p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full bg-(--chip-bg) px-3 py-1 text-xs font-semibold text-(--muted-foreground)">
          {ar ? `فعال ${activePrograms} من ${totalPrograms}` : `${activePrograms} of ${totalPrograms} active`}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {visibleCards.map((card, index) => {
          const statusLabel = card.active ? (ar ? "مفعل" : "Active") : ar ? "غير مفعل" : "Inactive";
          const remainingLabel = card.active
            ? ar
              ? `${card.daysLeft} يوم`
              : `${card.daysLeft} day${card.daysLeft === 1 ? "" : "s"}`
            : ar
              ? "منتهي"
              : "Expired";

          const renewalToneClass = !card.sub
            ? "text-(--muted-foreground)"
            : !card.active
              ? "text-rose-600 dark:text-rose-300"
              : card.daysLeft <= 7
                ? "text-rose-600 dark:text-rose-300"
                : card.daysLeft <= 21
                  ? "text-amber-600 dark:text-amber-300"
                  : "text-emerald-600 dark:text-emerald-300";

          const renewalText = !card.sub
            ? ar
              ? "غير مشتراة"
              : "Not purchased"
            : !card.active
              ? ar
                ? "منتهي"
                : "Expired"
              : card.daysLeft <= 7
                ? ar
                  ? "تجديد عاجل"
                  : "Urgent renewal"
                : card.daysLeft <= 21
                  ? ar
                    ? "قريباً"
                    : "Due soon"
                  : ar
                    ? "مستقر"
                    : "Healthy";

          const renewalProgress = !card.sub
            ? 0
            : !card.active
              ? 100
              : Math.min(100, Math.max(8, Math.round((card.daysLeft / 45) * 100)));

          return (
            <DashboardCard
              key={card.programId}
              borderClassName={card.meta.borderClassName}
              glowColor={card.meta.glowColor}
              className="animate-in fade-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset sm:h-14 sm:w-14",
                        card.meta.iconBgClassName,
                        card.active ? "" : "opacity-75",
                      )}
                      aria-hidden
                    >
                      <card.meta.Icon className={cn("h-7 w-7 sm:h-8 sm:w-8", card.meta.iconClassName)} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{card.meta.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-(--muted-foreground) sm:text-base">{card.meta.subtitle}</p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "sbc-chip inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold sm:text-sm",
                      card.active ? "text-foreground" : "text-(--muted-foreground)",
                    )}
                  >
                    {card.active ? <HiCheckBadge className="h-4 w-4 text-emerald-600 dark:text-emerald-300" /> : null}
                    {statusLabel}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="sbc-chip min-h-11 w-full justify-between rounded-xl px-3 py-2 text-sm overflow-hidden">
                    <span className="shrink-0 text-(--muted-foreground)">{ar ? "الخطة" : "Plan"}:</span>
                    <span className="min-w-0 flex-1 truncate whitespace-nowrap text-end font-semibold text-foreground">
                      {card.planLabel}
                    </span>
                  </span>

                  <span className="sbc-chip min-h-11 w-full justify-between rounded-xl px-3 py-2 text-sm">
                    <span className="shrink-0 text-(--muted-foreground)">{ar ? "ينتهي" : "Expires"}:</span>
                    <span className="text-end font-semibold text-foreground">
                      {card.sub ? formatDate(card.sub.expiresAt) : ar ? "غير مشتراة" : "Not purchased"}
                    </span>
                  </span>

                  <span className="sbc-chip min-h-11 w-full justify-between rounded-xl px-3 py-2 text-sm">
                    <span className="shrink-0 text-(--muted-foreground)">{ar ? "المتبقي" : "Remaining"}:</span>
                    <span className="text-end font-semibold text-foreground">{remainingLabel}</span>
                  </span>
                </div>

                <div className="rounded-2xl bg-(--background)/45 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <span className="font-medium text-(--muted-foreground)">
                      {ar ? "حالة التجديد" : "Renewal Status"}
                    </span>
                    <span className={cn("font-semibold", renewalToneClass)}>{renewalText}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-(--chip-bg)">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        !card.sub
                          ? "bg-(--surface-border)"
                          : !card.active || card.daysLeft <= 7
                            ? "bg-rose-500/80"
                            : card.daysLeft <= 21
                              ? "bg-amber-500/80"
                              : "bg-emerald-500/80",
                      )}
                      style={{ width: `${renewalProgress}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={card.active ? card.meta.href : card.meta.storeHref}
                    className={cn(
                      "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
                      card.active
                        ? "bg-accent text-(--accent-foreground)"
                        : "bg-(--chip-bg) text-foreground hover:bg-(--surface-hover)",
                    )}
                  >
                    {card.active ? (ar ? "فتح" : "Open") : ar ? "اشترك" : "Subscribe"}
                    {card.active ? <HiArrowUpRight className="h-4 w-4" /> : <HiOutlineShoppingBag className="h-4 w-4" />}
                  </Link>

                  <Link
                    href={card.meta.storeHref}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-(--chip-bg) px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-(--surface-hover)"
                  >
                    {ar ? "ترقية" : "Upgrade"}
                    <HiArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </DashboardCard>
          );
        })}
      </div>
      </div>
    </AppPage>
  );
}
