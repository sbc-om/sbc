import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { FakeGatewayClient } from "@/components/store/FakeGatewayClient";
import { requireUser } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

function sanitizeReturnTo(locale: Locale, raw?: string) {
  // Only allow internal, locale-scoped return paths.
  if (!raw) return `/${locale}/store/checkout`;
  if (!raw.startsWith(`/${locale}/`)) return `/${locale}/store/checkout`;
  return raw;
}

export default async function StoreGatewayPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ return?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  await requireUser(locale as Locale);

  const sp = await searchParams;
  const returnTo = sanitizeReturnTo(locale as Locale, sp.return);

  return (
    <AppPage>
      <FakeGatewayClient locale={locale as Locale} returnTo={returnTo} />
    </AppPage>
  );
}
