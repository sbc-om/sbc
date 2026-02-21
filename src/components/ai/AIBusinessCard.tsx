"use client";

import Link from "next/link";
import Image from "next/image";

interface AIBusinessCardProps {
  business: {
    id: string;
    slug: string;
    username?: string;
    name: { en: string; ar: string };
    description?: { en?: string; ar?: string };
    city?: string;
    category?: string;
    isVerified?: boolean;
    isSpecial?: boolean;
    media?: {
      logo?: string;
      cover?: string;
      banner?: string;
    };
  };
  locale: "en" | "ar";
}

function localizeCategory(category: string | undefined, locale: "en" | "ar"): string {
  if (!category) return "";

  const normalized = category.trim();
  if (!normalized) return "";

  const separators = ["|", " / ", " - ", " • "];
  for (const separator of separators) {
    if (!normalized.includes(separator)) continue;
    const parts = normalized
      .split(separator)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return locale === "ar" ? parts[1] : parts[0];
    }
  }

  const arabicPart = (normalized.match(/[\u0600-\u06FF\s]+/g) || []).join(" ").trim();
  const latinPart = (normalized.match(/[A-Za-z0-9&\-\s]+/g) || []).join(" ").replace(/\s+/g, " ").trim();

  if (locale === "ar" && arabicPart) return arabicPart;
  if (locale === "en" && latinPart) return latinPart;

  return normalized;
}

export function AIBusinessCard({ business, locale }: AIBusinessCardProps) {
  const name = locale === "ar" ? business.name.ar : business.name.en;
  const description = business.description
    ? locale === "ar"
      ? business.description.ar
      : business.description.en
    : "";

  const coverImage = business.media?.cover || business.media?.banner;
  const logo = business.media?.logo;
  const detailPath = business.username
    ? `/@${business.username}`
    : `/${locale}/businesses/${business.slug}`;
  const categoryLabel = localizeCategory(business.category, locale);

  return (
    <Link href={detailPath} className="group block">
      <article
        className="relative rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-xl h-full"
        style={{
          background: "rgba(var(--surface-rgb, 255, 255, 255), 0.8)",
          border: "1px solid",
          borderColor: "var(--surface-border)",
        }}
      >
        {/* Cover Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-linear-to-br from-accent/10 to-accent-2/10">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl font-bold bg-linear-to-br from-accent to-accent-2 bg-clip-text text-transparent opacity-20">
                {name.charAt(0)}
              </div>
            </div>
          )}

          {business.isSpecial ? (
            <div
              className={`absolute top-2 z-10 inline-flex items-center gap-1 rounded-full bg-amber-500/85 px-2.5 py-1 text-xs font-semibold text-white shadow-lg ${locale === "ar" ? "left-2" : "right-2"}`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
              </svg>
              {locale === "ar" ? "مميز" : "Special"}
            </div>
          ) : null}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative p-5">
          <div className="mt-2">
            {/* Title with Logo */}
            <div className="mb-2 flex items-center gap-2 min-w-0">
              {logo && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-(--surface-border)">
                  <Image src={logo} alt={name} fill className="object-cover" sizes="32px" />
                </div>
              )}
              <h3 className="min-w-0 text-xl font-bold text-foreground truncate whitespace-nowrap group-hover:text-accent transition-colors">
                {name}
              </h3>
              {business.isVerified ? (
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600"
                  aria-label={locale === "ar" ? "نشاط موثق" : "Verified business"}
                  title={locale === "ar" ? "نشاط موثق" : "Verified business"}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                  </svg>
                </span>
              ) : null}
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-foreground opacity-70 truncate whitespace-nowrap mb-3">
                {description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 text-xs text-(--muted-foreground) pt-2 border-t border-(--surface-border)">
              {categoryLabel ? (
                <span className="sbc-chip rounded-full px-2.5 py-1" dir={locale === "ar" ? "rtl" : "ltr"}>{categoryLabel}</span>
              ) : null}
              {business.city ? (
                <span className="sbc-chip rounded-full px-2.5 py-1">{business.city}</span>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
