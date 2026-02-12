import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAgent } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listAgentClients } from "@/lib/db/agents";
import { getUserWallet } from "@/lib/db/wallet";
import { getOwnerIdsWithBusiness } from "@/lib/db/businesses";
import { getBusinessRequestStatusByUserIds } from "@/lib/db/businessRequests";
import { AgentClientsList } from "./AgentClientsList";

export const runtime = "nodejs";

export default async function AgentClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireAgent(locale as Locale);

  const clients = await listAgentClients(user.id);
  const clientIds = clients.map((c) => c.clientUserId);

  // Fetch business ownership, pending requests, and wallet balances in parallel
  const [ownersWithBiz, requestStatusMap, walletsArr] = await Promise.all([
    getOwnerIdsWithBusiness(clientIds),
    getBusinessRequestStatusByUserIds(clientIds),
    Promise.all(
      clients.map(async (c) => {
        const w = await getUserWallet(c.clientUserId);
        return { id: c.clientUserId, balance: w ? parseFloat(String(w.balance)) : 0 };
      })
    ),
  ]);

  const walletMap = new Map(walletsArr.map((w) => [w.id, w.balance]));

  const enrichedClients = clients.map((c) => ({
    ...c,
    walletBalance: walletMap.get(c.clientUserId) ?? 0,
    hasBusiness: ownersWithBiz.has(c.clientUserId),
    requestStatus: requestStatusMap.get(c.clientUserId) ?? null,
  }));

  return (
    <AppPage>
      <AgentClientsList locale={locale as Locale} clients={enrichedClients} />
    </AppPage>
  );
}
