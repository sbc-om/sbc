import { PublicPage } from "@/components/PublicPage";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { notFound, redirect } from "next/navigation";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { BusinessesExplorer } from "@/components/BusinessesExplorer";
import { getCurrentUser } from "@/lib/auth/currentUser";

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

  const businesses = listBusinesses({ locale: locale as Locale });
  const categories = listCategories({ locale: locale as Locale });

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
        />
      </div>
    </PublicPage>
  );
}
