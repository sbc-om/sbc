import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { PublicPage } from "@/components/PublicPage";
import { isLocale } from "@/lib/i18n/locales";
import { getBusinessBySlug } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { OsmLocationPicker } from "@/components/maps/OsmLocationPickerClient";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  // When logged in, keep the experience inside the app shell (sidebar) and identical paddings.
  const user = await getCurrentUser();
  if (user) redirect(`/${locale}/explorer/${slug}`);

  const business = getBusinessBySlug(slug);
  if (!business) notFound();

  const heroImage = business.media?.cover || business.media?.banner || business.media?.logo;
  const logo = business.media?.logo;
  const category = business.categoryId ? getCategoryById(business.categoryId) : null;
  const categoryLabel = category ? (locale === "ar" ? category.name.ar : category.name.en) : business.category;

  const name = locale === "ar" ? business.name.ar : business.name.en;
  const description = business.description
    ? (locale === "ar" ? business.description.ar : business.description.en)
    : "";

  const mapQuery = [business.address, business.city].filter(Boolean).join(" ").trim();
  const mapsHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  return (
    <PublicPage>
      {/* Top bar */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {categoryLabel ? (
              <span className="sbc-chip rounded-full px-3 py-1 text-xs font-medium">
                {categoryLabel}
              </span>
            ) : null}
            {business.city ? (
              <span className="sbc-chip rounded-full px-3 py-1 text-xs font-medium">
                {business.city}
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
            {name}
          </h1>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            <span className="font-mono">/{business.slug}</span>
          </p>
        </div>

        <Link
          href={`/${locale}/businesses`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {locale === "ar" ? "كل الأعمال" : "All businesses"}
        </Link>
      </div>

      {/* Hero */}
      <div className="mt-6 sbc-card overflow-hidden rounded-2xl">
        <div className="relative">
          <div className="relative h-56 w-full sm:h-72">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={locale === "ar" ? "صورة" : "Image"}
                fill
                sizes="(min-width: 640px) 768px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-accent-2/10 to-transparent" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
          </div>

          {/* Hero content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  {logo ? (
                    <div
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-lg"
                      style={{
                        background: "var(--background)",
                        border: "2px solid",
                        borderColor: "rgba(255,255,255,0.25)",
                      }}
                    >
                      <Image
                        src={logo}
                        alt={locale === "ar" ? "شعار" : "Logo"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="min-w-0">
                    <div className="truncate text-xl font-semibold text-white drop-shadow sm:text-2xl">
                      {name}
                    </div>
                    {description ? (
                      <div className="mt-1 line-clamp-2 text-sm text-white/85">
                        {description}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex flex-wrap items-center gap-2">
                {business.phone ? (
                  <a
                    href={`tel:${business.phone}`}
                    className={buttonVariants({
                      variant: "primary",
                      size: "sm",
                      className: "shadow-lg",
                    })}
                  >
                    {locale === "ar" ? "اتصال" : "Call"}
                  </a>
                ) : null}

                {business.website ? (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    {locale === "ar" ? "الموقع" : "Website"}
                  </a>
                ) : null}

                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "ghost", size: "sm", className: "text-white/90 hover:text-white" })}
                  >
                    {locale === "ar" ? "خريطة" : "Map"}
                  </a>
                ) : null}
              </div>
            </div>

            {/* Mobile quick actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:hidden">
              {business.phone ? (
                <a
                  href={`tel:${business.phone}`}
                  className={buttonVariants({ variant: "primary", size: "sm", className: "shadow-lg" })}
                >
                  {locale === "ar" ? "اتصال" : "Call"}
                </a>
              ) : null}

              {business.website ? (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  {locale === "ar" ? "الموقع" : "Website"}
                </a>
              ) : null}

              {business.email ? (
                <a
                  href={`mailto:${business.email}`}
                  className={buttonVariants({ variant: "ghost", size: "sm", className: "text-white/90 hover:text-white" })}
                >
                  {locale === "ar" ? "بريد" : "Email"}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="min-w-0">
          {description ? (
            <section className="sbc-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold tracking-tight">
                {locale === "ar" ? "نبذة" : "About"}
              </h2>
              <div className="mt-3 text-sm leading-7 text-foreground">
                {description}
              </div>
            </section>
          ) : null}

          {business.media?.gallery?.length ? (
            <section className={description ? "mt-6" : ""}>
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  {locale === "ar" ? "معرض الصور" : "Gallery"}
                </h2>
                <span className="text-xs text-(--muted-foreground)">
                  {locale === "ar"
                    ? `عدد الصور: ${business.media.gallery.length}`
                    : `Photos: ${business.media.gallery.length}`}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {business.media.gallery.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group sbc-card sbc-card--interactive overflow-hidden rounded-2xl"
                    aria-label={locale === "ar" ? "فتح الصورة" : "Open image"}
                  >
                    <div className="relative aspect-square w-full">
                      <Image
                        src={url}
                        alt={locale === "ar" ? "صورة" : "Image"}
                        fill
                        sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 50vw"
                        className="object-cover transition group-hover:scale-[1.03]"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          {business.media?.videos?.length ? (
            <section className={(description || business.media?.gallery?.length) ? "mt-6" : ""}>
              <div className="flex items-end justify-between gap-4">
                <h2 className="text-lg font-semibold tracking-tight">
                  {locale === "ar" ? "الفيديو" : "Videos"}
                </h2>
                <span className="text-xs text-(--muted-foreground)">
                  {locale === "ar"
                    ? `عدد المقاطع: ${business.media.videos.length}`
                    : `Videos: ${business.media.videos.length}`}
                </span>
              </div>
              <div className="mt-3 grid gap-4">
                {business.media.videos.map((url) => (
                  <div key={url} className="sbc-card rounded-2xl p-4">
                    <video
                      src={url}
                      controls
                      preload="metadata"
                      className="w-full rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-28 h-fit">
          <div className="sbc-card rounded-2xl p-6">
            <h2 className="text-base font-semibold tracking-tight">
              {locale === "ar" ? "معلومات التواصل" : "Contact"}
            </h2>

            <div className="mt-4 grid gap-3 text-sm">
              {business.address ? (
                <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
                    {locale === "ar" ? "العنوان" : "Address"}
                  </div>
                  <div className="mt-2 text-foreground">{business.address}</div>
                  {mapsHref ? (
                    <div className="mt-3">
                      <a
                        className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                        href={mapsHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {locale === "ar" ? "فتح في الخرائط" : "Open in maps"}
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {business.phone ? (
                <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
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
                <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
                    {locale === "ar" ? "الموقع" : "Website"}
                  </div>
                  <div className="mt-2">
                    <a
                      className="font-medium text-foreground underline-offset-4 hover:underline break-all"
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
                <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
                    {locale === "ar" ? "البريد" : "Email"}
                  </div>
                  <div className="mt-2">
                    <a
                      className="font-medium text-foreground underline-offset-4 hover:underline break-all"
                      href={`mailto:${business.email}`}
                    >
                      {business.email}
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            {(business.phone || business.website || business.email) ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {business.phone ? (
                  <a
                    href={`tel:${business.phone}`}
                    className={buttonVariants({ variant: "primary", size: "sm" })}
                  >
                    {locale === "ar" ? "اتصال" : "Call"}
                  </a>
                ) : null}
                {business.email ? (
                  <a
                    href={`mailto:${business.email}`}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    {locale === "ar" ? "إرسال بريد" : "Email"}
                  </a>
                ) : null}
                {business.website ? (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    {locale === "ar" ? "زيارة الموقع" : "Visit"}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          {business.latitude && business.longitude ? (
            <div className="mt-6 sbc-card rounded-2xl p-6">
              <h2 className="text-base font-semibold tracking-tight">
                {locale === "ar" ? "الموقع على الخريطة" : "Location on Map"}
              </h2>
              <div className="mt-4 rounded-lg overflow-hidden border border-(--border)">
                <OsmLocationPicker
                  value={{ lat: business.latitude, lng: business.longitude, radiusMeters: 250 }}
                  onChange={() => {}}
                  locale={locale}
                  disabled
                />
              </div>
              <p className="mt-3 text-xs text-(--muted-foreground)">
                {locale === "ar" ? "الإحداثيات:" : "Coordinates:"} {business.latitude.toFixed(6)}, {business.longitude.toFixed(6)}
              </p>
            </div>
          ) : null}

          {business.tags?.length ? (
            <div className="mt-6 sbc-card rounded-2xl p-6">
              <h2 className="text-base font-semibold tracking-tight">
                {locale === "ar" ? "الوسوم" : "Tags"}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {business.tags.map((t) => (
                  <span key={t} className="sbc-chip rounded-full px-3 py-1 text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </PublicPage>
  );
}
