import Link from "next/link";
import Image from "next/image";
import { getCategoryById } from "@/lib/db/categories";

interface BusinessCardProps {
  business: {
    id: string;
    slug: string;
    name: { en: string; ar: string };
    description?: { en?: string; ar?: string };
    city?: string;
    category?: string;
    categoryId?: string;
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

  return (
    <Link
      href={`/${locale}/businesses/${business.slug}`}
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
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-accent/10 to-accent-2/10">
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
              <div className="text-6xl font-bold bg-gradient-to-br from-accent to-accent-2 bg-clip-text text-transparent opacity-20">
                {name.charAt(0)}
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative p-5">
          {/* Logo */}
          {logo && (
            <div
              className="absolute -top-8 left-5 w-16 h-16 rounded-xl overflow-hidden shadow-lg"
              style={{
                background: "var(--background)",
                border: "2px solid",
                borderColor: "var(--surface-border)",
              }}
            >
              <Image
                src={logo}
                alt={`${name} logo`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          )}

          <div className={logo ? "mt-10" : ""}>
            {/* Title */}
            <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-accent transition-colors">
              {name}
            </h3>

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
