import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinessesPaginated, countBusinesses, type BusinessFilter } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { BusinessesClient } from "./BusinessesClient";

export const runtime = "nodejs";

const PER_PAGE = 20;

export default async function AdminBusinessesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const filter = (["all", "pending", "approved"].includes(sp.filter || "") ? sp.filter : "all") as BusinessFilter;
  const page = Math.max(1, parseInt(sp.page || "1", 10));
  const offset = (page - 1) * PER_PAGE;

  const [businesses, counts, categories] = await Promise.all([
    listBusinessesPaginated({ filter, search: q || undefined, limit: PER_PAGE, offset }),
    countBusinesses({ filter: "all", search: q || undefined }),
    listCategories(),
  ]);

  const totalForFilter = filter === "all" ? counts.total : filter === "pending" ? counts.pending : counts.approved;
  const totalPages = Math.ceil(totalForFilter / PER_PAGE);

  return (
    <AppPage>
      <BusinessesClient
        locale={locale as Locale}
        initialBusinesses={businesses}
        categories={categories}
        initialFilter={filter}
        initialSearch={q}
        pagination={{
          page,
          perPage: PER_PAGE,
          total: totalForFilter,
          totalPages,
        }}
        counts={counts}
      />
    </AppPage>
  );
}
