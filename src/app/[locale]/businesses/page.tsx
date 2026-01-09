import Link from "next/link";
import Image from "next/image";

import { Container } from "@/components/Container";
import { PageContainer } from "@/components/PageContainer";
import { buttonVariants, Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { notFound } from "next/navigation";
import { listBusinesses } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";

export default async function BusinessesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  const { q, view } = await searchParams;
  const mode: "grid" | "list" = view === "list" ? "list" : "grid";
  const businesses = listBusinesses({ q, locale: locale as Locale });

  const viewHref = (nextView: "grid" | "list") => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    sp.set("view", nextView);
    const qs = sp.toString();
    return qs ? `/${locale}/businesses?${qs}` : `/${locale}/businesses`;
  };

  return (
    <PageContainer>
      <Container>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.businesses.title}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {businesses.length === 0 ? dict.businesses.empty : (
              locale === "ar"
                ? `عدد النتائج: ${businesses.length}`
                : `Results: ${businesses.length}`
            )}
          </p>
        </div>
        <Link
          href={`/${locale}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {locale === "ar" ? "العودة للرئيسية" : "Back to home"}
        </Link>
      </div>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        action={`/${locale}/businesses`}
      >
        <Input
          placeholder={dict.home.searchPlaceholder}
          name="q"
          defaultValue={q}
        />
        <Button type="submit">
          {locale === "ar" ? "بحث" : "Search"}
        </Button>
      </form>

      {/* View toggle */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-(--muted-foreground)">
          {locale === "ar" ? "طريقة العرض" : "View"}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={viewHref("grid")}
            className={buttonVariants({
              variant: mode === "grid" ? "primary" : "secondary",
              size: "sm",
            })}
          >
            {locale === "ar" ? "مربعات" : "Grid"}
          </Link>
          <Link
            href={viewHref("list")}
            className={buttonVariants({
              variant: mode === "list" ? "primary" : "secondary",
              size: "sm",
            })}
          >
            {locale === "ar" ? "قائمة" : "List"}
          </Link>
        </div>
      </div>

      {mode === "grid" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => {
            const name = locale === "ar" ? b.name.ar : b.name.en;
            const description = b.description ? (locale === "ar" ? b.description.ar : b.description.en) : "";
            const img = b.media?.cover || b.media?.banner || b.media?.logo;
            const logo = b.media?.logo;

            const category = b.categoryId ? getCategoryById(b.categoryId) : null;
            const categoryLabel = category
              ? (locale === "ar" ? category.name.ar : category.name.en)
              : (b.category || (locale === "ar" ? "عمل" : "Business"));

            return (
              <Link
                key={b.id}
                href={`/${locale}/businesses/${b.slug}`}
                className="group sbc-card sbc-card--interactive overflow-hidden rounded-2xl"
              >
                <div className="relative h-40 w-full bg-linear-to-br from-accent/10 via-accent-2/10 to-transparent">
                  {img ? (
                    <Image
                      src={img}
                      alt={name}
                      fill
                      sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-white drop-shadow">
                        {name}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="sbc-chip rounded-full px-2.5 py-1 text-xs font-medium">
                          {categoryLabel}
                        </span>
                        {b.city ? (
                          <span className="sbc-chip rounded-full px-2.5 py-1 text-xs font-medium">
                            {b.city}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {logo ? (
                      <div
                        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl"
                        style={{
                          background: "var(--background)",
                          border: "2px solid",
                          borderColor: "rgba(255,255,255,0.20)",
                        }}
                      >
                        <Image
                          src={logo}
                          alt={locale === "ar" ? "شعار" : "Logo"}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="p-5">
                  {description ? (
                    <p className="line-clamp-2 text-sm text-(--muted-foreground)">
                      {description}
                    </p>
                  ) : (
                    <p className="text-sm text-(--muted-foreground)">
                      {locale === "ar" ? "لا يوجد وصف" : "No description"}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--muted-foreground)">
                    <span className="font-mono">/{b.slug}</span>
                    {b.tags?.slice(0, 5).map((t) => (
                      <span key={t} className="sbc-chip rounded-full px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {businesses.map((b) => {
            const name = locale === "ar" ? b.name.ar : b.name.en;
            const description = b.description ? (locale === "ar" ? b.description.ar : b.description.en) : "";
            const img = b.media?.logo || b.media?.cover || b.media?.banner;

            const category = b.categoryId ? getCategoryById(b.categoryId) : null;
            const categoryLabel = category
              ? (locale === "ar" ? category.name.ar : category.name.en)
              : (b.category || (locale === "ar" ? "عمل" : "Business"));

            return (
              <Link
                key={b.id}
                href={`/${locale}/businesses/${b.slug}`}
                className={`group sbc-card sbc-card--interactive rounded-2xl p-4 sm:p-5 flex gap-4 ${
                  locale === "ar" ? "sm:flex-row-reverse" : "sm:flex-row"
                }`}
              >
                <div
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-accent/10 via-accent-2/10 to-transparent"
                  style={{ border: "1px solid", borderColor: "var(--surface-border)" }}
                >
                  {img ? (
                    <Image
                      src={img}
                      alt={name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-2xl font-bold text-(--muted-foreground)">
                        {name.slice(0, 1)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold tracking-tight">
                        {name}
                      </div>
                      {description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-(--muted-foreground)">
                          {description}
                        </p>
                      ) : null}
                    </div>

                    <span className="sbc-chip shrink-0 rounded-full px-3 py-1 text-xs font-medium group-hover:brightness-[1.03]">
                      {categoryLabel}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
                    <span className="font-mono">/{b.slug}</span>
                    {b.city ? <span>{b.city}</span> : null}
                    {b.phone ? <span>{b.phone}</span> : null}
                    {b.tags?.slice(0, 6).map((t) => (
                      <span key={t} className="sbc-chip rounded-full px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
    </PageContainer>
  );
}
