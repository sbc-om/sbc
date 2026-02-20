import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessBySlug, getBusinessByUsername } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { getUserById } from "@/lib/db/users";
import { getActiveStoriesByBusiness, getStoriesByBusinessForOwner } from "@/lib/db/stories";
import {
  getBusinessLikeCount,
  hasUserLikedBusiness,
  getBusinessComments,
} from "@/lib/db/businessEngagement";
import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { ExplorerBusinessView } from "@/components/business/ExplorerBusinessView";
import { DeferredAIRecommendations } from "@/components/business/DeferredAIRecommendations";
import { BusinessPublishingPanel } from "@/components/business/BusinessPublishingPanel";
import { listBusinessNews, listBusinessProducts } from "@/lib/db/businessContent";
import { getInstagramPostsPreview } from "@/lib/social/instagram";

export default async function ExplorerBusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  const business = slug.startsWith("@")
    ? await getBusinessByUsername(slug)
    : await getBusinessBySlug(slug);
  if (!business) notFound();

  const category = business.categoryId ? await getCategoryById(business.categoryId) : null;

  const handlePath = business.username
    ? `/@${business.username}`
    : `/${locale}/businesses/${business.slug}`;

  const mapQuery = [business.address, business.city].filter(Boolean).join(" ").trim();
  const mapsHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  const likeCount = await getBusinessLikeCount(business.id);
  const liked = await hasUserLikedBusiness(user.id, business.id);

  const allComments = await getBusinessComments(business.id);
  const approvedComments = allComments.filter((c) => c.status === "approved");
  const myPendingComments = allComments.filter((c) => c.status === "pending" && c.userId === user.id);
  const canModerate = user.role === "admin" || (!!business.ownerId && business.ownerId === user.id);
  const pendingForModeration = canModerate ? allComments.filter((c) => c.status === "pending") : [];

  const needUserIds = new Set<string>();
  for (const c of approvedComments) needUserIds.add(c.userId);
  for (const c of myPendingComments) needUserIds.add(c.userId);
  for (const c of pendingForModeration) needUserIds.add(c.userId);

  const usersById: Record<string, { displayName?: string; email?: string } | undefined> = {};
  for (const id of needUserIds) {
    const u = await getUserById(id);
    usersById[id] = u ? { displayName: u.displayName, email: u.email } : undefined;
  }

  const isOwner = !!business.ownerId && business.ownerId === user.id;
  const canShowInstagramPosts = !!business.instagramUsername && (isOwner || business.instagramModerationStatus === "approved");

  const [newsItems, productItems, instagramPosts] = await Promise.all([
    listBusinessNews(business.id, {
      publishedOnly: !isOwner,
      approvedOnly: !isOwner,
      limit: 20,
    }),
    listBusinessProducts(business.id, {
      availableOnly: !isOwner,
      approvedOnly: !isOwner,
      limit: 50,
    }),
    canShowInstagramPosts ? getInstagramPostsPreview(String(business.instagramUsername), 6) : Promise.resolve([]),
  ]);

  // Fetch stories for this business
  const stories = isOwner
    ? await getStoriesByBusinessForOwner(business.id)
    : await getActiveStoriesByBusiness(business.id);

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0" />
        <Link
          href={`/${locale}/explorer`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {locale === "ar" ? "العودة" : "Back"}
        </Link>
      </div>

      <ExplorerBusinessView
        business={business}
        locale={locale as Locale}
        siteLocale={locale as Locale}
        user={user}
        category={category}
        categoryIconId={category?.iconId}
        handlePath={handlePath}
        mapsHref={mapsHref}
        likeCount={likeCount}
        liked={liked}
        approvedComments={approvedComments}
        myPendingComments={myPendingComments}
        pendingForModeration={pendingForModeration}
        canModerate={canModerate}
        usersById={usersById}
        isOwner={isOwner}
        stories={stories}
        beforeEngagement={(
          <BusinessPublishingPanel
            businessId={business.id}
            locale={locale as Locale}
            isOwner={isOwner}
            initialNews={newsItems}
            initialProducts={productItems}
            initialInstagramUsername={business.instagramUsername}
            initialInstagramPosts={instagramPosts}
            initialInstagramModerationStatus={business.instagramModerationStatus}
            showComposer={false}
            showContentSections
            hideEmptySections
          />
        )}
      />

      {isOwner ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0">
            <BusinessPublishingPanel
              businessId={business.id}
              locale={locale as Locale}
              isOwner
              initialNews={newsItems}
              initialProducts={productItems}
              initialInstagramUsername={business.instagramUsername}
              initialInstagramPosts={instagramPosts}
              initialInstagramModerationStatus={business.instagramModerationStatus}
              showComposer
              showContentSections={false}
            />
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
        </div>
      ) : null}

      <div className="mt-8">
        <Suspense
          fallback={(
            <div className="sbc-card rounded-2xl p-6">
              <div className="h-6 w-44 animate-pulse rounded-lg bg-(--surface-border)" />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="h-52 animate-pulse rounded-2xl bg-(--surface-border)" />
                <div className="h-52 animate-pulse rounded-2xl bg-(--surface-border)" />
                <div className="h-52 animate-pulse rounded-2xl bg-(--surface-border)" />
              </div>
            </div>
          )}
        >
          <DeferredAIRecommendations
            currentBusiness={business}
            locale={locale as Locale}
          />
        </Suspense>
      </div>
    </AppPage>
  );
}
