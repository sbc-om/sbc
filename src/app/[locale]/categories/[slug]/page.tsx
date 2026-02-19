import { notFound } from "next/navigation";
import Link from "next/link";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { getUserFollowedCategoryIds } from "@/lib/db/follows";
import { listBusinessesWithActiveStories } from "@/lib/db/stories";
import {
  getBusinessLikeCount,
  hasUserLikedBusiness,
  hasUserSavedBusiness,
  getBusinessComments,
} from "@/lib/db/businessEngagement";
import { toggleBusinessLikeAction, toggleBusinessSaveAction } from "../../home/actions";
import { AppPage } from "@/components/AppPage";
import { BusinessFeedCard } from "@/components/BusinessFeedCard";
import { CategoryFollowButton } from "@/components/categories/CategoryFollowButton";
import { renderCategoryIcon } from "@/lib/icons/categoryIcons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  // Find category by slug
  const allCategories = await listCategories();
  const category = allCategories.find((c) => c.slug === slug);

  if (!category) notFound();

  // Get businesses for this category
  const allBusinesses = await listBusinesses();
  const businesses = allBusinesses.filter((b) => b.categoryId === category.id);
  
  // Get businesses with stories
  const businessesWithStories = await listBusinessesWithActiveStories();
  const businessIdsWithStories = new Set(businessesWithStories.map(b => b.businessId));

  // Check if user follows this category
  const followedCategoryIds = new Set(await getUserFollowedCategoryIds(user.id));
  const isFollowing = followedCategoryIds.has(category.id);

  // Prepare engagement data for each business
  const businessesWithEngagement = await Promise.all(businesses.map(async (b) => {
    const comments = await getBusinessComments(b.id);
    const approvedComments = comments.filter((c) => c.status === "approved");

    return {
      business: b,
      categoryName: locale === "ar" ? category.name.ar : category.name.en,
      categoryIconId: category.iconId,
      initialLikeCount: await getBusinessLikeCount(b.id),
      initialLiked: await hasUserLikedBusiness(user.id, b.id),
      initialSaved: await hasUserSavedBusiness(user.id, b.id),
      commentCount: approvedComments.length,
      hasStories: businessIdsWithStories.has(b.id),
    };
  }));

  const t = {
    back: locale === "ar" ? "رجوع" : "Back",
    businesses: locale === "ar" ? "أنشطة تجارية" : "businesses",
    noBusinesses: locale === "ar" ? "لا توجد أنشطة تجارية في هذا التصنيف" : "No businesses in this category",
  };

  return (
    <AppPage>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${locale}/categories`}
          className="flex items-center gap-2 text-sm text-(--muted-foreground) hover:text-foreground transition-colors"
        >
          {locale === "ar" ? <IoArrowForward className="w-5 h-5" /> : <IoArrowBack className="w-5 h-5" />}
          {t.back}
        </Link>
      </div>

      {/* Category Header */}
      <div className="sbc-card rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            {renderCategoryIcon(category.iconId, "w-8 h-8 sm:w-10 sm:h-10 text-accent")}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {locale === "ar" ? category.name.ar : category.name.en}
            </h1>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {businesses.length} {t.businesses}
            </p>
          </div>
          <CategoryFollowButton
            locale={locale as Locale}
            categoryId={category.id}
            initialFollowing={isFollowing}
            size="md"
          />
        </div>
      </div>

      {/* Businesses Grid */}
      {businesses.length === 0 ? (
        <div className="sbc-card rounded-2xl p-12 text-center">
          <p className="text-(--muted-foreground)">{t.noBusinesses}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              hasStories={item.hasStories}
            />
          ))}
        </div>
      )}
    </AppPage>
  );
}
