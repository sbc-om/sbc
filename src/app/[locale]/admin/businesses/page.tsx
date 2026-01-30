import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BusinessCard } from "../BusinessCard";

export const runtime = "nodejs";

export default async function AdminBusinessesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string; filter?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const filter = typeof sp.filter === "string" ? sp.filter : "all";

  const businesses = await listBusinesses();
  const categories = await listCategories();
  const categoriesById = new Map(categories.map((c) => [c.id, c] as const));
  const ar = locale === "ar";
  const pendingCount = businesses.filter((b) => !(b.isApproved ?? b.isVerified)).length;
  const approvedCount = businesses.filter((b) => (b.isApproved ?? b.isVerified)).length;
  const totalCount = businesses.length;

  const filteredBusinesses = businesses.filter((b) => {
    const approved = b.isApproved ?? b.isVerified ?? false;
    if (filter === "pending" && approved) return false;
    if (filter === "approved" && !approved) return false;

    if (!q) return true;
    const hay = [
      `${b.name.en} ${b.name.ar}`,
      b.username,
      b.slug,
      b.category,
      b.city,
      b.tags?.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "إدارة الأنشطة التجارية" : "Manage Businesses"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? `${totalCount} نشاط تجاري مسجل` : `${totalCount} registered businesses`}
            {pendingCount > 0 && (
              <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                {ar ? `${pendingCount} قيد المراجعة` : `${pendingCount} pending review`}
              </span>
            )}
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

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/${locale}/admin/businesses?filter=all${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={buttonVariants({
            variant: filter === "all" ? "primary" : "secondary",
            size: "sm",
          })}
        >
          {ar ? "الكل" : "All"}
          <span className="ms-2 text-xs opacity-70">{totalCount}</span>
        </Link>
        <Link
          href={`/${locale}/admin/businesses?filter=pending${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={buttonVariants({
            variant: filter === "pending" ? "primary" : "secondary",
            size: "sm",
          })}
        >
          {ar ? "قيد المراجعة" : "Pending"}
          <span className="ms-2 text-xs opacity-70">{pendingCount}</span>
        </Link>
        <Link
          href={`/${locale}/admin/businesses?filter=approved${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={buttonVariants({
            variant: filter === "approved" ? "primary" : "secondary",
            size: "sm",
          })}
        >
          {ar ? "معتمد" : "Approved"}
          <span className="ms-2 text-xs opacity-70">{approvedCount}</span>
        </Link>

        <form className="ms-auto w-full sm:w-auto" action={`/${locale}/admin/businesses`}>
          <input type="hidden" name="filter" value={filter} />
          <div className="relative">
            <Input
              name="q"
              defaultValue={q}
              placeholder={ar ? "بحث في الأنشطة..." : "Search businesses..."}
              className="w-full sm:w-72"
            />
          </div>
        </form>
      </div>

      <div className="mt-6 grid gap-3">
        {filteredBusinesses.length === 0 ? (
          <div className="sbc-card p-6 text-center">
            <div className="text-sm text-(--muted-foreground)">
              {ar ? "لا توجد نتائج مطابقة." : "No matching businesses."}
            </div>
            <Link
              href={`/${locale}/admin/new`}
              className={buttonVariants({ variant: "primary", size: "sm", className: "mt-4" })}
            >
              {ar ? "إضافة أول نشاط" : "Add your first business"}
            </Link>
          </div>
        ) : (
          filteredBusinesses.map((b) => {
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
