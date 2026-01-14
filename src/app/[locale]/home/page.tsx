import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { getFollowedCategoryIds } from "@/lib/db/follows";
import { getCategoryById } from "@/lib/db/categories";
import {
  getBusinessLikeCount,
  hasUserLikedBusiness,
  hasUserSavedBusiness,
  listBusinessComments,
} from "@/lib/db/businessEngagement";
import { toggleBusinessLikeAction, toggleBusinessSaveAction } from "./actions";
import { AppPage } from "@/components/AppPage";
import { BusinessFeedCard } from "@/components/BusinessFeedCard";
import { FeedProfileHeader } from "@/components/FeedProfileHeader";

export default async function HomeFollowedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);
  const user = await requireUser(locale as Locale);

  const viewUser = {
    displayName: user.displayName ?? user.email.split("@")[0],
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
  };

  const followedCategoryIds = new Set(getFollowedCategoryIds(user.id));
  const allBusinesses = listBusinesses({ locale: locale as Locale });

  const businesses = allBusinesses.filter((b) =>
    b.categoryId ? followedCategoryIds.has(b.categoryId) : false,
  );

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
      <FeedProfileHeader user={viewUser} locale={locale as Locale} />

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

        {followedCategoryIds.size > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2 text-xs text-(--muted-foreground)">
            <span>{locale === "ar" ? "تتابع:" : "Following:"}</span>
            {Array.from(followedCategoryIds).slice(0, 12).map((id) => {
              const c = getCategoryById(id);
              if (!c) return null;
              const name = locale === "ar" ? c.name.ar : c.name.en;
              return (
                <span key={id} className="sbc-chip rounded-full px-2 py-0.5">
                  {name}
                </span>
              );
            })}
          </div>
        ) : null}
    </AppPage>
  );
}
