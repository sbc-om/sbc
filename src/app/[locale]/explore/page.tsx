import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export default async function ExplorerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Legacy route: keep for backwards compatibility.
  // The new in-app Explorer page is `/[locale]/explorer`.
  await requireUser(locale as Locale);
  redirect(`/${locale}/explorer`);
}
