import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { PageContainer } from "@/components/PageContainer";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";
import { BusinessCard } from "./BusinessCard";

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
    <PageContainer>
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
          <div className="sbc-card p-6 text-center">
            <div className="text-sm text-(--muted-foreground)">
              {locale === "ar" ? "لا توجد أعمال بعد." : "No businesses yet."}
            </div>
            <Link
              href={`/${locale}/admin/new`}
              className={buttonVariants({ variant: "primary", size: "sm", className: "mt-4" })}
            >
              {locale === "ar" ? "إضافة أول عمل" : "Add your first business"}
            </Link>
          </div>
        ) : (
          businesses.map((b) => {
            const categoryName = b.categoryId && categoriesById.has(b.categoryId)
              ? (locale === "ar" ? categoriesById.get(b.categoryId)!.name.ar : categoriesById.get(b.categoryId)!.name.en)
              : b.category;

            return (
              <BusinessCard
                key={b.id}
                business={b}
                locale={locale as Locale}
                categoryName={categoryName}
              />
            );
          })
        )}
      </div>
    </Container>
    </PageContainer>
  );
}
