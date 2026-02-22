import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { requireUser } from "@/lib/auth/requireUser";
import { countExplorerBusinesses, listBusinessesByOwner, listExplorerBusinessesPaginated } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import {
  countBusinessesWithActiveStories,
  getBusinessIdsWithActiveStories,
  listBusinessesWithActiveStoriesPaginated,
} from "@/lib/db/stories";
import {
  getBusinessEngagementCounts,
  getUserLikedBusinessIds,
  getUserSavedBusinessIds,
} from "@/lib/db/businessEngagement";
import { BusinessesExplorer } from "@/components/BusinessesExplorer";
import { AppPage } from "@/components/AppPage";
import { StoriesContainer } from "@/components/stories";
import { toggleBusinessLikeAction, toggleBusinessSaveAction } from "./actions";

const EXPLORER_STORIES_PER_PAGE = 16;
const EXPLORER_FEED_PER_PAGE = 12;

export default async function ExplorerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  const dict = await getDictionary(locale as Locale);
  const [businesses, totalBusinesses, categories, businessesWithStories, storiesTotal, ownedBusinesses] = await Promise.all([
    listExplorerBusinessesPaginated({ limit: EXPLORER_FEED_PER_PAGE, offset: 0, sortBy: "relevance" }),
    countExplorerBusinesses(),
    listCategories(),
    listBusinessesWithActiveStoriesPaginated(EXPLORER_STORIES_PER_PAGE, 0),
    countBusinessesWithActiveStories(),
    user ? listBusinessesByOwner(user.id) : Promise.resolve([]),
  ]);
  const businessIdsWithStories = await getBusinessIdsWithActiveStories(businesses.map((b) => b.id));

  const [engagementCounts, likedBusinessIds, savedBusinessIds] = await Promise.all([
    getBusinessEngagementCounts(businesses.map((b) => b.id)),
    user ? getUserLikedBusinessIds(user.id) : Promise.resolve([]),
    user ? getUserSavedBusinessIds(user.id) : Promise.resolve([]),
  ]);

  const likedSet = new Set(likedBusinessIds);
  const savedSet = new Set(savedBusinessIds);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const engagementByBusiness = businesses.reduce<
    Record<
      string,
      {
        categoryName?: string;
        categoryIconId?: string;
        initialLikeCount: number;
        initialLiked: boolean;
        initialSaved: boolean;
        commentCount: number;
      }
    >
  >((acc, business) => {
    const category = business.categoryId ? categoryById.get(business.categoryId) : undefined;
    const counts = engagementCounts[business.id] ?? { likes: 0, comments: 0 };

    acc[business.id] = {
      categoryName: category ? (locale === "ar" ? category.name.ar : category.name.en) : undefined,
      categoryIconId: category?.iconId,
      initialLikeCount: counts.likes,
      initialLiked: likedSet.has(business.id),
      initialSaved: savedSet.has(business.id),
      commentCount: counts.comments,
    };
    return acc;
  }, {});

  const detailsBasePath = "/explorer";

  return (
    <AppPage>
      {/* Stories Section */}
      {businessesWithStories.length > 0 && (
        <div className="mb-6 -mx-4 sm:-mx-6">
          <StoriesContainer
            initialBusinesses={businessesWithStories}
            locale={locale as Locale}
            currentUserId={user?.id}
            ownedBusinessIds={ownedBusinesses.map(b => b.id)}
            isAdmin={user?.role === "admin"}
            initialTotal={storiesTotal}
            fetchScope="all"
          />
        </div>
      )}

      <div className="mt-6">
        <BusinessesExplorer
          locale={locale as Locale}
          dict={dict}
          businesses={businesses}
          categories={categories}
          detailsBasePath={detailsBasePath}
          businessIdsWithStories={businessIdsWithStories}
          engagementByBusiness={engagementByBusiness}
          serverPagination={{
            page: 1,
            perPage: EXPLORER_FEED_PER_PAGE,
            total: totalBusinesses,
            totalPages: Math.max(1, Math.ceil(totalBusinesses / EXPLORER_FEED_PER_PAGE)),
          }}
          onToggleLike={user ? toggleBusinessLikeAction.bind(null, locale as Locale) : undefined}
          onToggleSave={user ? toggleBusinessSaveAction.bind(null, locale as Locale) : undefined}
        />
      </div>
    </AppPage>
  );
}
