import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { isLocale } from "@/lib/i18n/locales";
import { getBusinessBySlug } from "@/lib/db/businesses";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const business = getBusinessBySlug(slug);
  if (!business) notFound();

  return (
    <Container>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {locale === "ar" ? business.name.ar : business.name.en}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-mono">/{business.slug}</span>
            {business.city ? (
              <>
                <span className="mx-2">•</span>
                <span>{business.city}</span>
              </>
            ) : null}
            {business.category ? (
              <>
                <span className="mx-2">•</span>
                <span>{business.category}</span>
              </>
            ) : null}
          </p>
        </div>

        <a
          href={`/${locale}/businesses`}
          className="shrink-0 text-sm font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
        >
          {locale === "ar" ? "كل الأعمال" : "All businesses"}
        </a>
      </div>

      {business.description ? (
        <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200">
          {locale === "ar" ? business.description.ar : business.description.en}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {business.address ? (
          <div className="rounded-2xl border border-black/5 bg-white p-5 text-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {locale === "ar" ? "العنوان" : "Address"}
            </div>
            <div className="mt-2 text-zinc-800 dark:text-zinc-200">{business.address}</div>
          </div>
        ) : null}

        {business.phone ? (
          <div className="rounded-2xl border border-black/5 bg-white p-5 text-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {locale === "ar" ? "الهاتف" : "Phone"}
            </div>
            <div className="mt-2">
              <a
                className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-white"
                href={`tel:${business.phone}`}
              >
                {business.phone}
              </a>
            </div>
          </div>
        ) : null}

        {business.website ? (
          <div className="rounded-2xl border border-black/5 bg-white p-5 text-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {locale === "ar" ? "الموقع" : "Website"}
            </div>
            <div className="mt-2">
              <a
                className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-white"
                href={business.website}
                target="_blank"
                rel="noreferrer"
              >
                {business.website}
              </a>
            </div>
          </div>
        ) : null}

        {business.email ? (
          <div className="rounded-2xl border border-black/5 bg-white p-5 text-sm dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {locale === "ar" ? "البريد" : "Email"}
            </div>
            <div className="mt-2">
              <a
                className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-white"
                href={`mailto:${business.email}`}
              >
                {business.email}
              </a>
            </div>
          </div>
        ) : null}
      </div>

      {business.tags?.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {business.tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-white/15 dark:bg-black dark:text-zinc-200"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </Container>
  );
}
