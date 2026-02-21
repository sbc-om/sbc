import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function NewTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc = isLocale(locale) ? locale : "en";
  redirect(`/${loc}/loyalty/manage/design`);
}
