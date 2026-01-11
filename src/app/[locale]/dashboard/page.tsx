import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { listProgramSubscriptionsByUser, isProgramSubscriptionActive } from "@/lib/db/subscriptions";
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
  const subscriptions = listProgramSubscriptionsByUser(user.id);
  const products = listStoreProducts();

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
      subtitle: ar ? "عضوية وإظهار في الرئيسية" : "Membership & homepage visibility",
    },
    loyalty: {
      title: ar ? "نظام الولاء" : "Loyalty System",
      href: `/${locale}/loyalty/manage`,
      storeHref: `/${locale}/store?q=loyalty`,
      subtitle: ar ? "اشتراك لإدارة العملاء والنقاط" : "Subscription for customers & points",
    },
    marketing: {
      title: ar ? "منصة التسويق" : "Marketing Platform",
      href: `/${locale}/marketing-platform/app`,
      storeHref: `/${locale}/store?q=marketing`,
      subtitle: ar ? "أدوات رسائل وحملات" : "Messaging tools & campaigns",
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
            className="text-sm font-medium text-(--muted-foreground) hover:text-foreground"
          >
            {dict.nav.admin}
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {(Object.keys(programMeta) as Array<keyof typeof programMeta>).map((programId) => {
          const meta = programMeta[programId];
          const sub = subscriptions.find((s) => s.program === programId) ?? null;
          const active = isProgramSubscriptionActive(sub);
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

          return (
            <section key={programId} className="sbc-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">{meta.title}</h2>
                  <p className="mt-1 text-sm text-(--muted-foreground)">{meta.subtitle}</p>
                </div>

                <span
                  className={
                    "rounded-full px-2.5 py-1 text-xs font-medium " +
                    (active
                      ? "bg-(--chip-bg) text-foreground"
                      : "bg-(--chip-bg) text-(--muted-foreground)")
                  }
                >
                  {active ? (ar ? "مفعل" : "Active") : (ar ? "غير مفعل" : "Inactive")}
                </span>
              </div>

              <div className="mt-5 grid gap-2 text-sm">
                <div>
                  <span className="text-(--muted-foreground)">{ar ? "الباقة" : "Plan"}: </span>
                  <span className="font-medium">{planLabel}</span>
                </div>

                {sub ? (
                  <>
                    <div>
                      <span className="text-(--muted-foreground)">{ar ? "تاريخ البدء" : "Started"}: </span>
                      <span className="font-medium">{formatDate(sub.startedAt)}</span>
                    </div>
                    <div>
                      <span className="text-(--muted-foreground)">{ar ? "ينتهي" : "Expires"}: </span>
                      <span className="font-medium">{formatDate(sub.expiresAt)}</span>
                    </div>
                    <div>
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
                    </div>
                  </>
                ) : (
                  <div className="text-(--muted-foreground)">
                    {ar
                      ? "لم تقم بشراء أي باقة لهذا البرنامج بعد."
                      : "You haven't purchased a package for this program yet."}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={active ? meta.href : meta.storeHref}
                  className={
                    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold " +
                    (active
                      ? "bg-accent text-(--accent-foreground)"
                      : "bg-(--chip-bg) text-foreground")
                  }
                >
                  {active ? (ar ? "الدخول" : "Enter") : (ar ? "شراء" : "Buy")}
                </Link>
                <Link
                  href={meta.storeHref}
                  className="text-sm font-medium text-(--muted-foreground) hover:text-foreground"
                >
                  {ar ? "ترقية/تمديد" : "Upgrade / extend"}
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </AppPage>
  );
}
