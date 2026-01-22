"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
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
  IoEllipsisHorizontal,
  IoCopyOutline,
  IoEyeOutline
} from "react-icons/io5";
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";
import type { Locale } from "@/lib/i18n/locales";

interface BusinessFeedCardProps {
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
  /** Route prefix for business details links. Example: "/businesses" or "/explorer" */
  detailsBasePath?: string;
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
  detailsBasePath = "/businesses",
}: BusinessFeedCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [saved, setSaved] = useState(initialSaved);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  
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

  const detailPath = business.username
    ? `/@${business.username}`
    : `/${locale}${detailsBasePath}/${business.slug}`;

  const handleShare = async () => {
    const url = `${window.location.origin}${detailPath}`;
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
        toast({
          message: locale === "ar" ? "تم نسخ الرابط" : "Link copied",
          variant: "success",
          icon: "share",
        });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast({
          message: locale === "ar" ? "تعذر النسخ" : "Copy failed",
          variant: "error",
          icon: "share",
        });
      }
    }
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}${detailPath}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        message: locale === "ar" ? "تم نسخ الرابط" : "Link copied",
        variant: "success",
        icon: "share",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        message: locale === "ar" ? "تعذر النسخ" : "Copy failed",
        variant: "error",
        icon: "share",
      });
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <article
      className="mb-6 rounded-lg border overflow-visible"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--surface-border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href={detailPath}
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
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold leading-none">{name}</p>
              {business.isVerified ? (
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/15 text-blue-600"
                  aria-label={locale === "ar" ? "نشاط موثق" : "Verified business"}
                  title={locale === "ar" ? "نشاط موثق" : "Verified business"}
                >
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                  </svg>
                </span>
              ) : null}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {categoryName ? (
                <span className="text-xs text-(--muted-foreground)">
                  {categoryName}
                </span>
              ) : null}
              {business.isSpecial ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  {locale === "ar" ? "مميز" : "Special"}
                </span>
              ) : null}
            </div>
          </div>
        </Link>
        <div ref={menuRef} className="relative">
          <button
            className="text-(--muted-foreground) hover:text-foreground transition-colors p-1"
            aria-label={locale === "ar" ? "خيارات" : "More options"}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IoEllipsisHorizontal className="w-6 h-6" />
          </button>

          {menuOpen ? (
            <div
                className={`absolute ${locale === "ar" ? "start-0" : "end-0"} z-20 mt-2 w-52 rounded-xl border border-(--surface-border) bg-(--surface) p-2 shadow-lg`}
              role="menu"
            >
              <Link
                href={detailPath}
                role="menuitem"
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-(--chip-bg) ${locale === "ar" ? "text-right" : "text-left"}`}
                onClick={() => setMenuOpen(false)}
              >
                <IoEyeOutline className="h-4 w-4" />
                {locale === "ar" ? "عرض النشاط" : "View business"}
              </Link>
              <button
                type="button"
                role="menuitem"
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-(--chip-bg) ${locale === "ar" ? "text-right" : "text-left"}`}
                onClick={() => {
                  setMenuOpen(false);
                  void handleShare();
                }}
              >
                <IoShareSocialOutline className="h-4 w-4" />
                {locale === "ar" ? "مشاركة" : "Share"}
              </button>
              <button
                type="button"
                role="menuitem"
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-(--chip-bg) ${locale === "ar" ? "text-right" : "text-left"}`}
                onClick={() => {
                  setMenuOpen(false);
                  void handleCopy();
                }}
              >
                <IoCopyOutline className="h-4 w-4" />
                {locale === "ar" ? "نسخ الرابط" : "Copy link"}
              </button>
              <button
                type="button"
                role="menuitem"
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-(--chip-bg) ${locale === "ar" ? "text-right" : "text-left"}`}
                onClick={() => {
                  setMenuOpen(false);
                  handleSaveClick();
                }}
              >
                {saved ? <IoBookmark className="h-4 w-4" /> : <IoBookmarkOutline className="h-4 w-4" />}
                {saved ? (locale === "ar" ? "إزالة من المحفوظات" : "Remove from saved") : (locale === "ar" ? "حفظ النشاط" : "Save business")}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Image - Square Instagram-style (1080x1080) */}
      {mainImage && (
        <Link href={detailPath}>
          <div className="relative w-full aspect-square overflow-hidden bg-linear-to-br from-accent/5 to-accent-2/5">
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
              href={detailPath}
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
              href={business.username ? `/${locale}/businesses/@${business.username}` : `/${locale}/businesses/${business.slug}`}
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
            href={detailPath}
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
