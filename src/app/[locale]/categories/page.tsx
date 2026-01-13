import { notFound } from "next/navigation";
import Image from "next/image";

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

      <div className="mt-8 grid gap-3">
          {categories.map((c) => {
            const name = locale === "ar" ? c.name.ar : c.name.en;
            const isFollowed = followed.has(c.id);

            return (
              <div
                key={c.id}
                className="sbc-card rounded-2xl p-5 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-(--surface-border) bg-(--surface)">
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-(--muted-foreground)">
                        {name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{name}</div>
                    <div className="mt-1 text-xs text-(--muted-foreground)">/{c.slug}</div>
                  </div>
                </div>

                <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">
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
              </div>
            );
          })}

          {categories.length === 0 ? (
            <div className="text-center py-12 text-(--muted-foreground)">
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
