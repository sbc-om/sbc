import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import {
  defaultLoyaltySettings,
  getLoyaltyCardById,
  getLoyaltyCustomerById,
  listLoyaltyMessagesForCustomer,
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
} from "@/lib/db/loyalty";
import { LoyaltyPointsIcons } from "@/components/loyalty/LoyaltyPointsIcons";
import { LoyaltyPushOptIn } from "@/components/loyalty/LoyaltyPushOptIn";

import { CardQrClient } from "./CardQrClient";

export const runtime = "nodejs";

export default async function LoyaltyCardPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ joined?: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const sp = await searchParams;
  const joined = String(sp.joined || "") === "1";

  await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const card = getLoyaltyCardById(id);
  if (!card || card.status !== "active") notFound();

  const customer = getLoyaltyCustomerById(card.customerId);
  const profile = getLoyaltyProfileByUserId(card.userId);
  const settings = getLoyaltySettingsByUserId(card.userId) ?? defaultLoyaltySettings(card.userId);

  const messages = listLoyaltyMessagesForCustomer({
    userId: card.userId,
    customerId: card.customerId,
    limit: 10,
  });

  const pointsIconUrl =
    settings.pointsIconMode === "custom" ? settings.pointsIconUrl : profile?.logoUrl;

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {ar ? "بطاقة الولاء" : "Loyalty Card"}
          </h1>
          <p className="mt-2 text-base text-(--muted-foreground)">
            {ar
              ? "اعرض نقاطك الحالية لدى هذا النشاط." 
              : "View your current points with this business."}
          </p>
        </div>
        <Link
          href={`/${locale}/loyalty`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "صفحة المنتج" : "Product page"}
        </Link>
      </div>

      <div className="mt-8 sbc-card rounded-2xl p-8 text-center">
        {profile ? (
          <div
            className={
              "mx-auto mb-6 flex max-w-md items-center gap-3 rounded-2xl border border-(--surface-border) bg-(--surface) p-3 " +
              (ar ? "flex-row-reverse text-right" : "text-left")
            }
          >
            {profile.logoUrl ? (
              <Image
                src={profile.logoUrl}
                alt={profile.businessName}
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-xl border border-(--surface-border) bg-(--surface) object-cover"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-xl border border-(--surface-border) bg-(--surface)" />
            )}
            <div className="min-w-0">
              <div className="text-xs text-(--muted-foreground)">{ar ? "النشاط" : "Business"}</div>
              <div className="truncate text-sm font-semibold">{profile.businessName}</div>
            </div>
          </div>
        ) : null}

        <div className="text-sm text-(--muted-foreground)">
          {customer?.fullName ? (ar ? "العميل" : "Customer") : (ar ? "بطاقة" : "Card")}
        </div>
        {customer?.fullName ? (
          <div className="mt-1 text-xl font-semibold">{customer.fullName}</div>
        ) : null}

        <div className="mt-6 text-sm text-(--muted-foreground)">{ar ? "النقاط" : "Points"}</div>
        <div className="mt-2 text-5xl font-bold bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
          {card.points}
        </div>

        <div className="mt-5">
          <LoyaltyPointsIcons points={card.points} iconUrl={pointsIconUrl} maxIcons={80} />
        </div>

        <div className="mt-4 text-xs text-(--muted-foreground)">
          {ar
            ? `الاستخدام: الحد الأدنى ${settings.pointsRequiredPerRedemption} نقطة (يتم خصم ${settings.pointsDeductPerRedemption} نقطة لكل مرة).`
            : `Redemption: min ${settings.pointsRequiredPerRedemption} points (deduct ${settings.pointsDeductPerRedemption} per use).`}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href={`/api/loyalty/wallet/apple/${encodeURIComponent(card.id)}`}
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            {ar ? "إضافة إلى Apple Wallet" : "Add to Apple Wallet"}
          </a>
          <a
            href={`/api/loyalty/wallet/google/${encodeURIComponent(card.id)}`}
            className={buttonVariants({ variant: "secondary", size: "md" })}
          >
            {ar ? "إضافة إلى Google Wallet" : "Add to Google Wallet"}
          </a>
        </div>

        <LoyaltyPushOptIn
          cardId={card.id}
          businessName={profile?.businessName ?? null}
          dir={ar ? "rtl" : "ltr"}
          autoEnableIfGranted={joined}
        />

        {profile?.location ? (
          <div className="mt-4 text-xs text-(--muted-foreground)">
            {ar
              ? "معلومة: تم إعداد موقع النشاط. عند تفعيل Wallet، يمكن تنبيه العميل تلقائياً عند الاقتراب من المتجر."
              : "Tip: This business has a configured location. With Wallet enabled, customers can get an automatic alert when near the store."}
          </div>
        ) : (
          <div className="mt-4 text-xs text-(--muted-foreground)">
            {ar
              ? "معلومة: صاحب النشاط يمكنه إضافة موقع المتجر لتفعيل تنبيهات قرب الموقع داخل Wallet." 
              : "Tip: The business can set a store location to enable location-based Wallet alerts."}
          </div>
        )}

        <CardQrClient locale={locale as Locale} customerId={card.customerId} />

        {messages.length ? (
          <div className={"mt-8 rounded-2xl border border-(--surface-border) bg-(--surface) p-5 " + (ar ? "text-right" : "text-left")}
          >
            <div className="text-sm font-semibold">{ar ? "الرسائل" : "Messages"}</div>
            <div className="mt-3 grid gap-3">
              {messages.map((m) => (
                <div key={m.id} className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className={"flex items-start justify-between gap-3 " + (ar ? "flex-row-reverse" : "")}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{m.title}</div>
                      <div className="mt-1 text-sm text-(--muted-foreground)">{m.body}</div>
                    </div>
                    <div className="shrink-0 text-xs text-(--muted-foreground)">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PublicPage>
  );
}
