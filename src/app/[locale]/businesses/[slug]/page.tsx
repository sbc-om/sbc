import { notFound } from "next/navigation";
import Link from "next/link";

import { PublicPage } from "@/components/PublicPage";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getBusinessBySlug, getBusinessByUsername } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { PublicBusinessView } from "@/components/business/PublicBusinessView";

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

  const category = business.categoryId ? getCategoryById(business.categoryId) : null;

  const handlePath = business.username
    ? `/@${business.username}`
    : `/${locale}/businesses/${business.slug}`;

  const mapQuery = [business.address, business.city].filter(Boolean).join(" ").trim();
  const mapsHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

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
    </PublicPage>
  );
}
