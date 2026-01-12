import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { listCategories } from "@/lib/db/categories";
import { getFollowedCategoryIds } from "@/lib/db/follows";
import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { followCategoryAction, unfollowCategoryAction } from "./actions";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale as Locale);

  const categories = listCategories({ locale: locale as Locale });
  const followed = new Set(getFollowedCategoryIds(user.id));

  return (
    <AppPage>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {locale === "ar" ? "التصنيفات" : "Categories"}
            </h1>
            <p className="mt-1 text-sm text-(--muted-foreground)">
              {locale === "ar"
                ? "تابع التصنيفات لمشاهدة الأعمال الجديدة فيها."
                : "Follow categories to see new businesses in them."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const name = locale === "ar" ? c.name.ar : c.name.en;
            const isFollowed = followed.has(c.id);

            return (
              <div
                key={c.id}
                className="sbc-card rounded-2xl p-5 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="font-semibold truncate">{name}</div>
                  <div className="mt-1 text-xs text-(--muted-foreground)">
                    /{c.slug}
                  </div>
                </div>

                {isFollowed ? (
                  <form action={unfollowCategoryAction.bind(null, locale as Locale, c.id)}>
                    <button
                      type="submit"
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      {locale === "ar" ? "متابعة ✓" : "Following ✓"}
                    </button>
                  </form>
                ) : (
                  <form action={followCategoryAction.bind(null, locale as Locale, c.id)}>
                    <button
                      type="submit"
                      className={buttonVariants({ variant: "primary", size: "sm" })}
                    >
                      {locale === "ar" ? "متابعة" : "Follow"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}

          {categories.length === 0 ? (
            <div className="text-center py-12 text-(--muted-foreground) sm:col-span-2 lg:col-span-3">
              {locale === "ar" ? "لا توجد تصنيفات بعد." : "No categories yet."}
            </div>
          ) : null}
        </div>

        <div className="mt-10 text-xs text-(--muted-foreground)">
          {locale === "ar"
            ? "ملاحظة: سيتم عرض الأعمال في صفحة Home بحسب التصنيفات التي تتابعها."
            : "Note: Your Home feed shows businesses from the categories you follow."}
        </div>
    </AppPage>
  );
}
