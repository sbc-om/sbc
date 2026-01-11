import { notFound, redirect } from "next/navigation";

import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function LoyaltyAboutRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  redirect(`/${locale}/loyalty`);
}
