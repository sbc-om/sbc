import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listBusinesses, listBusinessesByOwner } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { listBusinessesWithActiveStories } from "@/lib/db/stories";
import { BusinessesExplorer } from "@/components/BusinessesExplorer";
import { AppPage } from "@/components/AppPage";
import { PublicPage } from "@/components/PublicPage";
import { StoriesContainer } from "@/components/stories";

export default async function ExplorerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();

  const dict = await getDictionary(locale as Locale);
  const [businesses, categories, businessesWithStories, ownedBusinesses] = await Promise.all([
    listBusinesses(),
    listCategories(),
    listBusinessesWithActiveStories(),
    user ? listBusinessesByOwner(user.id) : Promise.resolve([]),
  ]);

  const Wrapper = user ? AppPage : PublicPage;
  const detailsBasePath = user ? "/explorer" : "/businesses";

  return (
    <Wrapper>
      {/* Stories Section */}
      {businessesWithStories.length > 0 && (
        <div className="mb-6 -mx-4 sm:-mx-6">
          <StoriesContainer
            initialBusinesses={businessesWithStories}
            locale={locale as Locale}
            currentUserId={user?.id}
            ownedBusinessIds={ownedBusinesses.map(b => b.id)}
            isAdmin={user?.role === "admin"}
          />
        </div>
      )}

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
          detailsBasePath={detailsBasePath}
          businessIdsWithStories={new Set(businessesWithStories.map(b => b.businessId))}
        />
      </div>
    </Wrapper>
  );
}
