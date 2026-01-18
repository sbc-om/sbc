import { notFound } from "next/navigation";
import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import BackupManager from "@/components/admin/BackupManager";

export const runtime = "nodejs";

export default async function AdminBackupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {ar ? "النسخ الاحتياطية" : "Backups"}
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {ar
            ? "إدارة النسخ الاحتياطية واستعادة قاعدة البيانات والملفات"
            : "Manage database and file backups and restoration"}
        </p>
      </div>

      <BackupManager locale={locale as "ar" | "en"} />
    </AppPage>
  );
}
