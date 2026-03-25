import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HiOutlineBanknotes,
  HiOutlineBuildingOffice2,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCpuChip,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMegaphone,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineWrenchScrewdriver,
  HiCheckCircle,
} from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { DashboardCard } from "@/components/DashboardCard";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import {
  formatStorePrice,
  getStoreProductText,
  listStoreProducts,
} from "@/lib/store/products";

export const runtime = "nodejs";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const user = await getCurrentUser();

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const products = (await listStoreProducts()).filter((p) => {
    if (!q) return true;
    const t = getStoreProductText(p, locale as Locale);
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  });

  const groups = {
    directory: products.filter((p) => p.program === "directory"),
    loyalty: products.filter((p) => p.program === "loyalty"),
    marketing: products.filter((p) => p.program === "marketing"),
    crm: products.filter((p) => p.program === "crm"),
    accounting: products.filter((p) => p.program === "accounting"),
    "online-classes": products.filter((p) => p.program === "online-classes"),
    sbcclaw: products.filter((p) => p.program === "sbcclaw"),
    website: products.filter((p) => p.program === "website"),
    email: products.filter((p) => p.program === "email"),
    "agent-builder": products.filter((p) => p.program === "agent-builder"),
  };

  const ar = locale === "ar";
  const Wrapper = user ? AppPage : PublicPage;
  const detailsCtaClass =
    "h-10 w-full rounded-xl border border-(--surface-border) bg-(--background)/55 px-3 text-sm font-semibold text-foreground transition-colors hover:border-(--accent)/45 hover:bg-(--chip-bg)";
  const primaryCtaClass =
    "h-10 w-full rounded-xl border border-transparent bg-(--accent) px-3 text-sm font-semibold text-(--accent-foreground) transition-[filter,opacity] hover:brightness-110";

  return (
    <Wrapper>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {dict.nav.store}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {ar
              ? "اختر حزم وخدمات تساعدك على تطوير نشاطك داخل منصة SBC — جميع الأسعار بالريال العُماني (OMR)."
              : "Pick products and add-ons to grow your business on SBC — all prices in Omani Rial (OMR)."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!user ? (
            <>
              <Link
                href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/store`)}`}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                {dict.nav.login}
              </Link>
              <Link
                href={`/${locale}/register?next=${encodeURIComponent(`/${locale}/store`)}`}
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                {dict.nav.register}
              </Link>
            </>
          ) : (
            <Link
              href={`/${locale}/dashboard`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {dict.nav.dashboard}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6">
        <form method="GET" action={`/${locale}/store`}>
          <div className="sbc-card rounded-2xl p-4 !border-0">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-(--muted-foreground)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder={ar ? "ابحث عن منتج..." : "Search products..."}
                className="flex-1 bg-transparent outline-none"
              />
              {q ? (
                <Link
                  href={`/${locale}/store`}
                  className={buttonVariants({ variant: "ghost", size: "xs" })}
                >
                  {ar ? "مسح" : "Clear"}
                </Link>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {ar ? "لا توجد نتائج." : "No results."}
        </div>
      ) : (
        <div className="mt-8 grid gap-10">
          {(
            [
              {
                key: "directory" as const,
                title: ar ? "عضوية دليل الأعمال" : "Business Directory",
                subtitle: ar ? "اختر حزمة العضوية والإظهار." : "Pick your membership & visibility package.",
                Icon: HiOutlineBuildingOffice2,
                iconClassName: "text-indigo-600 dark:text-indigo-300",
                iconBgClassName: "bg-indigo-500/12",
                borderClassName: "border-indigo-500/25 dark:border-indigo-400/25",
                glowColor: "rgba(99,102,241,0.15)",
              },
              {
                key: "loyalty" as const,
                title: ar ? "نظام الولاء" : "Loyalty System",
                subtitle: ar ? "اشتراكات شهرية/6 أشهر/سنوية." : "Monthly / 6 months / yearly subscriptions.",
                Icon: HiOutlineSparkles,
                iconClassName: "text-emerald-600 dark:text-emerald-300",
                iconBgClassName: "bg-emerald-500/12",
                borderClassName: "border-emerald-500/25 dark:border-emerald-400/25",
                glowColor: "rgba(16,185,129,0.14)",
              },
              {
                key: "marketing" as const,
                title: ar ? "منصة التسويق" : "Marketing Platform",
                subtitle: ar ? "اشتراكات شهرية/6 أشهر/سنوية." : "Monthly / 6 months / yearly subscriptions.",
                Icon: HiOutlineMegaphone,
                iconClassName: "text-fuchsia-600 dark:text-fuchsia-300",
                iconBgClassName: "bg-fuchsia-500/12",
                borderClassName: "border-fuchsia-500/25 dark:border-fuchsia-400/25",
                glowColor: "rgba(217,70,239,0.14)",
              },
              {
                key: "crm" as const,
                title: ar ? "خدمات CRM" : "CRM Services",
                subtitle: ar ? "مناسبة للشركات الصغيرة." : "Built for small businesses.",
                Icon: HiOutlineUserGroup,
                iconClassName: "text-sky-600 dark:text-sky-300",
                iconBgClassName: "bg-sky-500/12",
                borderClassName: "border-sky-500/25 dark:border-sky-400/25",
                glowColor: "rgba(14,165,233,0.14)",
              },
              {
                key: "accounting" as const,
                title: ar ? "خدمات المحاسبة" : "Accounting Services",
                subtitle: ar ? "مناسبة للشركات الصغيرة." : "Built for small businesses.",
                Icon: HiOutlineBanknotes,
                iconClassName: "text-lime-600 dark:text-lime-300",
                iconBgClassName: "bg-lime-500/12",
                borderClassName: "border-lime-500/25 dark:border-lime-400/25",
                glowColor: "rgba(132,204,22,0.15)",
              },
              {
                key: "online-classes" as const,
                title: ar ? "الاجتماعات والفصول الافتراضية" : "Online Meetings & Virtual Classes",
                subtitle: ar ? "خدمات الاجتماعات والدروس عن بُعد." : "Online sessions and class services.",
                Icon: HiOutlineChatBubbleLeftRight,
                iconClassName: "text-teal-600 dark:text-teal-300",
                iconBgClassName: "bg-teal-500/12",
                borderClassName: "border-teal-500/25 dark:border-teal-400/25",
                glowColor: "rgba(20,184,166,0.14)",
              },
              {
                key: "sbcclaw" as const,
                title: ar ? "شبكة SBCClaw الذكية" : "SBCClaw Smart Network",
                subtitle: ar ? "خدمات الشبكة والأتمتة الذكية للأعمال." : "Smart business networking and automation.",
                Icon: HiOutlineWrenchScrewdriver,
                iconClassName: "text-rose-600 dark:text-rose-300",
                iconBgClassName: "bg-rose-500/12",
                borderClassName: "border-rose-500/25 dark:border-rose-400/25",
                glowColor: "rgba(244,63,94,0.14)",
              },
              {
                key: "website" as const,
                title: ar ? "منشئ المواقع" : "Website Builder",
                subtitle: ar ? "صمم موقعك الخاص بدامنه مخصص." : "Build your own website with a custom domain.",
                Icon: HiOutlineGlobeAlt,
                iconClassName: "text-cyan-600 dark:text-cyan-300",
                iconBgClassName: "bg-cyan-500/12",
                borderClassName: "border-cyan-500/25 dark:border-cyan-400/25",
                glowColor: "rgba(6,182,212,0.14)",
              },
              {
                key: "email" as const,
                title: ar ? "البريد المؤسسي" : "Business Email",
                subtitle: ar ? "بريد إلكتروني باسم نطاقك الخاص." : "Professional email with your own domain.",
                Icon: HiOutlineEnvelope,
                iconClassName: "text-orange-600 dark:text-orange-300",
                iconBgClassName: "bg-orange-500/12",
                borderClassName: "border-orange-500/25 dark:border-orange-400/25",
                glowColor: "rgba(249,115,22,0.14)",
              },
              {
                key: "agent-builder" as const,
                title: ar ? "منشئ الوكيل الذكي" : "AI Agent Builder",
                subtitle: ar ? "أنشئ وكيلاً ذكياً لنشاطك التجاري بدون برمجة." : "Build smart AI agents for your business — no code required.",
                Icon: HiOutlineCpuChip,
                iconClassName: "text-violet-600 dark:text-violet-300",
                iconBgClassName: "bg-violet-500/12",
                borderClassName: "border-violet-500/25 dark:border-violet-400/25",
                glowColor: "rgba(139,92,246,0.14)",
              },
            ] as const
          ).map((section) => {
            const items = groups[section.key];
            if (items.length === 0) return null;
            return (
              <section key={section.key}>
                <div className="flex items-start gap-4">
                  <div
                    className={
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl " +
                      section.iconBgClassName
                    }
                  >
                    <section.Icon className={"h-7 w-7 " + section.iconClassName} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
                    </div>
                    <p className="mt-1 text-sm text-(--muted-foreground)">{section.subtitle}</p>
                  </div>
                </div>

                <div className="mt-5 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => {
                    const t = getStoreProductText(p, locale as Locale);
                    return (
                      <DashboardCard
                        key={p.slug}
                        borderClassName={section.borderClassName}
                        glowColor={section.glowColor}
                        className="!rounded-2xl !border-2 !p-0"
                      >
                      <div
                        className="relative flex h-full flex-col p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-base font-semibold leading-snug">{t.name}</h3>
                            <div className="mt-1 text-lg font-bold text-(--accent)">
                              {formatStorePrice(p.price, locale as Locale)}
                            </div>
                          </div>

                          {p.badges?.length ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {p.badges.slice(0, 2).map((b) => (
                                <span
                                  key={b}
                                  className="rounded-full bg-(--chip-bg) px-2.5 py-1 text-xs font-semibold text-foreground"
                                >
                                  {b}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-3 flex-1">
                          <p className="text-sm leading-relaxed text-(--muted-foreground)">
                            {t.description}
                          </p>

                          <ul className="mt-4 grid gap-2 text-sm">
                            {t.features.slice(0, 4).map((f) => (
                              <li key={f} className="flex items-start gap-2">
                                <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                                <span className="text-(--muted-foreground)">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-auto pt-6">
                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              href={`/${locale}/store/${p.slug}`}
                              className={buttonVariants({ variant: "secondary", size: "sm", className: detailsCtaClass })}
                            >
                              {ar ? "التفاصيل" : "Details"}
                            </Link>
                            {user ? (
                              <AddToCartButton
                                productSlug={p.slug}
                                locale={locale as Locale}
                                className={primaryCtaClass}
                              />
                            ) : (
                              <Link
                                href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/store`)}`}
                                className={buttonVariants({ variant: "primary", size: "sm", className: primaryCtaClass })}
                              >
                                {ar ? dict.nav.login : "Login to add"}
                              </Link>
                            )}
                          </div>

                          <div className="mt-3 text-xs text-(--muted-foreground)">
                            {ar
                              ? "ملاحظة: الدفع الحقيقي سيتم ربطه لاحقاً."
                              : "Note: real payments will be integrated later."}
                          </div>
                        </div>
                      </div>
                      </DashboardCard>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Wrapper>
  );
}
