import Link from "next/link";
import Image from "next/image";
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
  const cardInitial = card.fullName.trim().charAt(0).toUpperCase();

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const baseUrl = host ? `${proto}://${host}` : "";
  const publicUrl = baseUrl
    ? `${baseUrl}/${locale}/business-card/${encodeURIComponent(card.id)}`
    : `/${locale}/business-card/${encodeURIComponent(card.id)}`;

  return (
    <PublicPage containerClassName="pb-10 sm:pb-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {ar ? "بطاقة أعمال" : "Business Card"}
          </h1>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar
              ? "بطاقة أعمال احترافية جاهزة للمشاركة والحفظ في المحفظة."
              : "A polished business card ready to share and save to wallet."}
          </p>
        </div>
        <Link href={`/${locale}/businesses/${business.slug}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {ar ? "عرض النشاط" : "View business"}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
        <section className="sbc-card overflow-hidden rounded-3xl border border-(--surface-border)">
          <div className="bg-linear-to-br from-accent/15 via-accent/5 to-accent-2/15 p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-(--surface-border) bg-(--background)">
                  {card.avatarUrl ? (
                    <Image src={card.avatarUrl} alt={card.fullName} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-accent">{cardInitial}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.12em] text-(--muted-foreground)">{businessName}</p>
                  <h2 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-[2rem]">{card.fullName}</h2>
                  {card.title ? <p className="mt-1 text-sm text-(--muted-foreground)">{card.title}</p> : null}
                </div>
              </div>
              <div className="rounded-full border border-(--surface-border) bg-(--background) px-3 py-1 text-xs text-(--muted-foreground)">
                {ar ? "بطاقة عامة" : "Public profile"}
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {card.email ? (
                <a href={`mailto:${card.email}`} className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4 transition-colors hover:bg-(--background)">
                  <div className="text-xs text-(--muted-foreground)">{ar ? "البريد" : "Email"}</div>
                  <div className="mt-1 truncate text-sm font-medium">{card.email}</div>
                </a>
              ) : null}
              {card.phone ? (
                <a href={`tel:${card.phone}`} className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4 transition-colors hover:bg-(--background)">
                  <div className="text-xs text-(--muted-foreground)">{ar ? "الهاتف" : "Phone"}</div>
                  <div className="mt-1 text-sm font-medium">{card.phone}</div>
                </a>
              ) : null}
              {card.website ? (
                <a
                  className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4 transition-colors hover:bg-(--background)"
                  href={card.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="text-xs text-(--muted-foreground)">{ar ? "الموقع" : "Website"}</div>
                  <div className="mt-1 truncate text-sm font-medium text-accent">{card.website.replace(/^https?:\/\//, "")}</div>
                </a>
              ) : null}
              {business.address ? (
                <div className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4">
                  <div className="text-xs text-(--muted-foreground)">{ar ? "العنوان" : "Address"}</div>
                  <div className="mt-1 line-clamp-2 text-sm font-medium">{business.address}</div>
                </div>
              ) : null}
            </div>

            {card.bio ? (
              <div className="rounded-2xl border border-(--surface-border) bg-(--chip-bg) p-4 text-sm leading-7 text-(--muted-foreground)">
                {card.bio}
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <a
                href={`/api/business-cards/vcard/${encodeURIComponent(card.id)}`}
                className={buttonVariants({ variant: "secondary", size: "sm", className: "w-full justify-center" })}
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
                className={buttonVariants({ variant: "secondary", size: "sm", className: "w-full justify-center" })}
              >
                {ar ? "إضافة إلى Google Wallet" : "Add to Google Wallet"}
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-(--surface-border) pt-5">
              {currentUser ? (
                <Link href={`/${locale}/chat/${business.slug}`} className={buttonVariants({ variant: "primary", size: "sm" })}>
                  {ar ? "إرسال رسالة" : "Send Message"}
                </Link>
              ) : null}
              <Link href={`/${locale}/businesses/${business.slug}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                {dict.nav.businesses}
              </Link>
              <Link href={`/${locale}/contact`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                {ar ? "تواصل معنا" : "Contact"}
              </Link>
            </div>
          </div>
        </section>

        <BusinessCardQrClient locale={locale as Locale} publicUrl={publicUrl} cardId={card.id} />
      </div>
    </PublicPage>
  );
}
