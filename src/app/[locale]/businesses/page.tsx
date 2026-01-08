import Link from "next/link";

import { Container } from "@/components/Container";
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
    <Container>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {dict.businesses.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
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
            className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold tracking-tight">
                  {locale === "ar" ? b.name.ar : b.name.en}
                </div>
                {b.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {locale === "ar" ? b.description.ar : b.description.en}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-zinc-700 group-hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-200 dark:group-hover:bg-zinc-900">
                {b.category || (locale === "ar" ? "عمل" : "Business")}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-mono">/{b.slug}</span>
              {b.city ? <span>{b.city}</span> : null}
              {b.tags?.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-900">
                  {t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
