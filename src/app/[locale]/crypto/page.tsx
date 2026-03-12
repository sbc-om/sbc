import { redirect } from "next/navigation";

import { isLocale } from "@/lib/i18n/locales";

/** Redirect legacy /crypto to /tools/crypto */
export default async function CryptoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : "en";
  redirect(`/${loc}/tools/crypto`);
}
