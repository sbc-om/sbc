import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { deleteBusinessAction } from "@/app/[locale]/admin/actions";
import { buttonVariants, Button } from "@/components/ui/Button";

export const runtime = "nodejs";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const businesses = listBusinesses();
  const categories = listCategories();
  const categoriesById = new Map(categories.map((c) => [c.id, c] as const));

  return (
    <Container>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{dict.nav.admin}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "إدارة دليل الأعمال" : "Manage your business directory"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/admin/categories`}
            className={buttonVariants({ variant: "secondary", size: "sm", className: "h-10 px-4" })}
          >
            {locale === "ar" ? "التصنيفات" : "Categories"}
          </Link>
          <Link
            href={`/${locale}/admin/new`}
            className={buttonVariants({ variant: "primary", size: "sm", className: "h-10 px-4" })}
          >
            {locale === "ar" ? "إضافة عمل" : "Add business"}
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        {businesses.length === 0 ? (
          <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "لا توجد أعمال بعد." : "No businesses yet."}
          </div>
        ) : null}

        {businesses.map((b) => (
          <div
            key={b.id}
            className="sbc-card rounded-2xl p-5 sm:flex sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {locale === "ar" ? b.name.ar : b.name.en}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
                <span className="font-mono">/{b.slug}</span>
                {b.city ? <span>{b.city}</span> : null}
                {b.categoryId && categoriesById.has(b.categoryId) ? (
                  <span>
                    {locale === "ar"
                      ? categoriesById.get(b.categoryId)!.name.ar
                      : categoriesById.get(b.categoryId)!.name.en}
                  </span>
                ) : b.category ? (
                  <span>{b.category}</span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/${locale}/businesses/${b.slug}`}
                className={buttonVariants({ variant: "secondary", size: "xs" })}
              >
                {locale === "ar" ? "عرض" : "View"}
              </Link>
              <Link
                href={`/${locale}/admin/${b.id}/edit`}
                className={buttonVariants({ variant: "secondary", size: "xs" })}
              >
                {locale === "ar" ? "تعديل" : "Edit"}
              </Link>
              <form action={deleteBusinessAction.bind(null, locale as Locale, b.id)}>
                <Button variant="destructive" size="xs" type="submit">
                  {locale === "ar" ? "حذف" : "Delete"}
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
