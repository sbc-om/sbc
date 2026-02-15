import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { StaffEntryClient } from "./StaffEntryClient";

export const runtime = "nodejs";

export default async function LoyaltyStaffEntryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);

  return (
    <PublicPage>
      <div className="py-4 sm:py-8">
        <StaffEntryClient locale={locale as Locale} />
      </div>
    </PublicPage>
  );
}
