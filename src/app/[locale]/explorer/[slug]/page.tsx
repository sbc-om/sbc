import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessBySlug } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { getUserById } from "@/lib/db/users";
import {
  getBusinessLikeCount,
  hasUserLikedBusiness,
  listBusinessComments,
} from "@/lib/db/businessEngagement";
import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { StaticLocationMap } from "@/components/maps/StaticLocationMap";
import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";
import { BusinessEngagement } from "@/components/business/BusinessEngagement";
import { ShareActionButton } from "@/components/ShareActionButton";

export default async function ExplorerBusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  const business = getBusinessBySlug(slug);
  if (!business) notFound();

  const heroImage = business.media?.cover || business.media?.banner || business.media?.logo;
  const logo = business.media?.logo;
  const category = business.categoryId ? getCategoryById(business.categoryId) : null;
  const avatarMode = business.avatarMode ?? "icon";
  const showLogo = avatarMode === "logo" && !!logo;
  const CategoryIcon = getCategoryIconComponent(category?.iconId);
  const categoryLabel = category
    ? locale === "ar"
      ? category.name.ar
      : category.name.en
    : business.category;

  const name = locale === "ar" ? business.name.ar : business.name.en;
  const description = business.description
    ? locale === "ar"
      ? business.description.ar
      : business.description.en
    : "";
  const isVerified = business.isVerified ?? false;
  const isSpecial = business.isSpecial ?? false;

  const mapQuery = [business.address, business.city].filter(Boolean).join(" ").trim();
  const mapsHref = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  const likeCount = getBusinessLikeCount(business.id);
  const liked = hasUserLikedBusiness(user.id, business.id);

  const allComments = listBusinessComments(business.id);
  const approvedComments = allComments.filter((c) => c.status === "approved");
  const myPendingComments = allComments.filter((c) => c.status === "pending" && c.userId === user.id);
  const canModerate = user.role === "admin" || (!!business.ownerId && business.ownerId === user.id);
  const pendingForModeration = canModerate ? allComments.filter((c) => c.status === "pending") : [];

  const needUserIds = new Set<string>();
  for (const c of approvedComments) needUserIds.add(c.userId);
  for (const c of myPendingComments) needUserIds.add(c.userId);
  for (const c of pendingForModeration) needUserIds.add(c.userId);

  const usersById: Record<string, { displayName?: string; email?: string } | undefined> = {};
  for (const id of needUserIds) {
    const u = getUserById(id);
    usersById[id] = u ? { displayName: u.displayName, email: u.email } : undefined;
  }

  return (
    <AppPage>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0" />
        <Link
          href={`/${locale}/explorer`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {locale === "ar" ? "العودة" : "Back"}
        </Link>
      </div>

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
              className={`absolute top-3 ${locale === "ar" ? "start-3" : "end-3"} sm:top-4 sm:${
                locale === "ar" ? "start-4" : "end-4"
              } flex items-center gap-2`}
            >
              <Link
                href={`/${locale}/chat/${business.slug}`}
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
                locale={locale as Locale}
                path={`/${locale}/businesses/${business.slug}`}
                title={name}
                text={description || name}
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "h-10 w-10 p-0 rounded-full bg-black/40 text-white hover:bg-black/55 border border-white/20 backdrop-blur",
                })}
              />
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
                  </div>
                </div>
              </div>

              <div className="hidden sm:block" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {description ? (
            <section className="sbc-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold tracking-tight">
                {locale === "ar" ? "نبذة" : "About"}
              </h2>
              <div className="mt-3 text-sm leading-7 text-foreground">{description}</div>
            </section>
          ) : null}

          {business.latitude && business.longitude ? (
            <section className={description ? "mt-6" : ""}>
                <div className="mt-4 rounded-lg overflow-hidden">
                  <StaticLocationMap
                    latitude={business.latitude}
                    longitude={business.longitude}
                    locale={locale}
                  />
                </div>
            </section>
          ) : null}

          <section className={(description || (business.latitude && business.longitude)) ? "mt-6" : ""}>
            <BusinessEngagement
              locale={locale as Locale}
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
          </section>
        </div>

        <aside className="space-y-6">
          <div className="sbc-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold tracking-tight">
              {locale === "ar" ? "التواصل" : "Contact"}
            </h3>
            <div className="mt-4 grid gap-3 text-sm">
              {business.city ? (
                <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
                    {locale === "ar" ? "المدينة" : "City"}
                  </div>
                  <div className="mt-2 text-foreground">{business.city}</div>
                </div>
              ) : null}

              {business.address ? (
                <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
                    {locale === "ar" ? "العنوان" : "Address"}
                  </div>
                  <div className="mt-2 text-foreground">{business.address}</div>
                </div>
              ) : null}

              {business.phone ? (
                <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
                    {locale === "ar" ? "الهاتف" : "Phone"}
                  </div>
                  <div className="mt-2">
                    <a className="font-medium text-foreground underline-offset-4 hover:underline" href={`tel:${business.phone}`}>
                      {business.phone}
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
                    <a className="font-medium text-foreground underline-offset-4 hover:underline break-all" href={`mailto:${business.email}`}>
                      {business.email}
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
                    <a className="font-medium text-foreground underline-offset-4 hover:underline break-all" href={business.website} target="_blank" rel="noreferrer">
                      {business.website}
                    </a>
                  </div>
                </div>
              ) : null}

              {mapsHref ? (
                <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-(--muted-foreground)">
                    {locale === "ar" ? "الخريطة" : "Map"}
                  </div>
                  <div className="mt-2">
                    <a className="font-medium text-foreground underline-offset-4 hover:underline" href={mapsHref} target="_blank" rel="noreferrer">
                      {locale === "ar" ? "فتح في الخرائط" : "Open in maps"}
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </AppPage>
  );
}
