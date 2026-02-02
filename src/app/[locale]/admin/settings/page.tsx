import { notFound, redirect } from "next/navigation";
import { AppPage } from "@/components/AppPage";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAllSettings } from "@/lib/db/settings";
import { isWAHAEnabled } from "@/lib/waha/client";
import { SettingsForm } from "./SettingsForm";

export const runtime = "nodejs";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect(`/${locale}/login?next=/${locale}/admin/settings`);
  }

  const dict = await getDictionary(locale as Locale);
  const settings = await getAllSettings();
  const wahaConfigured = isWAHAEnabled();

  return (
    <AppPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {locale === "ar" ? "إعدادات النظام" : "System Settings"}
          </h1>
          <p className="text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "إدارة إعدادات المصادقة والتطبيق"
              : "Manage authentication and application settings"}
          </p>
        </div>

        <SettingsForm
          locale={locale as Locale}
          initialSettings={settings}
          wahaConfigured={wahaConfigured}
        />
      </div>
    </AppPage>
  );
}
