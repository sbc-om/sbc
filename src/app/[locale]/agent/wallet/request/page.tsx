import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAgent } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getAgentByUserId, getAgentWalletSummary } from "@/lib/db/agents";

import RequestWithdrawalClient from "./RequestWithdrawalClient";

export const runtime = "nodejs";

export default async function AgentWalletRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireAgent(locale as Locale);
  const agent = await getAgentByUserId(user.id);
  if (!agent) notFound();

  const summary = await getAgentWalletSummary(user.id);

  return (
    <AppPage>
      <RequestWithdrawalClient
        locale={locale as Locale}
        availableWallet={summary.availableWallet}
        pendingWithdrawRequests={summary.pendingWithdrawRequests}
      />
    </AppPage>
  );
}
