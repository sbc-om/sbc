import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { PageContainer } from "@/components/PageContainer";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listCategories } from "@/lib/db/categories";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants, Button } from "@/components/ui/Button";
import { deleteCategoryAction } from "@/app/[locale]/admin/categories/actions";

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
    <PageContainer>
      <Container className="max-w-4xl">
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
            className="sbc-card rounded-2xl p-5 sm:flex sm:flex-row sm:items-center sm:justify-between"
          >
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
    </Container>
    </PageContainer>
  );
}
