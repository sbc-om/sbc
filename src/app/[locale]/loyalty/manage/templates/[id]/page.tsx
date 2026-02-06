import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import { getLoyaltyCardTemplateById, countIssuedCardsForTemplate } from "@/lib/db/loyaltyTemplates";

import { EditTemplateClient } from "./EditTemplateClient";

export const runtime = "nodejs";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/loyalty/manage/templates/${id}`)}`);
  }

  const isActive = await isProgramSubscriptionActive(user.id);
  if (!isActive) {
    redirect(`/${locale}/loyalty/manage`);
  }

  const template = await getLoyaltyCardTemplateById(id);
  if (!template || template.userId !== user.id) {
    notFound();
  }

  const profile = await getLoyaltyProfileByUserId(user.id);
  const issuedCount = await countIssuedCardsForTemplate(id);

  return (
    <AppPage>
      <EditTemplateClient
        locale={locale as Locale}
        profile={profile}
        template={template}
        issuedCount={issuedCount}
      />
    </AppPage>
  );
}
