import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { PublicPage } from "@/components/PublicPage";
import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  defaultLoyaltySettings,
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
  listLoyaltyCustomersByUser,
} from "@/lib/db/loyalty";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";

import { LoyaltyProfileClient } from "./LoyaltyProfileClient";
import { LoyaltySettingsClient } from "./LoyaltySettingsClient";
import { LoyaltyMessagesClient } from "./LoyaltyMessagesClient";

export const runtime = "nodejs";

export default async function LoyaltyManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const sp = await searchParams;
  const success = sp.success === "1";

  const ar = locale === "ar";
  const user = await getCurrentUser();

  // Build an absolute origin for shareable URLs (used by a Client Component).
  // Doing this on the server avoids hydration mismatches from `window.location`.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const baseUrl = host ? `${proto}://${host}` : null;

  const isActive = user ? await isProgramSubscriptionActive(user.id) : false;
  const customers = user && isActive ? await listLoyaltyCustomersByUser(user.id) : [];
  const profile = user && isActive ? await getLoyaltyProfileByUserId(user.id) : null;
  const settings = user && isActive
    ? ((await getLoyaltySettingsByUserId(user.id)) ?? defaultLoyaltySettings(user.id))
    : null;

  const Wrapper = user ? AppPage : PublicPage;

  return (
    <Wrapper>
      <div className="relative overflow-hidden rounded-3xl border border-(--surface-border) bg-(--surface) p-7 sm:p-8">
        <div
          className="absolute inset-0 -z-10 opacity-80"
          style={{
            background:
              "radial-gradient(900px circle at 20% 0%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(900px circle at 85% 10%, rgba(14,165,233,0.16), transparent 55%)",
          }}
        />

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {ar ? "بطاقة الولاء" : "Loyalty Card"}
            </h1>
            <p className="mt-2 text-base text-(--muted-foreground)">
              {ar
                ? "إدارة العملاء والنقاط من مكان واحد. لوحة تحكم بسيطة وسريعة."
                : "Manage customers and loyalty points with elegance and efficiency."}
            </p>
            <div className="mt-3">
              <Link
                href={`/${locale}/loyalty`}
                className="text-sm font-medium text-accent hover:underline"
              >
                {ar ? "صفحة التعريف بالمنتج" : "Product overview"}
              </Link>
            </div>
          </div>
          <Link href={`/${locale}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {ar ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </div>
      </div>

      {success ? (
        <div className="mt-6 sbc-card rounded-2xl p-5">
          <div className="font-semibold">{ar ? "تم تفعيل الاشتراك" : "Subscription activated"}</div>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "يمكنك الآن إضافة العملاء وإصدار بطاقات الولاء."
              : "You can now add customers and issue loyalty cards."}
          </p>
        </div>
      ) : null}

      {!user ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="font-semibold">{ar ? "إدارة الولاء" : "Manage loyalty"}</div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar ? "سجّل الدخول لإدارة العملاء والنقاط." : "Login to manage customers and points."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/loyalty/manage`)}`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "تسجيل الدخول" : "Login"}
            </Link>
            <Link
              href={`/${locale}/register?next=${encodeURIComponent(`/${locale}/loyalty/manage`)}`}
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              {ar ? "إنشاء حساب" : "Create account"}
            </Link>
          </div>
        </div>
      ) : null}

      {/* Management */}
      {user && isActive ? (
        <>
          <LoyaltyProfileClient locale={locale as Locale} initialProfile={profile} baseUrl={baseUrl} />

          {settings ? (
            <LoyaltySettingsClient
              locale={locale as Locale}
              initialSettings={settings}
              profile={profile ? { businessName: profile.businessName, logoUrl: profile.logoUrl, joinCode: profile.joinCode } : null}
            />
          ) : null}

          <LoyaltyMessagesClient locale={locale as Locale} />

          <div className="mt-8 sbc-card rounded-2xl p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{ar ? "تصميم البطاقة" : "Card Design"}</h3>
                <p className="mt-1 text-sm text-(--muted-foreground)">
                  {ar
                    ? "خصص شكل وألوان بطاقة الولاء الخاصة بك."
                    : "Customize the look and colors of your loyalty card."}
                </p>
              </div>

              <Link
                href={`/${locale}/loyalty/manage/design`}
                className={buttonVariants({ variant: "primary", size: "md" })}
              >
                {ar ? "تعديل التصميم" : "Edit Design"}
              </Link>
            </div>
          </div>

          <div className="mt-8 sbc-card rounded-2xl p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{ar ? "العملاء" : "Customers"}</h3>
                <p className="mt-1 text-sm text-(--muted-foreground)">
                  {ar
                    ? "اعرض العملاء، ابحث برقم الهاتف، وامسح QR لإيجاد العميل بسرعة."
                    : "View customers, search by phone, and scan QR codes for fast lookup."}
                </p>
              </div>

              <Link
                href={`/${locale}/loyalty/manage/customers`}
                className={buttonVariants({ variant: "primary", size: "md" })}
              >
                {ar ? "إدارة العملاء" : "Manage customers"}
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
                <div className="text-xs text-(--muted-foreground)">{ar ? "الإجمالي" : "Total"}</div>
                <div className="mt-1 text-2xl font-semibold">{customers.length}</div>
              </div>
              <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
                <div className="text-xs text-(--muted-foreground)">{ar ? "الاسم" : "Business name"}</div>
                <div className="mt-1 truncate text-sm font-semibold">{profile?.businessName ?? (ar ? "—" : "—")}</div>
              </div>
              <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
                <div className="text-xs text-(--muted-foreground)">{ar ? "الكود" : "Join code"}</div>
                <div className="mt-1 font-mono text-sm">{profile?.joinCode ?? (ar ? "—" : "—")}</div>
              </div>
            </div>

            {profile?.joinCode && (
              <div className="mt-4 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                <div className="text-sm font-semibold mb-2">
                  {ar ? "صفحة البحث العامة" : "Public Lookup Page"}
                </div>
                <p className="text-xs text-(--muted-foreground) mb-3">
                  {ar
                    ? "شارك هذا الرابط مع موظفيك للبحث السريع عن العملاء بالهاتف وعرض QR والباركود."
                    : "Share this link with your staff for quick customer phone lookup with QR and barcode display."}
                </p>
                <Link
                  href={`/${locale}/loyalty/lookup/${profile.joinCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  {ar ? "فتح صفحة البحث" : "Open Lookup Page"} →
                </Link>
              </div>
            )}
          </div>
        </>
      ) : null}

      {user && !isActive ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="font-semibold">{ar ? "الاشتراك غير مفعل" : "Subscription not active"}</div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "تفعيل الاشتراك يتم من خلال المتجر. بعد التفعيل ستظهر أدوات إدارة العملاء وإصدار البطاقات هنا."
              : "Activation is handled in the Store. After activation, customer management tools will appear here."}
          </p>
          <div className="mt-4">
            <Link href={`/${locale}/store`} className={buttonVariants({ variant: "primary", size: "md" })}>
              {ar ? "فتح المتجر" : "Open store"}
            </Link>
          </div>
        </div>
      ) : null}
    </Wrapper>
  );
}
