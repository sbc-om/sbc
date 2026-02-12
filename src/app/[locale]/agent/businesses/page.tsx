import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAgent } from "@/lib/auth/requireUser";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listBusinessRequestsByAgent } from "@/lib/db/businessRequests";
import { listCategories } from "@/lib/db/categories";
import { AgentBusinessesList } from "./AgentBusinessesList";

export const runtime = "nodejs";

export default async function AgentBusinessesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireAgent(locale as Locale);
  const requests = await listBusinessRequestsByAgent(user.id);
  const categories = await listCategories();

  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  return (
    <AppPage>
      <AgentBusinessesList
        locale={locale as Locale}
        requests={requests}
        categoriesById={Object.fromEntries(categoriesById)}
      />
    </AppPage>
  );
}
