"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiPhone, FiMail, FiGlobe, FiMapPin, FiTag } from "react-icons/fi";
import { buttonVariants } from "@/components/ui/Button";
import { StaticLocationMap } from "@/components/maps/StaticLocationMap";
import { BusinessEngagement } from "@/components/business/BusinessEngagement";
import { ShareActionButton } from "@/components/ShareActionButton";
import { FollowBusinessButton } from "@/components/business/FollowBusinessButton";
import { BusinessStoriesStrip } from "@/components/stories/BusinessStoriesStrip";
import { renderCategoryIcon } from "@/lib/icons/categoryIcons";
import { StoryUpload } from "@/components/stories/StoryUpload";
import { MarkdownRenderer } from "@/components/ui/MarkdownEditor";
import type { Business, Category } from "@/lib/db/types";
import type { Story } from "@/lib/db/stories";
import type { BusinessComment } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";

type ContentLanguage = "en" | "ar";

interface ExplorerBusinessViewProps {
  business: Business;
  locale: Locale;
  siteLocale: Locale;
  user: { id: string; role: string };
  category: Category | null;
  categoryIconId?: string;
  handlePath: string;
  mapsHref: string | null;
  likeCount: number;
  liked: boolean;
  approvedComments: BusinessComment[];
  myPendingComments: BusinessComment[];
  pendingForModeration: BusinessComment[];
  canModerate: boolean;
  usersById: Record<string, { displayName?: string; email?: string } | undefined>;
  isOwner?: boolean;
  stories?: Story[];
  beforeEngagement?: ReactNode;
}

