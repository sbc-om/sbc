import { PublicPage } from "@/components/PublicPage";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { notFound, redirect } from "next/navigation";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { listBusinessesWithActiveStories } from "@/lib/db/stories";
import { BusinessesExplorer } from "@/components/BusinessesExplorer";
import { getCurrentUser } from "@/lib/auth/currentUser";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const ar = locale === "ar";
  const title = ar ? "دليل الأنشطة التجارية" : "Business Directory";
  const description = ar
    ? "استكشف الأنشطة التجارية الموثوقة مع بحث متقدم وفلاتر ذكية حسب التصنيف والموقع."
    : "Explore trusted businesses with advanced search and smart filters by category and location.";
  const canonical = `/${locale}/businesses`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: ar ? "ar_OM" : "en_US",
      url: canonical,
      title,
      description,
      images: [
        {
          url: "/images/sbc.svg",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/sbc.svg"],
    },
  };
}

export default async function BusinessesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Logged-in users should use the in-app Explorer (no fixed header => no top padding).
  const user = await getCurrentUser();
  if (user) redirect(`/${locale}/explorer`);

  const dict = await getDictionary(locale as Locale);

  const [businesses, categories, businessesWithStories] = await Promise.all([
    listBusinesses(),
    listCategories(),
    listBusinessesWithActiveStories(),
  ]);

  return (
    <PublicPage>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{dict.businesses.title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "بحث متقدم مع فلاتر قوية"
              : "Advanced search with powerful filters"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <BusinessesExplorer
          locale={locale as Locale}
          dict={dict}
          businesses={businesses}
          categories={categories}
          detailsBasePath="/businesses"
          businessIdsWithStories={new Set(businessesWithStories.map(b => b.businessId))}
        />
      </div>
    </PublicPage>
  );
}
