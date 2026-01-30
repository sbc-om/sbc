import { notFound } from "next/navigation";
import Link from "next/link";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { getUserFollowedCategoryIds } from "@/lib/db/follows";
import { getCategoryById } from "@/lib/db/categories";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";

export const runtime = "nodejs";

export default async function ProfileFollowingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await requireUser(locale as Locale);
  const followedCategoryIds = await getUserFollowedCategoryIds(auth.id);
  
  const categories = (await Promise.all(
    followedCategoryIds.map(id => getCategoryById(id))
  )).filter((c): c is NonNullable<typeof c> => c !== null);

  const t = {
    title: locale === "ar" ? "التصنيفات المتابعة" : "Following Categories",
    back: locale === "ar" ? "رجوع" : "Back",
    empty: locale === "ar" ? "لا تتابع أي تصنيفات" : "You are not following any categories",
  };

  return (
    <AppPage>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-2 text-sm text-(--muted-foreground) hover:text-foreground transition-colors"
        >
          {locale === "ar" ? <IoArrowForward className="w-5 h-5" /> : <IoArrowBack className="w-5 h-5" />}
          {t.back}
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {categories.length} {locale === "ar" ? "تصنيف" : "categories"}
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="sbc-card rounded-2xl p-12 text-center">
          <p className="text-(--muted-foreground)">{t.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category) => {
            const CategoryIcon = getCategoryIconComponent(category.iconId);
            return (
            <Link
              key={category.id}
              href={`/${locale}/categories/${category.slug}`}
              className="sbc-card rounded-2xl p-4 flex flex-col items-center gap-3 hover:ring-2 hover:ring-accent/20 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <CategoryIcon className="w-8 h-8 text-accent" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{category.name[locale as Locale]}</p>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </AppPage>
  );
}
