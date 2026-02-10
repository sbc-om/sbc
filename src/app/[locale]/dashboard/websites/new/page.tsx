import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { hasActiveSubscription } from "@/lib/db/subscriptions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { NewWebsiteForm } from "./NewWebsiteForm";

export const runtime = "nodejs";

export default async function NewWebsitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const hasSub = await hasActiveSubscription(user.id, "website");
  if (!hasSub) notFound();

  return (
    <AppPage>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {ar ? "إنشاء موقع جديد" : "Create New Website"}
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {ar ? "اختر قالب واملأ المعلومات الأساسية لموقعك" : "Choose a template and fill in basic info for your site"}
        </p>
      </div>

      <div className="mt-8">
        <NewWebsiteForm locale={locale as Locale} />
      </div>
    </AppPage>
  );
}
