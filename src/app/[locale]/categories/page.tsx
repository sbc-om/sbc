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
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";

const ICON_PALETTE = [
  { bg: "bg-sky-500/12", fg: "text-sky-700 dark:text-sky-300" },
  { bg: "bg-indigo-500/12", fg: "text-indigo-700 dark:text-indigo-300" },
  { bg: "bg-violet-500/12", fg: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-fuchsia-500/12", fg: "text-fuchsia-700 dark:text-fuchsia-300" },
  { bg: "bg-rose-500/12", fg: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-orange-500/12", fg: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-amber-500/12", fg: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-emerald-500/12", fg: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-teal-500/12", fg: "text-teal-700 dark:text-teal-300" },
  { bg: "bg-cyan-500/12", fg: "text-cyan-700 dark:text-cyan-300" },
  { bg: "bg-lime-500/12", fg: "text-lime-800 dark:text-lime-300" },
];

function hashString(s: string) {
  // Small, stable hash for deterministic color assignment.
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function iconAccent(iconId: string | undefined) {
  const id = (iconId ?? "generic").trim() || "generic";
  const idx = hashString(id) % ICON_PALETTE.length;
  return ICON_PALETTE[idx]!;
}

export default async function CategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale as Locale);

  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const qLower = q.toLowerCase();

  // Fetch all categories for correct parent grouping; apply search filter here.
  const categories = listCategories({ locale: locale as Locale });
  
  // Defensive: Filter out categories without id and remove duplicates
  const validCategories = categories.filter(c => c.id);
  const uniqueCategories = Array.from(
    new Map(validCategories.map((c) => [c.id, c] as const)).values(),
  );

  // Parent/child ordering: show parent then its children.
  const byId = new Map(uniqueCategories.map((c) => [c.id, c] as const));

  function matchesSearch(c: (typeof uniqueCategories)[number]) {
    if (!qLower) return true;
    const hay = `${c.name.en} ${c.name.ar} ${c.slug}`.toLowerCase();
    return hay.includes(qLower);
  }

  const included = uniqueCategories.filter(matchesSearch);
  const includedIds = new Set(included.map((c) => c.id));
  const includedGroupIds = new Set<string>();

  for (const c of included) {
    const pid = c.parentId && byId.has(c.parentId) ? c.parentId : c.id;
    includedGroupIds.add(pid);
  }

  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const topLevel = uniqueCategories
    .filter((c) => !(c.parentId && byId.has(c.parentId)))
    .filter((c) => (qLower ? includedGroupIds.has(c.id) || includedIds.has(c.id) : true))
    .sort((a, b) =>
      collator.compare(
        locale === "ar" ? a.name.ar : a.name.en,
        locale === "ar" ? b.name.ar : b.name.en,
      ),
    );

  const childrenByParent = new Map<string, (typeof uniqueCategories)[number][]>();
  for (const c of uniqueCategories) {
    if (c.parentId && byId.has(c.parentId)) {
      const list = childrenByParent.get(c.parentId) ?? [];
      list.push(c);
      childrenByParent.set(c.parentId, list);
    }
  }
  for (const [pid, list] of childrenByParent) {
    const sorted = list
      .slice()
      .filter((c) => (qLower ? includedIds.has(c.id) : true))
      .sort((a, b) =>
        collator.compare(
          locale === "ar" ? a.name.ar : a.name.en,
          locale === "ar" ? b.name.ar : b.name.en,
        ),
      );
    childrenByParent.set(pid, sorted);
  }

  const groups = topLevel.map((parent) => ({
    parent,
    children: childrenByParent.get(parent.id) ?? [],
  }));

  const hasAnyResults = groups.some((g) => matchesSearch(g.parent) || g.children.length > 0);
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

      <div className="mt-6">
        <form method="GET">
          <div className="sbc-card rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-(--muted-foreground)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder={locale === "ar" ? "ابحث عن تصنيف..." : "Search categories..."}
                className="flex-1 bg-transparent outline-none"
              />
              {q ? (
                <a
                  href={`/${locale}/categories`}
                  className={buttonVariants({ variant: "ghost", size: "xs" })}
                >
                  {locale === "ar" ? "مسح" : "Clear"}
                </a>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8 grid gap-7">
        {hasAnyResults ? (
          groups.map(({ parent, children }) => {
            const parentName = locale === "ar" ? parent.name.ar : parent.name.en;
            const parentFollowed = followed.has(parent.id);
            const ParentIcon = getCategoryIconComponent(parent.iconId);
            const parentAccent = iconAccent(parent.iconId);

            // When searching, show parent section if parent matches or it has matching children.
            if (qLower && !matchesSearch(parent) && children.length === 0) return null;

            return (
              <section key={`group:${parent.id}`} className="grid gap-3">
                <div className="sbc-card rounded-2xl p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-11 w-11 shrink-0 rounded-xl border border-(--surface-border) flex items-center justify-center ${parentAccent.bg}`}>
                      <ParentIcon className={`h-6 w-6 ${parentAccent.fg}`} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-foreground">{parentName}</h2>
                      {children.length > 0 ? (
                        <p className="mt-0.5 text-xs text-(--muted-foreground)">
                          {locale === "ar" ? `${children.length} فروع` : `${children.length} subcategories`}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                    {parentFollowed ? (
                      <form action={unfollowCategoryAction.bind(null, locale as Locale, parent.id)}>
                        <button type="submit" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                          {locale === "ar" ? "متابعة ✓" : "Following ✓"}
                        </button>
                      </form>
                    ) : (
                      <form action={followCategoryAction.bind(null, locale as Locale, parent.id)}>
                        <button type="submit" className={buttonVariants({ variant: "primary", size: "sm" })}>
                          {locale === "ar" ? "متابعة" : "Follow"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {children.length > 0 ? (
                  <div className="grid gap-3 ps-4 sm:ps-8">
                    {children.map((c) => {
                      const name = locale === "ar" ? c.name.ar : c.name.en;
                      const isFollowed = followed.has(c.id);
                      const Icon = getCategoryIconComponent(c.iconId);
                      const accent = iconAccent(c.iconId);

                      return (
                        <div
                          key={c.id}
                          className="sbc-card rounded-2xl p-5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
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
                                <div className={`flex h-full w-full items-center justify-center ${accent.bg}`}>
                                  <Icon className={`h-7 w-7 ${accent.fg}`} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{name}</div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                            {isFollowed ? (
                              <form action={unfollowCategoryAction.bind(null, locale as Locale, c.id)}>
                                <button type="submit" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                                  {locale === "ar" ? "متابعة ✓" : "Following ✓"}
                                </button>
                              </form>
                            ) : (
                              <form action={followCategoryAction.bind(null, locale as Locale, c.id)}>
                                <button type="submit" className={buttonVariants({ variant: "primary", size: "sm" })}>
                                  {locale === "ar" ? "متابعة" : "Follow"}
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })
        ) : (
          <div className="text-center py-12 text-(--muted-foreground)">
            {q
              ? (locale === "ar" ? "لا توجد نتائج." : "No results.")
              : (locale === "ar" ? "لا توجد تصنيفات بعد." : "No categories yet.")}
          </div>
        )}
      </div>

      <div className="mt-10 text-xs text-(--muted-foreground)">
        {locale === "ar"
          ? "ملاحظة: سيتم عرض الأعمال في صفحة Home بحسب التصنيفات التي تتابعها."
          : "Note: Your Home feed shows businesses from the categories you follow."}
      </div>
    </AppPage>
  );
}
