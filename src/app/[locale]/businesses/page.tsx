import Link from "next/link";

import { Container } from "@/components/Container";
import { PageContainer } from "@/components/PageContainer";
import { buttonVariants, Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { notFound } from "next/navigation";
import { listBusinesses } from "@/lib/db/businesses";

export default async function BusinessesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  const { q } = await searchParams;
  const businesses = listBusinesses({ q, locale: locale as Locale });

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

      <div className="mt-8 grid gap-4">
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/${locale}/businesses/${b.slug}`}
            className="group sbc-card sbc-card--interactive rounded-2xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold tracking-tight">
                  {locale === "ar" ? b.name.ar : b.name.en}
                </div>
                {b.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-(--muted-foreground)">
                    {locale === "ar" ? b.description.ar : b.description.en}
                  </p>
                ) : null}
              </div>
              <span className="sbc-chip shrink-0 rounded-full px-3 py-1 text-xs font-medium group-hover:brightness-[1.03]">
                {b.category || (locale === "ar" ? "عمل" : "Business")}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--muted-foreground)">
              <span className="font-mono">/{b.slug}</span>
              {b.city ? <span>{b.city}</span> : null}
              {b.tags?.slice(0, 4).map((t) => (
                <span key={t} className="sbc-chip rounded-full px-2 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </Container>
    </PageContainer>
  );
}
