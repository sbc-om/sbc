"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface BusinessFeedCardProps {
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
      gallery?: string[];
    };
    contact?: {
      phone?: string;
      website?: string;
    };
  };
  locale: "en" | "ar";
  categoryName?: string;
}

export function BusinessFeedCard({ business, locale, categoryName }: BusinessFeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Deterministic "likes" value for UI (avoids Math.random during render).
  const likesCount = (() => {
    const s = String(business.id || business.slug || "");
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return (h % 951) + 50; // 50..1000
  })();
  
  const name = locale === "ar" ? business.name.ar : business.name.en;
  const description = business.description
    ? locale === "ar"
      ? business.description.ar
      : business.description.en
    : "";

  const mainImage = business.media?.cover || business.media?.banner;
  const logo = business.media?.logo;

  return (
    <article
      className="mb-6 rounded-lg overflow-hidden border"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--surface-border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href={`/${locale}/businesses/${business.slug}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {logo ? (
            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-accent/20">
              <Image
                src={logo}
                alt={name}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-accent to-accent-2 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold leading-none">{name}</p>
            {categoryName && (
              <p className="text-xs text-(--muted-foreground) mt-0.5">
                {categoryName}
              </p>
            )}
          </div>
        </Link>
        <button
          className="text-(--muted-foreground) hover:text-foreground transition-colors p-1"
          aria-label="More options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Image */}
      {mainImage && (
        <Link href={`/${locale}/businesses/${business.slug}`}>
          <div className="relative w-full aspect-square bg-linear-to-br from-accent/5 to-accent-2/5">
            <Image
              src={mainImage}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 600px"
              priority={false}
            />
          </div>
        </Link>
      )}

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLiked(!liked)}
              className="transition-transform hover:scale-110 active:scale-95"
              aria-label={liked ? "Unlike" : "Like"}
            >
              <svg
                className={`w-7 h-7 ${liked ? "fill-red-500 text-red-500" : "fill-none"}`}
                stroke="currentColor"
                strokeWidth={liked ? 0 : 2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <Link
              href={`/${locale}/businesses/${business.slug}`}
              className="transition-transform hover:scale-110 active:scale-95"
              aria-label="Comment"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </Link>
            <button
              className="transition-transform hover:scale-110 active:scale-95"
              aria-label="Share"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setSaved(!saved)}
            className="transition-transform hover:scale-110 active:scale-95"
            aria-label={saved ? "Unsave" : "Save"}
          >
            <svg
              className={`w-6 h-6 ${saved ? "fill-current" : "fill-none"}`}
              stroke="currentColor"
              strokeWidth={saved ? 0 : 2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>

        {/* Likes */}
        <div className="text-sm font-semibold mb-2">
          {likesCount}{" "}
          {locale === "ar" ? "إعجاب" : "likes"}
        </div>

        {/* Caption */}
        <div className="text-sm">
          <Link
            href={`/${locale}/businesses/${business.slug}`}
            className="font-semibold hover:opacity-80 transition-opacity"
          >
            {name}
          </Link>
          {description && (
            <span className="ml-2 text-foreground">
              {description.length > 100
                ? `${description.substring(0, 100)}...`
                : description}
            </span>
          )}
        </div>

        {/* Meta Info */}
        {(business.city || business.contact?.phone) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-(--muted-foreground)">
            {business.city && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                {business.city}
              </span>
            )}
            {business.contact?.phone && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {business.contact.phone}
              </span>
            )}
          </div>
        )}

        {/* View all comments link */}
        <Link
          href={`/${locale}/businesses/${business.slug}`}
          className="text-xs text-(--muted-foreground) hover:text-foreground transition-colors mt-2 block"
        >
          {locale === "ar" ? "عرض جميع التفاصيل" : "View all details"}
        </Link>

        {/* Timestamp */}
        <time className="text-xs text-(--muted-foreground) uppercase block mt-1">
          {locale === "ar" ? "منذ يومين" : "2 days ago"}
        </time>
      </div>
    </article>
  );
}
