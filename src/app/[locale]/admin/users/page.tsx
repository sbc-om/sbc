import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listUsers } from "@/lib/db/users";
import { UserRoleManagement } from "./UserRoleManagement";

export const runtime = "nodejs";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const currentUser = await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const users = await listUsers();

  const title = dict.nav.users ?? (locale === "ar" ? "المستخدمون" : "Users");

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? `إجمالي المستخدمين: ${users.length}`
              : `Total users: ${users.length}`}
          </p>
        </div>
      </div>

      <UserRoleManagement 
        users={users} 
        locale={locale as Locale} 
        currentUserId={currentUser.id}
      />
    </AppPage>
  );
}
