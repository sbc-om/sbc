import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getLoyaltyProfileByUserId, listLoyaltyCustomersByUser } from "@/lib/db/loyalty";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";

import { addLoyaltyCustomerAction } from "../../actions";
import { CustomersClient } from "./CustomersClient";
import { AddCustomerPanel } from "./AddCustomerPanel";

export const runtime = "nodejs";

export default async function LoyaltyManageCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const sp = await searchParams;
  const ar = locale === "ar";

  const user = await getCurrentUser();
  if (!user) {
    return (
      <PublicPage compactTop>
        <div className="[&_.sbc-card]:!border-0">
          <div className="sbc-card rounded-2xl p-6">
          <div className="font-semibold">{ar ? "إدارة العملاء" : "Manage customers"}</div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar ? "سجّل الدخول لإدارة العملاء." : "Login to manage customers."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/loyalty/manage/customers`)}`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "تسجيل الدخول" : "Login"}
            </Link>
            <Link
              href={`/${locale}/register?next=${encodeURIComponent(`/${locale}/loyalty/manage/customers`)}`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {ar ? "إنشاء حساب" : "Create account"}
            </Link>
          </div>
          </div>
        </div>
      </PublicPage>
    );
  }

  const isActive = await isProgramSubscriptionActive(user.id);
  if (!isActive) {
    return (
      <PublicPage compactTop>
        <div className="[&_.sbc-card]:!border-0">
          <div className="sbc-card rounded-2xl p-6">
          <div className="font-semibold">{ar ? "الاشتراك غير مفعل" : "Subscription not active"}</div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "بعد تفعيل الاشتراك ستتمكن من إدارة العملاء هنا."
              : "After activation you will be able to manage customers here."}
          </p>
          <div className="mt-4">
            <Link href={`/${locale}/store`} className={buttonVariants({ variant: "primary", size: "md" })}>
              {ar ? "فتح المتجر" : "Open store"}
            </Link>
          </div>
          </div>
        </div>
      </PublicPage>
    );
  }

  const profile = await getLoyaltyProfileByUserId(user.id);
  const customers = await listLoyaltyCustomersByUser(user.id);

  return (
    <AppPage>
      <div className="space-y-6 [@media(max-width:640px)]:space-y-5 [&_.sbc-card]:!border-0">
        <section className="relative overflow-hidden rounded-[1.8rem] bg-(--surface) p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-7">
          <div
            className="absolute inset-0 -z-10 opacity-90"
            style={{
              background:
                "radial-gradient(900px circle at 12% 0%, rgba(14,165,233,0.18), transparent 50%), radial-gradient(860px circle at 100% 8%, rgba(59,130,246,0.16), transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0))",
            }}
          />

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-[2.1rem]">
                {ar ? "العملاء" : "Customers"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-(--muted-foreground) sm:text-base">
                {ar
                  ? "إدارة العملاء أصبحت أوضح وأسرع: ابحث بالاسم أو الهاتف، عدّل النقاط فوراً، وافتح البطاقة العامة أو صفحة العميل من نفس المكان."
                  : "A clearer, faster customer workspace: search by name or phone, adjust points instantly, and open the public card or customer record from one place."}
              </p>
            </div>

            <Link href={`/${locale}/loyalty/manage`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {ar ? "رجوع" : "Back"}
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_12px_28px_rgba(15,23,42,0.06)] dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] uppercase tracking-[0.18em] text-(--muted-foreground)">{ar ? "الإجمالي" : "Total"}</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{customers.length}</div>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_12px_28px_rgba(15,23,42,0.06)] dark:bg-white/5 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_rgba(0,0,0,0.18)]">
              <div className="text-[11px] uppercase tracking-[0.18em] text-(--muted-foreground)">{ar ? "النشاط" : "Business"}</div>
              <div className="mt-2 truncate text-sm font-semibold text-foreground sm:text-base">{profile?.businessName ?? "—"}</div>
            </div>
          </div>
        </section>

        {sp.error === "PHONE_REQUIRED" ? (
          <div className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-700 shadow-[0_16px_35px_rgba(239,68,68,0.12)] dark:text-red-300">
            {ar ? "رقم الهاتف مطلوب." : "Phone number is required."}
          </div>
        ) : null}

        <AddCustomerPanel
          ar={ar}
          returnTo={`/${locale}/loyalty/manage/customers`}
          action={addLoyaltyCustomerAction.bind(null, locale as Locale)}
        />

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{ar ? "قائمة العملاء" : "Customer list"}</h2>
              <p className="mt-1 text-sm text-(--muted-foreground)">
                {ar
                  ? "كل عميل يظهر مع هاتفه ونقاطه والإجراءات السريعة في بطاقة واضحة ومريحة على الجوال."
                  : "Each customer appears with phone, points, and quick actions in a clearer mobile-friendly card."}
              </p>
            </div>
            <div className="text-sm text-(--muted-foreground)">
              {customers.length} {ar ? (customers.length === 1 ? "عميل" : customers.length === 2 ? "عميلان" : "عملاء") : (customers.length === 1 ? "customer" : "customers")}
            </div>
          </div>

          <CustomersClient
            locale={locale as Locale}
            customers={customers}
            initialQuery={sp.q}
          />
        </section>
      </div>
    </AppPage>
  );
}
