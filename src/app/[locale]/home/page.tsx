import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinesses, listBusinessesByOwner } from "@/lib/db/businesses";
import { getUserFollowedCategoryIds } from "@/lib/db/follows";
import { getCategoryById } from "@/lib/db/categories";
import { listBusinessesWithActiveStories } from "@/lib/db/stories";
import {
  getBusinessLikeCount,
  hasUserLikedBusiness,
  hasUserSavedBusiness,
  getApprovedBusinessComments,
} from "@/lib/db/businessEngagement";
import { toggleBusinessLikeAction, toggleBusinessSaveAction } from "./actions";
import { AppPage } from "@/components/AppPage";
import { BusinessFeedCard } from "@/components/BusinessFeedCard";
import { FeedProfileHeader } from "@/components/FeedProfileHeader";
import { StoriesContainer } from "@/components/stories";

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

  const dict = await getDictionary(locale as Locale);
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
  const allBusinesses = await listBusinesses();
  const businessesWithStories = await listBusinessesWithActiveStories();
  
  // Create a Set of business IDs that have stories for quick lookup
  const businessIdsWithStories = new Set(businessesWithStories.map(b => b.businessId));

  const businesses = allBusinesses.filter((b) =>
    b.categoryId ? followedCategoryIds.has(b.categoryId) : false,
  );

  // Prepare engagement data for each business
  const businessesWithEngagement = await Promise.all(
    businesses.map(async (b) => {
      const category = b.categoryId ? await getCategoryById(b.categoryId) : null;
      const approvedComments = await getApprovedBusinessComments(b.id);

      return {
        business: b,
        categoryName: category ? (locale === "ar" ? category.name.ar : category.name.en) : undefined,
        categoryIconId: category?.iconId,
        initialLikeCount: await getBusinessLikeCount(b.id),
        initialLiked: await hasUserLikedBusiness(user.id, b.id),
        initialSaved: await hasUserSavedBusiness(user.id, b.id),
        commentCount: approvedComments.length,
        hasStories: businessIdsWithStories.has(b.id),
      };
    })
  );

  return (
    <AppPage>
      <FeedProfileHeader user={viewUser} locale={locale as Locale} />

      {/* Stories Section */}
      {businessesWithStories.length > 0 && (
        <div className="my-6 -mx-4 sm:-mx-6">
          <StoriesContainer
            initialBusinesses={businessesWithStories}
            locale={locale as Locale}
            currentUserId={user.id}
            ownedBusinessIds={ownedBusinesses.map(b => b.id)}
          />
        </div>
      )}

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {locale === "ar" ? "الرئيسية" : (dict.nav.home ?? "Home")}
            </h1>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "الأعمال من التصنيفات التي تتابعها."
                : "Businesses from the categories you follow."}
            </p>
          </div>
        </div>

        {followedCategoryIds.size === 0 ? (
          <div className="mt-8 sbc-card rounded-2xl p-6">
            <div className="font-semibold">
              {locale === "ar" ? "ابدأ بمتابعة التصنيفات" : "Start by following categories"}
            </div>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "اذهب إلى صفحة التصنيفات واختر ما يناسبك."
                : "Go to Categories and follow what you like."}
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businessesWithEngagement.map((item) => (
            <BusinessFeedCard
              key={item.business.id}
              business={item.business}
              locale={locale}
              categoryName={item.categoryName}
              categoryIconId={item.categoryIconId}
              initialLikeCount={item.initialLikeCount}
              initialLiked={item.initialLiked}
              initialSaved={item.initialSaved}
              commentCount={item.commentCount}
              onToggleLike={toggleBusinessLikeAction.bind(null, locale)}
              onToggleSave={toggleBusinessSaveAction.bind(null, locale)}
              detailsBasePath="/explorer"
              hasStories={item.hasStories}
            />
          ))}
        </div>

        {followedCategoryIds.size > 0 && businessesWithEngagement.length === 0 ? (
          <div className="mt-10 text-center text-(--muted-foreground)">
            {locale === "ar"
              ? "لا توجد أعمال في التصنيفات التي تتابعها حالياً."
              : "No businesses yet in the categories you follow."}
          </div>
        ) : null}

        <FollowedCategoriesDisplay
          categoryIds={Array.from(followedCategoryIds).slice(0, 12)}
          locale={locale}
        />
    </AppPage>
  );
}
