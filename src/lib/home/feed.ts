import type { Business } from "@/lib/db/types";
import { listCategories } from "@/lib/db/categories";
import {
  getBusinessEngagementCounts,
  getUserLikedBusinessIds,
  getUserSavedBusinessIds,
} from "@/lib/db/businessEngagement";
import { getBusinessIdsWithActiveStories } from "@/lib/db/stories";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export type HomeFeedItem = {
  business: Business;
  categoryName?: string;
  categoryIconId?: string;
  initialLikeCount: number;
  initialLiked: boolean;
  initialSaved: boolean;
  commentCount: number;
  hasStories: boolean;
};

export async function buildHomeFeedItems(
  userId: string,
  localeInput: string,
  businesses: Business[],
): Promise<HomeFeedItem[]> {
  const locale: Locale = isLocale(localeInput) ? localeInput : "en";
  if (businesses.length === 0) return [];

  const ids = businesses.map((b) => b.id);
  const [categories, engagementCounts, likedBusinessIds, savedBusinessIds, businessIdsWithStories] = await Promise.all([
    listCategories(),
    getBusinessEngagementCounts(ids),
    getUserLikedBusinessIds(userId),
    getUserSavedBusinessIds(userId),
    getBusinessIdsWithActiveStories(ids),
  ]);

  const likedSet = new Set(likedBusinessIds);
  const savedSet = new Set(savedBusinessIds);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return businesses.map((business) => {
    const category = business.categoryId ? categoryById.get(business.categoryId) : undefined;
    const counts = engagementCounts[business.id] ?? { likes: 0, comments: 0 };

    return {
      business,
      categoryName: category ? (locale === "ar" ? category.name.ar : category.name.en) : undefined,
      categoryIconId: category?.iconId,
      initialLikeCount: counts.likes,
      initialLiked: likedSet.has(business.id),
      initialSaved: savedSet.has(business.id),
      commentCount: counts.comments,
      hasStories: businessIdsWithStories.has(business.id),
    };
  });
}
