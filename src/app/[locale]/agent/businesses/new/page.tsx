import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAgent } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listCategories } from "@/lib/db/categories";
import { listAgentClients } from "@/lib/db/agents";
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
  const categories = await listCategories();
  const clients = await listAgentClients(user.id);

  return (
    <AppPage>
      <AgentBusinessForm
        locale={locale as Locale}
        categories={categories}
        success={success}
        clients={clients}
        preselectedClientId={sp.clientId}
        preselectedClientName={sp.clientName}
      />
    </AppPage>
  );
}
