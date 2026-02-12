import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAgent } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import {
  getAgentByUserId,
  listAgentClients,
  getAgentStats,
} from "@/lib/db/agents";
import { getUserWallet } from "@/lib/db/wallet";
import { listActiveProducts } from "@/lib/db/products";
import AgentDashboard from "./AgentDashboard";

export const runtime = "nodejs";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireAgent(locale as Locale);

  const agent = await getAgentByUserId(user.id);

  // Provide sensible defaults for admin users without an agent profile
  const defaultAgent = {
    userId: user.id,
    commissionRate: 0,
    totalEarned: 0,
    totalClients: 0,
    isActive: true,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const clients = await listAgentClients(user.id);
  const stats = await getAgentStats(user.id);
  const wallet = await getUserWallet(user.id);
  const products = await listActiveProducts();

  // Fetch client wallet balances
  const clientsWithWallet = await Promise.all(
    clients.map(async (c) => {
      const cw = await getUserWallet(c.clientUserId);
      return {
        ...c,
        walletBalance: cw ? parseFloat(String(cw.balance)) : 0,
      };
    })
  );

  return (
    <AppPage>
      <AgentDashboard
        locale={locale as Locale}
        agent={agent ?? defaultAgent}
        userName={user.displayName || user.email}
        clients={clientsWithWallet}
        stats={stats}
        walletBalance={wallet ? parseFloat(String(wallet.balance)) : 0}
        products={products.filter((p) => p.isActive)}
      />
    </AppPage>
  );
}
