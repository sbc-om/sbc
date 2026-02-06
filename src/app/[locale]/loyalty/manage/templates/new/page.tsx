import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";

import { NewTemplateClient } from "./NewTemplateClient";

export const runtime = "nodejs";

export default async function NewTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/loyalty/manage/templates/new`)}`);
  }

  const isActive = await isProgramSubscriptionActive(user.id);
  if (!isActive) {
    redirect(`/${locale}/loyalty/manage`);
  }

  const profile = await getLoyaltyProfileByUserId(user.id);

  return (
    <AppPage>
      <NewTemplateClient locale={locale as Locale} profile={profile} />
    </AppPage>
  );
}
