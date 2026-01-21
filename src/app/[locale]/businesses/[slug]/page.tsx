import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { PublicPage } from "@/components/PublicPage";
import { isLocale } from "@/lib/i18n/locales";
import { getBusinessBySlug } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { buttonVariants } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { StaticLocationMap } from "@/components/maps/StaticLocationMap";
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";

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
  const avatarMode = business.avatarMode ?? "icon";
  const showLogo = avatarMode === "logo" && !!logo;
  const CategoryIcon = getCategoryIconComponent(category?.iconId);

  const name = locale === "ar" ? business.name.ar : business.name.en;
  const description = business.description
    ? (locale === "ar" ? business.description.ar : business.description.en)
    : "";
  const isVerified = business.isVerified ?? false;
  const isSpecial = business.isSpecial ?? false;

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

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {name}
            </h1>
            {isVerified ? (
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15 text-blue-600"
                aria-label={locale === "ar" ? "نشاط موثق" : "Verified business"}
                title={locale === "ar" ? "نشاط موثق" : "Verified business"}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                </svg>
              </span>
            ) : null}
            {isSpecial ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
                </svg>
                {locale === "ar" ? "مميز" : "Special"}
              </span>
            ) : null}
          </div>
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

            <Link
              href={`/${locale}/login?redirect=/${locale}/chat/${business.slug}`}
              aria-label={locale === "ar" ? "دردشة" : "Chat"}
              title={locale === "ar" ? "دردشة" : "Chat"}
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: `absolute top-3 ${locale === "ar" ? "start-3" : "end-3"} sm:top-4 sm:${
                  locale === "ar" ? "start-4" : "end-4"
                } h-10 w-10 p-0 rounded-full bg-black/40 text-white hover:bg-black/55 border border-white/20 backdrop-blur`,
              })}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
          </div>

          {/* Hero content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-lg flex items-center justify-center"
                    style={{
                      background: "var(--background)",
                      border: "2px solid",
                      borderColor: "rgba(255,255,255,0.25)",
                    }}
                  >
                    {showLogo ? (
                      <Image
                        src={logo!}
                        alt={locale === "ar" ? "شعار" : "Logo"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : category ? (
                      <div className="h-10 w-10 rounded-xl bg-(--chip-bg) flex items-center justify-center">
                        <CategoryIcon className="h-6 w-6 text-(--muted-foreground)" />
                      </div>
                    ) : (
                      <div className="text-xl font-bold bg-linear-to-br from-accent to-accent-2 bg-clip-text text-transparent opacity-80">
                        {name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="truncate text-xl font-semibold text-white drop-shadow sm:text-2xl">
                        {name}
                      </div>
                      {isVerified ? (
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-blue-200"
                          aria-label={locale === "ar" ? "نشاط موثق" : "Verified business"}
                          title={locale === "ar" ? "نشاط موثق" : "Verified business"}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                          </svg>
                        </span>
                      ) : null}
                    </div>
                    {isSpecial ? (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
                        </svg>
                        {locale === "ar" ? "مميز" : "Special"}
                      </div>
                    ) : null}
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
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
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
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
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

          {business.latitude && business.longitude ? (
            <section className={description ? "mt-6" : ""}>
                <div className="mt-4 rounded-lg overflow-hidden ">
                  <StaticLocationMap
                    latitude={business.latitude}
                    longitude={business.longitude}
                    locale={locale}
                  />
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
