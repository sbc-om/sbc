import Link from "next/link";
import { notFound } from "next/navigation";

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
      <PublicPage>
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
      </PublicPage>
    );
  }

  const isActive = await isProgramSubscriptionActive(user.id);
  if (!isActive) {
    return (
      <PublicPage>
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
      </PublicPage>
    );
  }

  const profile = await getLoyaltyProfileByUserId(user.id);
  const customers = await listLoyaltyCustomersByUser(user.id);

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {ar ? "العملاء" : "Customers"}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {ar
              ? "بحث سريع برقم الهاتف/الاسم، وتعديل النقاط مباشرة من القائمة بدون فتح صفحة العميل."
              : "Fast search by phone/name, and adjust points directly from the list (no need to open the customer page)."}
          </p>
          {profile?.businessName ? (
            <div className="mt-3 text-sm text-(--muted-foreground)">
              {ar ? "النشاط" : "Business"}: <span className="font-semibold text-foreground">{profile.businessName}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link href={`/${locale}/loyalty/manage`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {ar ? "رجوع" : "Back"}
          </Link>
        </div>
      </div>

      {sp.error === "PHONE_REQUIRED" ? (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-300">
          {ar ? "رقم الهاتف مطلوب." : "Phone number is required."}
        </div>
      ) : null}

      <AddCustomerPanel
        ar={ar}
        returnTo={`/${locale}/loyalty/manage/customers`}
        action={addLoyaltyCustomerAction.bind(null, locale as Locale)}
      />

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="font-semibold">{ar ? "قائمة العملاء" : "Customer list"}</div>
          <div className="text-sm text-(--muted-foreground)">
            {customers.length} {ar ? (customers.length === 1 ? "عميل" : customers.length === 2 ? "عميلان" : "عملاء") : (customers.length === 1 ? "customer" : "customers")}
          </div>
        </div>

        <CustomersClient
            locale={locale as Locale}
            customers={customers}
            initialQuery={sp.q}
          />
      </div>
    </PublicPage>
  );
}
