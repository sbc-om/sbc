import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listUsers } from "@/lib/db/users";
import { listAgentUserIds, getAgentNamesForClientUsers } from "@/lib/db/agents";
import { getAllWalletBalances } from "@/lib/db/wallet";
import { UserRoleManagement } from "./UserRoleManagement";

export const runtime = "nodejs";

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ archived?: string }>;
}) {
  const { locale } = await params;
  const { archived } = await searchParams;
  if (!isLocale(locale)) notFound();

  const currentUser = await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const showArchived = archived === "true";
  // Always fetch all users to get accurate counts
  const allUsers = await listUsers(true);
  const [agentUserIds, walletBalances, assignedAgentsByUserId] = await Promise.all([
    listAgentUserIds(),
    getAllWalletBalances(),
    getAgentNamesForClientUsers(allUsers.map((u) => u.id)),
  ]);
  const activeUsers = allUsers.filter(u => !u.isArchived);
  const archivedUsers = allUsers.filter(u => u.isArchived);
  
  // Display only the relevant subset
  const displayUsers = showArchived ? allUsers : activeUsers;

  const title = dict.nav.users ?? (locale === "ar" ? "المستخدمون" : "Users");

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? `إجمالي المستخدمين: ${activeUsers.length}${archivedUsers.length > 0 ? ` (${archivedUsers.length} مؤرشف)` : ''}`
              : `Total users: ${activeUsers.length}${archivedUsers.length > 0 ? ` (${archivedUsers.length} archived)` : ''}`}
          </p>
        </div>
      </div>

      <UserRoleManagement 
        users={displayUsers}
        archivedCount={archivedUsers.length}
        showArchived={showArchived}
        locale={locale as Locale} 
        currentUserId={currentUser.id}
        agentUserIds={agentUserIds}
        walletBalances={walletBalances}
        assignedAgentsByUserId={assignedAgentsByUserId}
      />
    </AppPage>
  );
}
