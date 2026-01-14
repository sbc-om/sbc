"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  IoHeartOutline, 
  IoHeart, 
  IoChatbubbleOutline, 
  IoShareSocialOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoLocationSharp,
  IoEllipsisHorizontal
} from "react-icons/io5";
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";
import type { Locale } from "@/lib/i18n/locales";

interface BusinessFeedCardProps {
  business: {
    id: string;
    slug: string;
    name: { en: string; ar: string };
    description?: { en?: string; ar?: string };
    city?: string;
    category?: string;
    categoryId?: string;
    avatarMode?: "icon" | "logo";
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
  locale: Locale;
  categoryName?: string;
  /** Provide this from the parent (server) when available. */
  categoryIconId?: string;
  /** Real like count from database */
  initialLikeCount: number;
  /** User has liked this business */
  initialLiked: boolean;
  /** User has saved this business */
  initialSaved: boolean;
  /** Real approved comment count from database */
  commentCount: number;
  /** Actions for like and save */
  onToggleLike: (businessId: string) => Promise<{ liked: boolean; count: number }>;
  onToggleSave: (businessId: string) => Promise<{ saved: boolean }>;
}

export function BusinessFeedCard({
  business,
  locale,
  categoryName,
  categoryIconId,
  initialLikeCount,
  initialLiked,
  initialSaved,
  commentCount,
  onToggleLike,
  onToggleSave,
}: BusinessFeedCardProps) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [saved, setSaved] = useState(initialSaved);
  
  const name = locale === "ar" ? business.name.ar : business.name.en;
  const description = business.description
    ? locale === "ar"
      ? business.description.ar
      : business.description.en
    : "";

  const mainImage = business.media?.cover || business.media?.banner;
  const logo = business.media?.logo;
  const avatarMode = business.avatarMode ?? "icon";
  const showLogo = avatarMode === "logo" && !!logo;
  const CategoryIcon = getCategoryIconComponent(categoryIconId);

  const handleLikeClick = () => {
    startTransition(async () => {
      try {
        const result = await onToggleLike(business.id);
        setLiked(result.liked);
        setLikeCount(result.count);
      } catch (err) {
        console.error("Failed to toggle like:", err);
      }
    });
  };

  const handleSaveClick = () => {
    startTransition(async () => {
      try {
        const result = await onToggleSave(business.id);
        setSaved(result.saved);
      } catch (err) {
        console.error("Failed to toggle save:", err);
      }
    });
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/businesses/${business.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: description || name,
          url,
        });
      } catch (err) {
        // User cancelled share or error occurred
        console.log("Share cancelled or failed", err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        // Could show a toast notification here
        alert(locale === "ar" ? "تم نسخ الرابط" : "Link copied!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

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
          {showLogo ? (
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-accent/20">
              <Image src={logo!} alt={name} fill className="object-cover" sizes="36px" />
            </div>
          ) : categoryIconId ? (
            <div className="w-9 h-9 rounded-full bg-(--chip-bg) border border-(--surface-border) flex items-center justify-center">
              <CategoryIcon className="h-5 w-5 text-(--muted-foreground)" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-accent to-accent-2 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
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
          <IoEllipsisHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Image - Square Instagram-style (1080x1080) */}
      {mainImage && (
        <Link href={`/${locale}/businesses/${business.slug}`}>
          <div className="relative w-full aspect-square bg-linear-to-br from-accent/5 to-accent-2/5">
            <Image
              src={mainImage}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={90}
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
              onClick={handleLikeClick}
              disabled={isPending}
              className="transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
              aria-label={liked ? "Unlike" : "Like"}
            >
              {liked ? (
                <IoHeart className="w-7 h-7 text-red-500" />
              ) : (
                <IoHeartOutline className="w-7 h-7" strokeWidth={0.5} />
              )}
            </button>
            <Link
              href={`/${locale}/businesses/${business.slug}`}
              className="transition-all hover:scale-110 active:scale-95"
              aria-label="Comment"
            >
              <IoChatbubbleOutline className="w-7 h-7" strokeWidth={0.5} />
            </Link>
            <button
              onClick={handleShare}
              className="transition-all hover:scale-110 active:scale-95"
              aria-label="Share"
            >
              <IoShareSocialOutline className="w-7 h-7" strokeWidth={0.5} />
            </button>
          </div>
          <button
            onClick={handleSaveClick}
            disabled={isPending}
            className="transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
            aria-label={saved ? "Unsave" : "Save"}
          >
            {saved ? (
              <IoBookmark className="w-6 h-6" />
            ) : (
              <IoBookmarkOutline className="w-6 h-6" strokeWidth={0.5} />
            )}
          </button>
        </div>

        {/* Likes and Comments Count */}
        <div className="space-y-1 mb-2">
          {likeCount > 0 && (
            <div className="text-sm font-semibold">
              {likeCount.toLocaleString()}{" "}
              {locale === "ar" ? "إعجاب" : likeCount === 1 ? "like" : "likes"}
            </div>
          )}
          {commentCount > 0 && (
            <Link
              href={`/${locale}/businesses/${business.slug}`}
              className="text-sm text-(--muted-foreground) hover:text-foreground transition-colors block"
            >
              {locale === "ar"
                ? `عرض جميع التعليقات (${commentCount})`
                : `View all ${commentCount} comment${commentCount === 1 ? "" : "s"}`}
            </Link>
          )}
        </div>

        {/* Caption - Single line with ellipsis */}
        <div className="text-sm line-clamp-1">
          <Link
            href={`/${locale}/businesses/${business.slug}`}
            className="font-semibold hover:opacity-80 transition-opacity"
          >
            {name}
          </Link>
          {description && (
            <span className={`${locale === "ar" ? "mr-2" : "ml-2"} text-foreground`}>
              {description}
            </span>
          )}
        </div>

        {/* Meta Info with Timestamp */}
        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-(--muted-foreground)">
          {business.city && (
            <>
              <span className="flex items-center gap-0.5">
                <IoLocationSharp className="w-3 h-3" />
                {business.city}
              </span>
              <span className="text-[9px]">•</span>
            </>
          )}
          <time className="text-[10px] uppercase opacity-70">
            {locale === "ar" ? "منذ يومين" : "2d ago"}
          </time>
        </div>
      </div>
    </article>
  );
}
