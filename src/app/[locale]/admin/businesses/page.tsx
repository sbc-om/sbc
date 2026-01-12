import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";
import { BusinessCard } from "../BusinessCard";

export const runtime = "nodejs";

export default async function AdminBusinessesPage({
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
  const ar = locale === "ar";

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "إدارة الأنشطة التجارية" : "Manage Businesses"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? `${businesses.length} نشاط تجاري مسجل` : `${businesses.length} registered businesses`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/admin`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {ar ? "العودة" : "Back"}
          </Link>
          <Link
            href={`/${locale}/admin/new`}
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            {ar ? "إضافة نشاط" : "Add Business"}
          </Link>
        </div>
      </div>

      <div className="grid gap-3">
        {businesses.length === 0 ? (
          <div className="sbc-card p-6 text-center">
            <div className="text-sm text-(--muted-foreground)">
              {ar ? "لا توجد أنشطة تجارية بعد." : "No businesses yet."}
            </div>
            <Link
              href={`/${locale}/admin/new`}
              className={buttonVariants({ variant: "primary", size: "sm", className: "mt-4" })}
            >
              {ar ? "إضافة أول نشاط" : "Add your first business"}
            </Link>
          </div>
        ) : (
          businesses.map((b) => {
            const categoryName = b.categoryId && categoriesById.has(b.categoryId)
              ? (ar ? categoriesById.get(b.categoryId)!.name.ar : categoriesById.get(b.categoryId)!.name.en)
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
    </AppPage>
  );
}
