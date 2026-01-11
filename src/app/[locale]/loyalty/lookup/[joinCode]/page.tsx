import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { PublicPage } from "@/components/PublicPage";
import { getLoyaltyProfileByJoinCode } from "@/lib/db/loyalty";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { CustomerLookupForm } from "./CustomerLookupForm";

export const runtime = "nodejs";

type Props = {
  params: Promise<{ locale: string; joinCode: string }>;
};

export default async function LoyaltyLookupPage({ params }: Props) {
  const { locale, joinCode } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const profile = getLoyaltyProfileByJoinCode(joinCode);
  if (!profile) {
    return (
      <PublicPage>
        <div className="mx-auto max-w-2xl py-12 text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-2xl font-bold mb-4">
            {ar ? "رمز غير صحيح" : "Invalid Code"}
          </h1>
          <p className="text-(--muted-foreground) mb-6">
            {ar
              ? "لم نتمكن من العثور على نشاط تجاري بهذا الرمز."
              : "We couldn't find a business with this code."}
          </p>
          <Link
            href={`/${locale}/loyalty`}
            className="inline-block rounded-xl bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90"
          >
            {ar ? "العودة إلى الصفحة الرئيسية" : "Back to Home"}
          </Link>
        </div>
      </PublicPage>
    );
  }

  return (
    <PublicPage>
      <div className="mx-auto max-w-4xl py-8">
        {/* Business Header */}
        <div className="mb-8 text-center">
          {profile.logoUrl && (
            <div className="mb-4 flex justify-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-(--surface-border)">
                <Image
                  src={profile.logoUrl}
                  alt={profile.businessName}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold">{profile.businessName}</h1>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {ar ? "رمز الانضمام:" : "Join Code:"} <span className="font-mono font-semibold">{profile.joinCode}</span>
          </p>
        </div>

        {/* Customer Lookup Form */}
        <div className="sbc-card rounded-2xl p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {ar ? "البحث عن عميل" : "Customer Lookup"}
          </h2>
          <p className="mb-6 text-sm text-(--muted-foreground)">
            {ar
              ? "أدخل رقم هاتف العميل لعرض بطاقة الولاء ورمز QR والباركود."
              : "Enter customer phone number to view loyalty card, QR code, and barcode."}
          </p>
          <CustomerLookupForm locale={locale as Locale} joinCode={profile.joinCode} />
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-xs text-(--muted-foreground)">
          {ar
            ? "هذه الصفحة عامة ويمكن مشاركتها مع موظفيك للبحث السريع عن العملاء."
            : "This is a public page that can be shared with your staff for quick customer lookups."}
        </div>
      </div>
    </PublicPage>
  );
}
