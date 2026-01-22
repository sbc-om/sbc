import { notFound } from "next/navigation";
import Link from "next/link";

import { PublicPage } from "@/components/PublicPage";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getBusinessBySlug, getBusinessByUsername, listBusinesses } from "@/lib/db/businesses";
import { listPublicBusinessCardsByBusiness } from "@/lib/db/businessCards";
import { getCategoryById } from "@/lib/db/categories";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { PublicBusinessView } from "@/components/business/PublicBusinessView";
import { AIRecommendations } from "@/components/ai/AIRecommendations";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();

  const business = slug.startsWith("@")
    ? getBusinessByUsername(slug)
    : getBusinessBySlug(slug);
  if (!business) notFound();
  const isOwner = user && business.ownerId && user.id === business.ownerId;
  const isAdmin = user?.role === "admin";
  const isApproved = business.isApproved ?? business.isVerified ?? false;
  if (!isApproved && !isOwner && !isAdmin) notFound();

  const category = business.categoryId ? getCategoryById(business.categoryId) : null;

  const handlePath = business.username
    ? `/@${business.username}`
    : `/${locale}/businesses/${business.slug}`;

  const mapQuery = [business.address, business.city].filter(Boolean).join(" ").trim();
  const mapsHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  const allBusinesses = listBusinesses({ locale: locale as Locale });
  const publicCards = listPublicBusinessCardsByBusiness(business.id);

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
      />

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
        <AIRecommendations
          currentBusiness={business}
          allBusinesses={allBusinesses}
          locale={locale as Locale}
        />
      </div>
    </PublicPage>
  );
}
