import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAgent } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { AddClientForm } from "./AddClientForm";

export const runtime = "nodejs";

export default async function AgentClientsNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireAgent(locale as Locale);

  return (
    <AppPage>
      <AddClientForm locale={locale as Locale} />
    </AppPage>
  );
}
