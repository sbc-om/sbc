import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listUsers } from "@/lib/db/users";
import { listAgents } from "@/lib/db/agents";
import AddAgentForm from "./AddAgentForm";

export const runtime = "nodejs";

export default async function AddAgentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale as Locale);

  const allUsers = await listUsers();
  const existingAgents = await listAgents();
  const agentUserIds = new Set(existingAgents.map((a) => a.userId));

  // Only show non-admin users who aren't already agents
  const eligibleUsers = allUsers.filter(
    (u) => u.role !== "admin" && !agentUserIds.has(u.id)
  );

  return (
    <AppPage>
      <AddAgentForm locale={locale as Locale} users={eligibleUsers} />
    </AppPage>
  );
}
