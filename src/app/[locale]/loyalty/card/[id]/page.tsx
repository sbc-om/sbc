import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getLoyaltyCardById, getLoyaltyCustomerById } from "@/lib/db/loyalty";

export const runtime = "nodejs";

export default async function LoyaltyCardPublicPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const card = getLoyaltyCardById(id);
  if (!card || card.status !== "active") notFound();

  const customer = getLoyaltyCustomerById(card.customerId);

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

        <div className="mt-6 text-xs text-(--muted-foreground)">
          {ar
            ? "ملاحظة: إضافة البطاقة إلى Apple Wallet/Google Wallet ستكون في مرحلة لاحقة." 
            : "Note: Adding to Apple Wallet/Google Wallet will be implemented in a later phase."}
        </div>
      </div>
    </PublicPage>
  );
}
