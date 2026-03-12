import { redirect } from "next/navigation";

import { isLocale } from "@/lib/i18n/locales";

/** Redirect legacy /crypto/[symbol] to /tools/crypto/[symbol] */
export default async function CryptoSymbolPage({
  params,
}: {
  params: Promise<{ locale: string; symbol: string }>;
}) {
  const { locale, symbol } = await params;
  const loc = isLocale(locale) ? locale : "en";
  redirect(`/${loc}/tools/crypto/${encodeURIComponent(symbol)}`);
}
