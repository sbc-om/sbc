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

      <div className="mt-8 grid gap-3">
        {cats.length === 0 ? (
          <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "لا توجد تصنيفات بعد." : "No categories yet."}
          </div>
        ) : null}

        {cats.map((c) => (
          <div
            key={c.id}
            className="sbc-card rounded-2xl p-5 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              {c.image ? (
                <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-(--surface-border)">
                  <Image
                    src={c.image}
                    alt={locale === "ar" ? c.name.ar : c.name.en}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-lg border border-(--surface-border) bg-(--chip-bg) flex items-center justify-center">
                  {(() => {
                    const Icon = getCategoryIconComponent(c.iconId);
                    return <Icon className="h-6 w-6 text-(--muted-foreground)" />;
                  })()}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {locale === "ar" ? c.name.ar : c.name.en}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
                  <span className="font-mono">{c.slug}</span>
                  <span className="truncate">EN: {c.name.en}</span>
                  <span className="truncate">AR: {c.name.ar}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
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
        ))}
      </div>
    </AppPage>
  );
}
