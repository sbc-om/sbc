import Link from "next/link";
import Image from "next/image";
import { getCategoryById } from "@/lib/db/categories";
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";

interface BusinessCardProps {
  business: {
    id: string;
    slug: string;
    username?: string;
    name: { en: string; ar: string };
    description?: { en?: string; ar?: string };
    city?: string;
    category?: string;
    categoryId?: string;
    avatarMode?: "icon" | "logo";
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

export function BusinessCard({ business, locale }: BusinessCardProps) {
  const name = locale === "ar" ? business.name.ar : business.name.en;
  const description = business.description
    ? locale === "ar"
      ? business.description.ar
      : business.description.en
    : "";

  // Get category name in correct language
  const category = business.categoryId
    ? getCategoryById(business.categoryId)
    : null;
  const categoryName = category
    ? locale === "ar"
      ? category.name.ar
      : category.name.en
    : business.category; // Fallback to legacy text category

  const coverImage = business.media?.cover || business.media?.banner;
  const logo = business.media?.logo;
  const avatarMode = business.avatarMode ?? "icon";
  const showLogo = avatarMode === "logo" && !!logo;
  const CategoryIcon = getCategoryIconComponent(category?.iconId);
  const detailPath = business.username
    ? `/@${business.username}`
    : `/${locale}/businesses/${business.slug}`;

  return (
    <Link
      href={detailPath}
      className="group block"
    >
      <article
        className="relative rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-xl h-full"
        style={{
          background: "rgba(var(--surface-rgb, 255, 255, 255), 0.8)",
          border: "1px solid",
          borderColor: "var(--surface-border)",
        }}
      >
        {/* Cover Image */}
        <div className="relative h-48 w-full overflow-hidden bg-linear-to-br from-accent/10 to-accent-2/10">
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
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative p-5">
          {/* Avatar (default category icon, or logo if selected) */}
          <div
            className="absolute -top-8 left-5 w-16 h-16 rounded-xl overflow-hidden shadow-lg flex items-center justify-center"
            style={{
              background: "var(--background)",
              border: "2px solid",
              borderColor: "var(--surface-border)",
            }}
          >
            {showLogo ? (
              <Image
                src={logo!}
                alt={`${name} logo`}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : category ? (
              <div className="h-11 w-11 rounded-lg bg-(--chip-bg) flex items-center justify-center">
                <CategoryIcon className="h-7 w-7 text-(--muted-foreground)" />
              </div>
            ) : (
              <div className="text-2xl font-bold bg-linear-to-br from-accent to-accent-2 bg-clip-text text-transparent opacity-80">
                {name.charAt(0)}
              </div>
            )}
          </div>

        <div className="mt-10">
          {/* Title */}
          <div className="mb-2 flex items-center gap-2 min-w-0">
            <h3 className="min-w-0 text-xl font-bold text-foreground truncate group-hover:text-accent transition-colors">
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

          {business.isSpecial ? (
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
              </svg>
              {locale === "ar" ? "مميز" : "Special"}
            </div>
          ) : null}

          {/* Description */}
          {description && (
            <p className="text-sm text-foreground opacity-70 line-clamp-2 mb-3">
              {description}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-xs text-foreground opacity-60 flex-wrap">
              {business.city && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {business.city}
                </span>
              )}
              {categoryName && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  {categoryName}
                </span>
              )}
            </div>
          </div>

          {/* Hover Arrow - RTL aware */}
          <div 
            className="absolute bottom-5 opacity-0 group-hover:opacity-100 transition-all duration-300 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center"
            style={{
              right: locale === "ar" ? "auto" : "1.25rem",
              left: locale === "ar" ? "1.25rem" : "auto",
            }}
          >
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                transform: locale === "ar" ? "rotate(180deg)" : "none",
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </article>
    </Link>
  );
}
