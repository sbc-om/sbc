import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listCategories } from "@/lib/db/categories";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants, Button } from "@/components/ui/Button";
import { deleteCategoryAction } from "@/app/[locale]/admin/categories/actions";
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";

export const runtime = "nodejs";

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

export default async function AdminCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const cats = listCategories();
  const sp = (await searchParams) ?? {};
  const error = sp.error ? decodeURIComponent(sp.error) : null;

  const title = locale === "ar" ? "التصنيفات" : "Categories";

  // Group categories by parent
  const parentCategories = cats.filter((c) => !c.parentId);
  const childMap = new Map<string, typeof cats>();
  
  for (const c of cats) {
    if (c.parentId) {
      const siblings = childMap.get(c.parentId) ?? [];
      siblings.push(c);
      childMap.set(c.parentId, siblings);
    }
  }

  // Orphan categories (without valid parent)
  const orphans = cats.filter((c) => {
    if (!c.parentId) return false;
    return !cats.some((p) => p.id === c.parentId);
  });

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "أضف وعدّل واحذف التصنيفات (ثنائية اللغة)." 
              : "Add, edit, and delete bilingual categories."}
          </p>
        </div>

        <Link
          href={`/${locale}/admin/categories/new`}
          className={buttonVariants({ variant: "primary", size: "sm", className: "h-10 px-4" })}
        >
          {locale === "ar" ? "إضافة تصنيف" : "Add category"}
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {locale === "ar" ? "خطأ: " : "Error: "}
          {error}
        </div>
      ) : null}

      <div className="mt-8 space-y-8">
        {cats.length === 0 ? (
          <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "لا توجد تصنيفات بعد." : "No categories yet."}
          </div>
        ) : null}

        {/* Parent Categories with their children */}
        {parentCategories.map((parent) => {
          const children = childMap.get(parent.id) ?? [];
          const ParentIcon = getCategoryIconComponent(parent.iconId);
          const parentAccent = iconAccent(parent.iconId);

          return (
            <section key={`group:${parent.id}`} className="space-y-3">
              {/* Parent Category Header */}
              <div className="sbc-card rounded-2xl p-5 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {parent.image ? (
                    <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border border-(--surface-border)">
                      <Image
                        src={parent.image}
                        alt={locale === "ar" ? parent.name.ar : parent.name.en}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`h-14 w-14 shrink-0 rounded-xl border border-(--surface-border) flex items-center justify-center ${parentAccent.bg}`}>
                      <ParentIcon className={`h-8 w-8 ${parentAccent.fg}`} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-base font-bold">
                        {locale === "ar" ? parent.name.ar : parent.name.en}
                      </div>
                      <span className="shrink-0 rounded-full bg-(--chip-bg) px-2 py-0.5 text-xs font-medium text-(--muted-foreground)">
                        {locale === "ar" ? "رئيسي" : "Parent"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
                      <span className="font-mono">{parent.slug}</span>
                      <span className="truncate">EN: {parent.name.en}</span>
                      <span className="truncate">AR: {parent.name.ar}</span>
                      {children.length > 0 && (
                        <span className="font-medium">
                          {children.length} {locale === "ar" ? "فرعي" : "subcategories"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 mt-3 sm:mt-0">
                  <Link
                    href={`/${locale}/admin/categories/${parent.id}/edit`}
                    className={buttonVariants({ variant: "secondary", size: "xs" })}
                  >
                    {locale === "ar" ? "تعديل" : "Edit"}
                  </Link>
                  <form action={deleteCategoryAction.bind(null, locale as Locale, parent.id)}>
                    <Button variant="destructive" size="xs" type="submit">
                      {locale === "ar" ? "حذف" : "Delete"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Child Categories */}
              {children.length > 0 && (
                <div className="grid gap-3 ps-4 sm:ps-8">
                  {children.map((c) => {
                    const Icon = getCategoryIconComponent(c.iconId);
                    const accent = iconAccent(c.iconId);

                    return (
                      <div
                        key={`child-${parent.id}-${c.id}`}
                        className="sbc-card rounded-2xl p-4 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {c.image ? (
                            <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-(--surface-border)">
                              <Image
                                src={c.image}
                                alt={locale === "ar" ? c.name.ar : c.name.en}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`h-10 w-10 shrink-0 rounded-lg border border-(--surface-border) flex items-center justify-center ${accent.bg}`}>
                              <Icon className={`h-5 w-5 ${accent.fg}`} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {locale === "ar" ? c.name.ar : c.name.en}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
                              <span className="font-mono">{c.slug}</span>
                              <span className="truncate">EN: {c.name.en}</span>
                              <span className="truncate">AR: {c.name.ar}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 mt-3 sm:mt-0">
                          <Link
                            href={`/${locale}/admin/categories/${c.id}/edit`}
                            className={buttonVariants({ variant: "secondary", size: "xs" })}
                          >
                            {locale === "ar" ? "تعديل" : "Edit"}
                          </Link>
                          <form action={deleteCategoryAction.bind(null, locale as Locale, c.id)}>
                            <Button variant="destructive" size="xs" type="submit">
                              {locale === "ar" ? "حذف" : "Delete"}
                            </Button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {/* Orphan Categories (without valid parent) */}
        {orphans.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-(--surface-border)"></div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
                {locale === "ar" ? "تصنيفات بدون مجموعة" : "Uncategorized"}
              </h2>
              <div className="h-px flex-1 bg-(--surface-border)"></div>
            </div>

            <div className="grid gap-3">
              {orphans.map((c) => {
                const Icon = getCategoryIconComponent(c.iconId);
                const accent = iconAccent(c.iconId);

                return (
                  <div
                    key={`orphan-${c.id}`}
                    className="sbc-card rounded-2xl p-4 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.image ? (
                        <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-(--surface-border)">
                          <Image
                            src={c.image}
                            alt={locale === "ar" ? c.name.ar : c.name.en}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`h-10 w-10 shrink-0 rounded-lg border border-(--surface-border) flex items-center justify-center ${accent.bg}`}>
                          <Icon className={`h-5 w-5 ${accent.fg}`} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {locale === "ar" ? c.name.ar : c.name.en}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
                          <span className="font-mono">{c.slug}</span>
                          <span className="truncate">EN: {c.name.en}</span>
                          <span className="truncate">AR: {c.name.ar}</span>
                          <span className="text-amber-600 dark:text-amber-400">
                            ⚠️ {locale === "ar" ? "والد نامعتبر" : "Invalid parent"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 mt-3 sm:mt-0">
                      <Link
                        href={`/${locale}/admin/categories/${c.id}/edit`}
                        className={buttonVariants({ variant: "secondary", size: "xs" })}
                      >
                        {locale === "ar" ? "تعديل" : "Edit"}
                      </Link>
                      <form action={deleteCategoryAction.bind(null, locale as Locale, c.id)}>
                        <Button variant="destructive" size="xs" type="submit">
                          {locale === "ar" ? "حذف" : "Delete"}
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AppPage>
  );
}