export function ExplorerBusinessView({
  business,
  locale,
  siteLocale,
  user,
  category,
  categoryIconId,
  handlePath,
  mapsHref,
  likeCount,
  liked,
  approvedComments,
  myPendingComments,
  pendingForModeration,
  canModerate,
  usersById,
  isOwner = false,
  stories = [],
  beforeEngagement,
}: ExplorerBusinessViewProps) {
  const [contentLang, setContentLang] = useState<ContentLanguage>(siteLocale);
  const heroImage = business.media?.cover || business.media?.banner || business.media?.logo;
  const logo = business.media?.logo;
  const avatarMode = business.avatarMode ?? "icon";
  const showLogo = avatarMode === "logo" && !!logo;
  const categoryLabel = category
    ? contentLang === "ar" ? category.name.ar : category.name.en
    : business.category;

  const name = contentLang === "ar" ? business.name.ar : business.name.en;
  const description = business.description
    ? contentLang === "ar" ? business.description.ar : business.description.en
    : "";
  const isVerified = business.isVerified ?? false;
  const isSpecial = business.isSpecial ?? false;

  return (
    <>
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
            <div
              className={`absolute top-3 ${locale === "ar" ? "left-3" : "right-3"} sm:top-4 sm:${
                locale === "ar" ? "left-4" : "right-4"
              } flex items-center gap-2`}
            >
              <FollowBusinessButton
                businessId={business.id}
                locale={locale}
                compact
              />
              <Link
                href={business.username ? `/${locale}/chat/@${business.username}` : `/${locale}/chat/${business.slug}`}
                aria-label={locale === "ar" ? "دردشة" : "Chat"}
                title={locale === "ar" ? "دردشة" : "Chat"}
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "h-10 w-10 p-0 rounded-full bg-black/40 text-white hover:bg-black/55 border border-white/20 backdrop-blur",
                })}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Link>
              <ShareActionButton
                locale={locale}
                path={handlePath}
                title={name}
                text={description || name}
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "h-10 w-10 p-0 rounded-full bg-black/40 text-white hover:bg-black/55 border border-white/20 backdrop-blur",
                })}
              />
              {/* Language Toggle */}
              <div className="inline-flex items-center gap-0.5 rounded-full bg-black/40 p-0.5 backdrop-blur border border-white/20 h-10">
                <button
                  onClick={() => setContentLang("en")}
                  className={`
                    rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 h-9
                    ${
                      contentLang === "en"
                        ? "bg-white text-black shadow-sm"
                        : "text-white/80 hover:text-white"
                    }
                  `}
                  aria-label="Switch to English content"
                  aria-pressed={contentLang === "en"}
                >
                  EN
                </button>
                <button
                  onClick={() => setContentLang("ar")}
                  className={`
                    rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 h-9
                    ${
                      contentLang === "ar"
                        ? "bg-white text-black shadow-sm"
                        : "text-white/80 hover:text-white"
                    }
                  `}
                  aria-label="Switch to Arabic content"
                  aria-pressed={contentLang === "ar"}
                >
                  AR
                </button>
              </div>
            </div>
          </div>

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
                        {renderCategoryIcon(categoryIconId, "h-6 w-6 text-(--muted-foreground)")}
                      </div>
                    ) : (
                      <div className="text-xl font-bold bg-linear-to-br from-accent to-accent-2 bg-clip-text text-transparent opacity-80">
                        {name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h1 className="truncate text-xl font-bold text-white sm:text-2xl" style={{textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)'}}>
                        {name}
                      </h1>
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
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/30 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white shadow-lg" style={{textShadow: '0 1px 3px rgba(0,0,0,0.8)'}}>
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
                        </svg>
                        {locale === "ar" ? "مميز" : "Special"}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="hidden sm:block" />
            </div>
          </div>
        </div>
      </div>

      <BusinessStoriesStrip
        businessId={business.id}
        businessName={business.name}
        businessAvatar={business.media?.logo || null}
        businessUsername={business.username || null}
        stories={stories}
        locale={locale}
        currentUserId={user.id}
        isBusinessOwner={isOwner}
        isAdmin={user.role === "admin"}
      />

      {/* Body */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,360px)]">
        {/* Main */}
        <div className="min-w-0">
          {description ? (
            <section className="sbc-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold tracking-tight">
                {locale === "ar" ? "نبذة" : "About"}
              </h2>
              <div className="mt-3 text-sm leading-7 text-foreground">
                <MarkdownRenderer content={description} />
              </div>
            </section>
          ) : null}

          {Number.isFinite(business.latitude) && Number.isFinite(business.longitude) ? (
            <section className="sbc-card mt-6 rounded-2xl p-6">
              <h2 className="text-lg font-semibold tracking-tight">
                {locale === "ar" ? "الموقع" : "Location"}
              </h2>
              <div className="mt-4 overflow-hidden rounded-xl">
                <StaticLocationMap
                  latitude={business.latitude}
                  longitude={business.longitude}
                  locale={locale}
                  className="h-64"
                  markerImageUrl={business.media?.logo}
                />
              </div>
            </section>
          ) : null}

          {beforeEngagement}

          <div className="mt-6">
            <BusinessEngagement
              locale={locale}
              businessId={business.id}
              businessSlug={business.slug}
              currentUserId={user.id}
              canModerate={canModerate}
              initialLikeCount={likeCount}
              initialLiked={liked}
              approvedComments={approvedComments}
              myPendingComments={myPendingComments}
              pendingForModeration={pendingForModeration}
              usersById={usersById}
            />
          </div>

          {/* Story Upload for Business Owners */}
          {isOwner ? (
            <div className="mt-6">
              <StoryUpload
                businessId={business.id}
                locale={locale}
                existingStories={stories}
              />
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="min-w-0 space-y-6">
          <div className="sbc-card rounded-2xl p-4">
            <h3 className="text-sm font-semibold tracking-tight mb-3">
              {locale === "ar" ? "معلومات الاتصال" : "Contact"}
            </h3>
            <div className="space-y-1.5">
              {business.phone ? (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/5 transition-colors group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <FiPhone className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {locale === "ar" ? "هاتف" : "Phone"}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
                      {business.phone}
                    </div>
                  </div>
                </a>
              ) : null}
              {business.email ? (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/5 transition-colors group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <FiMail className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {locale === "ar" ? "بريد إلكتروني" : "Email"}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
                      {business.email}
                    </div>
                  </div>
                </a>
              ) : null}
              {business.website ? (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/5 transition-colors group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <FiGlobe className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {locale === "ar" ? "موقع إلكتروني" : "Website"}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
                      {business.website.replace(/^https?:\/\/(www\.)?/, "")}
                    </div>
                  </div>
                </a>
              ) : null}
              {business.address || business.city ? (
                <div className="flex items-start gap-2.5 p-2 rounded-lg">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <FiMapPin className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {locale === "ar" ? "عنوان" : "Address"}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-foreground">
                      {[business.address, business.city].filter(Boolean).join(", ")}
                      {mapsHref ? (
                        <>
                          {" "}
                          <a
                            href={mapsHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline inline-flex items-center gap-1"
                          >
                            {locale === "ar" ? "عرض على الخريطة" : "View on map"}
                          </a>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
              {categoryLabel ? (
                <div className="flex items-center gap-2.5 p-2 rounded-lg">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                    <FiTag className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {locale === "ar" ? "فئة" : "Category"}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-foreground">{categoryLabel}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
