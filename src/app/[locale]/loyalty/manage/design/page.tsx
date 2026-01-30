import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  defaultLoyaltySettings,
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
} from "@/lib/db/loyalty";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import { LoyaltyCardDesigner } from "@/components/loyalty/LoyaltyCardDesigner";

export const runtime = "nodejs";

export default async function LoyaltyCardDesignPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const ar = locale === "ar";
  const user = await getCurrentUser();

  const isActive = user ? await isProgramSubscriptionActive(user.id) : false;
  const profile = user && isActive ? await getLoyaltyProfileByUserId(user.id) : null;
  const settings = user && isActive
    ? ((await getLoyaltySettingsByUserId(user.id)) ?? defaultLoyaltySettings(user.id))
    : null;

  return (
    <PublicPage>
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
              {ar ? "تصميم بطاقة الولاء" : "Loyalty Card Design"}
            </h1>
            <p className="mt-2 text-base text-(--muted-foreground)">
              {ar
                ? "خصص شكل وألوان بطاقة الولاء الخاصة بك."
                : "Customize the look and colors of your loyalty card."}
            </p>
          </div>
          <Link 
            href={`/${locale}/loyalty/manage`} 
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {ar ? "العودة" : "Back"}
          </Link>
        </div>
      </div>

      {!user ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="font-semibold">{ar ? "تسجيل الدخول مطلوب" : "Login required"}</div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar 
              ? "سجّل الدخول لتعديل تصميم البطاقة." 
              : "Login to customize your card design."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/loyalty/manage/design`)}`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              {ar ? "تسجيل الدخول" : "Login"}
            </Link>
          </div>
        </div>
      ) : null}

      {user && !isActive ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="font-semibold">{ar ? "الاشتراك غير مفعل" : "Subscription not active"}</div>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "تفعيل الاشتراك يتم من خلال المتجر."
              : "Activation is handled in the Store."}
          </p>
          <div className="mt-4">
            <Link href={`/${locale}/store`} className={buttonVariants({ variant: "primary", size: "md" })}>
              {ar ? "فتح المتجر" : "Open store"}
            </Link>
          </div>
        </div>
      ) : null}

      {user && isActive && settings ? (
        <LoyaltyCardDesigner
          locale={locale as Locale}
          businessName={profile?.businessName ?? ""}
          logoUrl={profile?.logoUrl}
          initialDesign={settings?.cardDesign}
          initialWallet={{
            walletPassDescription: settings?.walletPassDescription,
            walletPassTerms: settings?.walletPassTerms,
            walletWebsiteUrl: settings?.walletWebsiteUrl,
            walletSupportEmail: settings?.walletSupportEmail,
            walletSupportPhone: settings?.walletSupportPhone,
            walletAddress: settings?.walletAddress,
            walletBarcodeFormat: settings?.walletBarcodeFormat,
            walletBarcodeMessage: settings?.walletBarcodeMessage,
            walletNotificationTitle: settings?.walletNotificationTitle,
            walletNotificationBody: settings?.walletNotificationBody,
          }}
        />
      ) : null}
    </PublicPage>
  );
}
