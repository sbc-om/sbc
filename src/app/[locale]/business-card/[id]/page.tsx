import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { AppleWalletButton } from "@/components/business/AppleWalletButton";
import { getBusinessCardById } from "@/lib/db/businessCards";
import { getBusinessById } from "@/lib/db/businesses";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { BusinessCardQrClient } from "./BusinessCardQrClient";

export const runtime = "nodejs";

export default async function BusinessCardPublicPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const card = await getBusinessCardById(id);
  if (!card || !card.isPublic || !card.isApproved) notFound();

  const business = await getBusinessById(card.businessId);
  if (!business) notFound();

  const currentUser = await getCurrentUser();

  const ar = locale === "ar";
  const businessName = ar ? business.name.ar : business.name.en;

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const baseUrl = host ? `${proto}://${host}` : "";
  const publicUrl = baseUrl
    ? `${baseUrl}/${locale}/business-card/${encodeURIComponent(card.id)}`
    : `/${locale}/business-card/${encodeURIComponent(card.id)}`;

  return (
    <PublicPage>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {ar ? "بطاقة أعمال" : "Business Card"}
          </h1>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "بطاقة عامة يمكن مشاركتها وربطها بالمحفظة."
              : "A public business card you can share and add to wallet."}
          </p>
        </div>
        <Link
          href={`/${locale}/businesses/${business.slug}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {ar ? "عرض النشاط" : "View business"}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="sbc-card rounded-2xl p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs text-(--muted-foreground)">{businessName}</div>
              <div className="text-2xl font-semibold">{card.fullName}</div>
              {card.title ? (
                <div className="mt-1 text-sm text-(--muted-foreground)">{card.title}</div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/business-cards/vcard/${encodeURIComponent(card.id)}`}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                {ar ? "تحميل vCard" : "Download vCard"}
              </a>
              <AppleWalletButton
                cardId={card.id}
                label={ar ? "إضافة إلى Apple Wallet" : "Add to Apple Wallet"}
                locale={locale}
              />
              <a
                href={`/api/business-cards/wallet/google/${encodeURIComponent(card.id)}`}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                {ar ? "إضافة إلى Google Wallet" : "Add to Google Wallet"}
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {card.email ? (
              <div className="sbc-card rounded-xl p-4">
                <div className="text-xs text-(--muted-foreground)">{ar ? "البريد" : "Email"}</div>
                <div className="mt-1 text-sm font-medium">{card.email}</div>
              </div>
            ) : null}
            {card.phone ? (
              <div className="sbc-card rounded-xl p-4">
                <div className="text-xs text-(--muted-foreground)">{ar ? "الهاتف" : "Phone"}</div>
                <div className="mt-1 text-sm font-medium">{card.phone}</div>
              </div>
            ) : null}
            {card.website ? (
              <div className="sbc-card rounded-xl p-4">
                <div className="text-xs text-(--muted-foreground)">{ar ? "الموقع" : "Website"}</div>
                <a className="mt-1 text-sm font-medium text-accent hover:underline" href={card.website}>
                  {card.website}
                </a>
              </div>
            ) : null}
            {business.address ? (
              <div className="sbc-card rounded-xl p-4">
                <div className="text-xs text-(--muted-foreground)">{ar ? "العنوان" : "Address"}</div>
                <div className="mt-1 text-sm font-medium">{business.address}</div>
              </div>
            ) : null}
          </div>

          {card.bio ? (
            <div className="mt-6 text-sm leading-7 text-(--muted-foreground)">{card.bio}</div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {currentUser && (
              <Link
                href={`/${locale}/chat/${business.slug}`}
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {ar ? "إرسال رسالة" : "Send Message"}
              </Link>
            )}
            <Link
              href={`/${locale}/businesses/${business.slug}`}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {dict.nav.businesses}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {ar ? "تواصل معنا" : "Contact"}
            </Link>
          </div>
        </div>

        <BusinessCardQrClient locale={locale as Locale} publicUrl={publicUrl} cardId={card.id} />
      </div>
    </PublicPage>
  );
}
