import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Container } from "@/components/Container";
import { isLocale } from "@/lib/i18n/locales";
import { getBusinessBySlug } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { buttonVariants } from "@/components/ui/Button";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const business = getBusinessBySlug(slug);
  if (!business) notFound();

  const heroImage = business.media?.cover || business.media?.banner || business.media?.logo;
  const category = business.categoryId ? getCategoryById(business.categoryId) : null;
  const categoryLabel = category ? (locale === "ar" ? category.name.ar : category.name.en) : business.category;

  return (
    <Container>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            {locale === "ar" ? business.name.ar : business.name.en}
          </h1>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            <span className="font-mono">/{business.slug}</span>
            {business.city ? (
              <>
                <span className="mx-2">•</span>
                <span>{business.city}</span>
              </>
            ) : null}
            {categoryLabel ? (
              <>
                <span className="mx-2">•</span>
                <span>{categoryLabel}</span>
              </>
            ) : null}
          </p>
        </div>

        <Link
          href={`/${locale}/businesses`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {locale === "ar" ? "كل الأعمال" : "All businesses"}
        </Link>
      </div>

      {heroImage ? (
        <div className="mt-6 sbc-card overflow-hidden rounded-2xl">
          <div className="relative h-56 w-full sm:h-72">
            <Image
              src={heroImage}
              alt={locale === "ar" ? "صورة" : "Image"}
              fill
              sizes="(min-width: 640px) 768px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      ) : null}

      {business.description ? (
        <div className="mt-8 sbc-card rounded-2xl p-6 text-sm leading-7 text-foreground">
          {locale === "ar" ? business.description.ar : business.description.en}
        </div>
      ) : null}

      {business.media?.gallery?.length ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">
            {locale === "ar" ? "معرض الصور" : "Gallery"}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {business.media.gallery.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="group sbc-card sbc-card--interactive overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={url}
                    alt={locale === "ar" ? "صورة" : "Image"}
                    fill
                    sizes="(min-width: 640px) 33vw, 50vw"
                    className="object-cover transition group-hover:scale-[1.02]"
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {business.media?.videos?.length ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">
            {locale === "ar" ? "الفيديو" : "Videos"}
          </h2>
          <div className="mt-3 grid gap-4">
            {business.media.videos.map((url) => (
              <div
                key={url}
                className="sbc-card rounded-2xl p-4"
              >
                <video
                  src={url}
                  controls
                  preload="metadata"
                  className="w-full rounded-xl"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {business.address ? (
          <div className="sbc-card rounded-2xl p-5 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
              {locale === "ar" ? "العنوان" : "Address"}
            </div>
            <div className="mt-2 text-foreground">{business.address}</div>
          </div>
        ) : null}

        {business.phone ? (
          <div className="sbc-card rounded-2xl p-5 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
              {locale === "ar" ? "الهاتف" : "Phone"}
            </div>
            <div className="mt-2">
              <a
                className="font-medium text-foreground underline-offset-4 hover:underline"
                href={`tel:${business.phone}`}
              >
                {business.phone}
              </a>
            </div>
          </div>
        ) : null}

        {business.website ? (
          <div className="sbc-card rounded-2xl p-5 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
              {locale === "ar" ? "الموقع" : "Website"}
            </div>
            <div className="mt-2">
              <a
                className="font-medium text-foreground underline-offset-4 hover:underline"
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
          <div className="sbc-card rounded-2xl p-5 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
              {locale === "ar" ? "البريد" : "Email"}
            </div>
            <div className="mt-2">
              <a
                className="font-medium text-foreground underline-offset-4 hover:underline"
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
              className="sbc-chip rounded-full px-3 py-1 text-xs font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </Container>
  );
}
