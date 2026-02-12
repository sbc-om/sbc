import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import {
  getAgentByUserId,
  listAgentClients,
  listAgentCommissions,
  getAgentStats,
} from "@/lib/db/agents";
import { getUserById } from "@/lib/db/users";
import AgentDetailView from "./AgentDetailView";

export const runtime = "nodejs";

export default async function AdminAgentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  await requireAdmin(locale as Locale);

  const agent = await getAgentByUserId(id);
  if (!agent) notFound();

  const user = await getUserById(id);
  if (!user) notFound();

  const clients = await listAgentClients(id);
  const commissions = await listAgentCommissions(id);
  const stats = await getAgentStats(id);

  return (
    <AppPage>
      <AgentDetailView
        locale={locale as Locale}
        agent={agent}
        user={{
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl ?? null,
        }}
        clients={clients}
        commissions={commissions}
        stats={stats}
      />
    </AppPage>
  );
}
