import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { SettingsClient } from "./SettingsClient";

export const runtime = "nodejs";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  return (
    <AppPage>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.settings?.title ?? dict.nav.settings}
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {dict.settings?.subtitle ??
            (locale === "ar" ? "خصّص تجربتك." : "Personalize your experience.")}
        </p>

        <SettingsClient locale={locale as Locale} dict={dict} />
      </div>
    </AppPage>
  );
}
