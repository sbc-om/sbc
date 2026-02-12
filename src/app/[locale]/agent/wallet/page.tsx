import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAgent } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAgentByUserId, getAgentWalletSummary, listAgentWithdrawalRequests } from "@/lib/db/agents";
import AgentWalletClient from "./AgentWalletClient";

export const runtime = "nodejs";

export default async function AgentWalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireAgent(locale as Locale);
  const agent = await getAgentByUserId(user.id);
  if (!agent) notFound();

  const [summary, requests] = await Promise.all([
    getAgentWalletSummary(user.id),
    listAgentWithdrawalRequests(user.id, 50, 0),
  ]);

  return (
    <AppPage>
      <AgentWalletClient
        locale={locale as Locale}
        summary={summary}
        requests={requests}
        commissionRate={agent.commissionRate}
      />
    </AppPage>
  );
}
