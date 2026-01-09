import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { BusinessesExplorer } from "@/components/BusinessesExplorer";
import { AppPage } from "@/components/AppPage";

export default async function ExplorerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireUser(locale as Locale);

  const dict = await getDictionary(locale as Locale);
  const businesses = listBusinesses({ locale: locale as Locale });
  const categories = listCategories({ locale: locale as Locale });

  return (
    <AppPage>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {dict.nav.explore ?? (locale === "ar" ? "استكشف" : "Explore")}
            </h1>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "بحث متقدم مع فلاتر قوية"
                : "Advanced search with powerful filters"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <BusinessesExplorer
            locale={locale as Locale}
            dict={dict}
            businesses={businesses}
            categories={categories}
            detailsBasePath="/explorer"
          />
        </div>
    </AppPage>
  );
}
