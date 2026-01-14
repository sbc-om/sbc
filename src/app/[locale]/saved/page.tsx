import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import {
  getBusinessLikeCount,
  hasUserLikedBusiness,
  hasUserSavedBusiness,
  getUserSavedBusinessIds,
  listBusinessComments,
} from "@/lib/db/businessEngagement";
import { toggleBusinessLikeAction, toggleBusinessSaveAction } from "../home/actions";
import { AppPage } from "@/components/AppPage";
import { BusinessFeedCard } from "@/components/BusinessFeedCard";

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  // Get saved business IDs
  const savedBusinessIds = getUserSavedBusinessIds(user.id);

  // Get full business objects
  const businesses = savedBusinessIds
    .map((id) => getBusinessById(id))
    .filter((b) => b !== null);

  // Prepare engagement data for each business
  const businessesWithEngagement = businesses.map((b) => {
    const category = b.categoryId ? getCategoryById(b.categoryId) : null;
    const comments = listBusinessComments(b.id);
    const approvedComments = comments.filter((c) => c.status === "approved");

    return {
      business: b,
      categoryName: category ? (locale === "ar" ? category.name.ar : category.name.en) : undefined,
      categoryIconId: category?.iconId,
      initialLikeCount: getBusinessLikeCount(b.id),
      initialLiked: hasUserLikedBusiness(user.id, b.id),
      initialSaved: hasUserSavedBusiness(user.id, b.id),
      commentCount: approvedComments.length,
    };
  });

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {locale === "ar" ? "المحفوظات" : "Saved"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "الأعمال التي قمت بحفظها"
              : "Businesses you've saved"}
          </p>
        </div>
      </div>

      {businessesWithEngagement.length === 0 ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-(--muted-foreground) opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <p className="mt-4 text-base font-medium">
              {locale === "ar" ? "لا توجد أعمال محفوظة" : "No saved businesses"}
            </p>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "عندما تحفظ أعمالاً، ستظهر هنا"
                : "When you save businesses, they'll appear here"}
            </p>
          </div>
        </div>
      ) : (
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
            />
          ))}
        </div>
      )}
    </AppPage>
  );
}
