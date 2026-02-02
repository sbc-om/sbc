import { notFound } from "next/navigation";
import Link from "next/link";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listUsers } from "@/lib/db/users";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { isWAHAEnabled } from "@/lib/waha/client";
import { AdminWhatsAppClient, type WhatsAppUser } from "@/components/admin/AdminWhatsAppClient";

export const runtime = "nodejs";

export default async function AdminWhatsAppPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const ar = locale === "ar";
  const enabled = isWAHAEnabled();

  // Get all users with phone numbers
  const allUsers = await listUsers();
  const users: WhatsAppUser[] = allUsers
    .filter((u) => u.phone && u.phone.length > 6)
    .map((u) => ({
      userId: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone!,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <AppPage>
      <div className="mb-6">
        <nav className="mb-2 text-sm text-(--muted-foreground)">
          <Link href={`/${locale}/admin`} className="hover:underline">
            {ar ? "لوحة التحكم" : "Dashboard"}
          </Link>
          <span className="mx-2">/</span>
          <span>{ar ? "واتساب" : "WhatsApp"}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">
          {ar ? "إرسال واتساب" : "WhatsApp Broadcast"}
        </h1>
      </div>
      <AdminWhatsAppClient locale={locale as Locale} users={users} enabled={enabled} />
    </AppPage>
  );
}
