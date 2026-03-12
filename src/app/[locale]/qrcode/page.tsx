import { redirect } from "next/navigation";

import { isLocale } from "@/lib/i18n/locales";

/** Redirect legacy /qrcode to /tools/qrcode */
export default async function QrCodePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : "en";
  redirect(`/${loc}/tools/qrcode`);
}
