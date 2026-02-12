import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAgent } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listCategories } from "@/lib/db/categories";
import { listAgentClients } from "@/lib/db/agents";
import { listActiveProducts } from "@/lib/db/products";
import { getUserWallet } from "@/lib/db/wallet";
import { listActiveUserProgramSubscriptions } from "@/lib/db/subscriptions";
import { AgentBusinessForm } from "./AgentBusinessForm";

export const runtime = "nodejs";

export default async function AgentNewBusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string; clientId?: string; clientName?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireAgent(locale as Locale);

  const sp = await searchParams;
  const success = sp.success === "1";
  const [categories, clients, products] = await Promise.all([
    listCategories(),
    listAgentClients(user.id),
    listActiveProducts(),
  ]);

  // Fetch wallet balances and active subscriptions for each client
  const clientWallets: Record<string, number> = {};
  const clientSubscriptions: Record<string, { productSlug: string; program: string; plan?: string }[]> = {};

  await Promise.all(
    clients.map(async (c) => {
      const [wallet, subs] = await Promise.all([
        getUserWallet(c.clientUserId),
        listActiveUserProgramSubscriptions(c.clientUserId),
      ]);
      clientWallets[c.clientUserId] = wallet ? parseFloat(String(wallet.balance)) : 0;
      clientSubscriptions[c.clientUserId] = subs.map((s) => ({
        productSlug: s.productSlug,
        program: s.program,
        plan: s.plan ?? undefined,
      }));
    })
  );

  return (
    <AppPage>
      <AgentBusinessForm
        locale={locale as Locale}
        categories={categories}
        success={success}
        clients={clients}
        preselectedClientId={sp.clientId}
        preselectedClientName={sp.clientName}
        products={products.filter((p) => p.isActive)}
        clientWallets={clientWallets}
        clientSubscriptions={clientSubscriptions}
      />
    </AppPage>
  );
}
