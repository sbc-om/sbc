import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getLoyaltyProfileByUserId, listLoyaltyCustomersByUser } from "@/lib/db/loyalty";
import { getProgramSubscriptionByUser, isProgramSubscriptionActive } from "@/lib/db/subscriptions";

import { addLoyaltyCustomerAction } from "../../actions";
import { CustomersClient } from "./CustomersClient";

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

  const programSub = getProgramSubscriptionByUser(user.id, "loyalty");
  const isActive = isProgramSubscriptionActive(programSub);
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

  const profile = getLoyaltyProfileByUserId(user.id);
  const customers = listLoyaltyCustomersByUser(user.id);

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {ar ? "العملاء" : "Customers"}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {ar
              ? "بحث سريع برقم الهاتف/الاسم، وفتح صفحة العميل لإضافة النقاط عبر QR."
              : "Fast search by phone/name, and open a customer page to add points via QR."}
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

      <div className="mt-8 sbc-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold">{ar ? "إضافة عميل" : "Add customer"}</div>
            <div className="mt-1 text-sm text-(--muted-foreground)">
              {ar
                ? "رقم الهاتف إلزامي لسهولة البحث لاحقاً."
                : "Phone is required for quick lookup later."}
            </div>
          </div>
        </div>

        <form action={addLoyaltyCustomerAction.bind(null, locale as Locale)} className="mt-5 grid gap-4">
          <input type="hidden" name="returnTo" value={`/${locale}/loyalty/manage/customers`} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="fullName" placeholder={ar ? "اسم العميل" : "Customer full name"} required />
            <Input name="phone" placeholder={ar ? "الهاتف" : "Phone"} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="email" placeholder={ar ? "البريد (اختياري)" : "Email (optional)"} />
            <Input name="tags" placeholder={ar ? "وسوم (قريباً)" : "Tags (soon)"} disabled />
          </div>
          <Input name="notes" placeholder={ar ? "ملاحظات (اختياري)" : "Notes (optional)"} />

          <div className="flex justify-end">
            <button className={buttonVariants({ variant: "primary", size: "md" })} type="submit">
              {ar ? "إضافة" : "Add"}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">{ar ? "قائمة العملاء" : "Customer list"}</div>
          <div className="text-sm text-(--muted-foreground)">{customers.length} {ar ? "عميل" : "customers"}</div>
        </div>

        <div className="mt-4">
          <CustomersClient
            locale={locale as Locale}
            customers={customers}
            initialQuery={sp.q}
          />
        </div>
      </div>
    </PublicPage>
  );
}
