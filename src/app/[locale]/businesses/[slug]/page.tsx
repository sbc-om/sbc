import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

import { PublicPage } from "@/components/PublicPage";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getBusinessBySlug, getBusinessByUsername } from "@/lib/db/businesses";
import { listPublicBusinessCardsByBusiness } from "@/lib/db/businessCards";
import { getCategoryById } from "@/lib/db/categories";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { PublicBusinessView } from "@/components/business/PublicBusinessView";
import { BusinessPublishingPanel } from "@/components/business/BusinessPublishingPanel";
import { DeferredAIRecommendations } from "@/components/business/DeferredAIRecommendations";
import { listBusinessNews, listBusinessProducts } from "@/lib/db/businessContent";
import { getInstagramPostsPreview } from "@/lib/social/instagram";
import { getActiveStoriesByBusiness, getStoriesByBusinessForOwner } from "@/lib/db/stories";

function getAbsoluteUrl(pathOrUrl: string | undefined) {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};

  const business = slug.startsWith("@")
    ? await getBusinessByUsername(slug)
    : await getBusinessBySlug(slug);

  if (!business) {
    const fallbackTitle = locale === "ar" ? "الأنشطة التجارية" : "Business Profile";
    const fallbackDescription = locale === "ar"
      ? "اكتشف الأنشطة التجارية والخدمات المتاحة."
      : "Discover business profiles and available services.";
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }

  const ar = locale === "ar";
  const businessName = ar ? business.name.ar : business.name.en;
  const category = business.category ? `${ar ? " • " : " • "}${business.category}` : "";
  const city = business.city ? `${ar ? " • " : " • "}${business.city}` : "";
  const title = `${businessName}${category}${city}`;
  const description = (ar ? business.description?.ar : business.description?.en)?.trim()
    || (ar
      ? `تعرف على ${businessName} وتفاصيل الخدمات وطرق التواصل.`
      : `Explore ${businessName}, its services, and contact details.`);

  const previewImage =
    getAbsoluteUrl(business.media?.banner)
    ?? getAbsoluteUrl(business.media?.cover)
    ?? getAbsoluteUrl(business.media?.logo)
    ?? getAbsoluteUrl("/images/sbc.svg");

  const canonical = `/${locale}/businesses/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: ar ? "ar_OM" : "en_US",
      url: canonical,
      title,
      description,
      images: previewImage
        ? [
            {
              url: previewImage,
              alt: businessName,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: previewImage ? [previewImage] : undefined,
    },
  };
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();

  const business = slug.startsWith("@")
    ? await getBusinessByUsername(slug)
    : await getBusinessBySlug(slug);
  if (!business) notFound();
  const isOwner = user && business.ownerId && user.id === business.ownerId;
  const isAdmin = user?.role === "admin";
  const isApproved = business.isApproved ?? business.isVerified ?? false;
  if (!isApproved && !isOwner && !isAdmin) notFound();

  const category = business.categoryId ? await getCategoryById(business.categoryId) : null;

  const handlePath = business.username
    ? `/@${business.username}`
    : `/${locale}/businesses/${business.slug}`;

  const mapQuery = [business.address, business.city].filter(Boolean).join(" ").trim();
  const mapsHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  const publicCards = await listPublicBusinessCardsByBusiness(business.id);
  const canShowInstagramPosts = !!business.instagramUsername && (isOwner || business.instagramModerationStatus === "approved");

  const [newsItems, productItems, instagramPosts, stories] = await Promise.all([
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
    isOwner ? getStoriesByBusinessForOwner(business.id) : getActiveStoriesByBusiness(business.id),
  ]);

  return (
    <PublicPage compactTop={!!user}>
      {/* Top bar */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0" />

        <Link
          href={`/${locale}/businesses`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {locale === "ar" ? "كل الأعمال" : "All businesses"}
        </Link>
      </div>

      <PublicBusinessView
        business={business}
        locale={locale as Locale}
        siteLocale={locale as Locale}
        category={category}
        categoryIconId={category?.iconId}
        handlePath={handlePath}
        mapsHref={mapsHref}
        stories={stories}
        currentUserId={user?.id}
        isOwner={!!isOwner}
        isAdmin={isAdmin}
      />

      <BusinessPublishingPanel
        businessId={business.id}
        locale={locale as Locale}
        isOwner={!!isOwner}
        initialNews={newsItems}
        initialProducts={productItems}
        initialInstagramUsername={business.instagramUsername}
        initialInstagramPosts={instagramPosts}
        initialInstagramModerationStatus={business.instagramModerationStatus}
        showComposer={false}
        showContentSections
        hideEmptySections
      />

      {isOwner ? (
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
      ) : null}

      {publicCards.length > 0 ? (
        <div className="mt-8 sbc-card rounded-2xl p-6">
          <div className="text-lg font-semibold">
            {locale === "ar" ? "بطاقات الأعمال" : "Business Cards"}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publicCards.map((card) => (
              <Link
                key={card.id}
                href={`/${locale}/business-card/${card.id}`}
                className="sbc-card sbc-card--interactive rounded-2xl p-4"
              >
                <div className="text-sm font-semibold">{card.fullName}</div>
                <div className="mt-1 text-xs text-(--muted-foreground)">
                  {card.title || (locale === "ar" ? "بدون مسمى" : "No title")}
                </div>
              </Link>
            ))}
          </div>
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
    </PublicPage>
  );
}
