import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinessesByOwner } from "@/lib/db/businesses";
import {
  countUserHomeBusinesses,
  getUserFollowedBusinessIds,
  getUserFollowedCategoryIds,
  listUserHomeBusinessesPaginated,
} from "@/lib/db/follows";
import { getCategoryById } from "@/lib/db/categories";
import {
  countFollowedBusinessesWithActiveStoriesWithCategory,
  listFollowedBusinessesWithActiveStoriesWithCategoryPaginated,
} from "@/lib/db/stories";
import { buildHomeFeedItems } from "@/lib/home/feed";
import { toggleBusinessLikeAction, toggleBusinessSaveAction } from "./actions";
import { AppPage } from "@/components/AppPage";
import { FeedProfileHeader } from "@/components/FeedProfileHeader";
import { StoriesContainer } from "@/components/stories";
import { HomeInfiniteFeed } from "./HomeInfiniteFeed";

const HOME_FEED_PER_PAGE = 12;
const HOME_STORIES_PER_PAGE = 16;

async function FollowedCategoriesDisplay({
  categoryIds,
  locale,
}: {
  categoryIds: string[];
  locale: string;
}) {
  if (categoryIds.length === 0) return null;

  const categories = await Promise.all(
    categoryIds.map((id) => getCategoryById(id))
  );

  return (
    <div className="mt-8 flex flex-wrap gap-2 text-xs text-(--muted-foreground)">
      <span>{locale === "ar" ? "تتابع:" : "Following:"}</span>
      {categories.map((c) => {
        if (!c) return null;
        const name = locale === "ar" ? c.name.ar : c.name.en;
        return (
          <span key={c.id} className="sbc-chip rounded-full px-2 py-0.5">
            {name}
          </span>
        );
      })}
    </div>
  );
}

export default async function HomeFollowedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  // Calculate user stats
  const followedCategories = await getUserFollowedCategoryIds(user.id);
  const ownedBusinesses = await listBusinessesByOwner(user.id);

  const viewUser = {
    displayName: user.displayName ?? user.email.split("@")[0],
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    isVerified: user.isVerified ?? false,
    stats: {
      businesses: ownedBusinesses.length,
      followers: 0, // Business followers not yet implemented
      followedCategories: followedCategories.length,
    },
  };

  const followedCategoryIds = new Set(await getUserFollowedCategoryIds(user.id));
  const followedBusinessIds = new Set(await getUserFollowedBusinessIds(user.id));

  const [initialStories, totalStories, initialFeedBusinesses, totalFeedBusinesses] = await Promise.all([
    listFollowedBusinessesWithActiveStoriesWithCategoryPaginated(user.id, HOME_STORIES_PER_PAGE, 0),
    countFollowedBusinessesWithActiveStoriesWithCategory(user.id),
    listUserHomeBusinessesPaginated(user.id, HOME_FEED_PER_PAGE, 0),
    countUserHomeBusinesses(user.id),
  ]);

  const initialFeedItems = await buildHomeFeedItems(user.id, locale, initialFeedBusinesses);

  return (
    <AppPage>
      <FeedProfileHeader user={viewUser} locale={locale as Locale} />

      {/* Stories Section - Only from followed businesses/categories */}
      {initialStories.length > 0 && (
        <div className="my-6 -mx-4 sm:-mx-6">
          <StoriesContainer
            initialBusinesses={initialStories}
            locale={locale as Locale}
            currentUserId={user.id}
            ownedBusinessIds={ownedBusinesses.map(b => b.id)}
            isAdmin={user.role === "admin"}
            initialTotal={totalStories}
            fetchScope="followed"
          />
        </div>
      )}

        {followedCategoryIds.size === 0 && followedBusinessIds.size === 0 ? (
          <div className="mt-8 sbc-card rounded-2xl p-6">
            <div className="font-semibold">
              {locale === "ar" ? "ابدأ بمتابعة التصنيفات أو الأنشطة التجارية" : "Start by following categories or businesses"}
            </div>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "اذهب إلى صفحة التصنيفات واختر ما يناسبك، أو تابع أنشطة تجارية محددة."
                : "Go to Categories and follow what you like, or follow specific businesses."}
            </p>
          </div>
        ) : null}

        <HomeInfiniteFeed
          locale={locale as Locale}
          initialItems={initialFeedItems}
          initialTotal={totalFeedBusinesses}
          onToggleLike={toggleBusinessLikeAction.bind(null, locale)}
          onToggleSave={toggleBusinessSaveAction.bind(null, locale)}
        />

        {(followedCategoryIds.size > 0 || followedBusinessIds.size > 0) && totalFeedBusinesses === 0 ? (
          <div className="mt-10 text-center text-(--muted-foreground)">
            {locale === "ar"
              ? "لا توجد أعمال في التصنيفات أو الأنشطة التي تتابعها حالياً."
              : "No businesses yet in the categories or businesses you follow."}
          </div>
        ) : null}

        <FollowedCategoriesDisplay
          categoryIds={Array.from(followedCategoryIds).slice(0, 12)}
          locale={locale}
        />
    </AppPage>
  );
}
