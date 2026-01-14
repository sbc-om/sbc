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
        <div className="min-w-0">
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
            {name}
          </h1>
        </div>
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
                    <div className="truncate text-xl font-semibold text-white drop-shadow sm:text-2xl">
                      {name}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex flex-wrap items-center gap-2">
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

                {mapsHref ? (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: "text-white/90 hover:text-white",
                    })}
                  >
                    {locale === "ar" ? "خريطة" : "Map"}
                  </a>
                ) : null}
              </div>
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
            <div className="mt-4 grid gap-2 text-sm">
              {business.phone ? (
                <a className="hover:underline" href={`tel:${business.phone}`}>
                  {business.phone}
                </a>
              ) : null}
              {business.email ? (
                <a className="hover:underline" href={`mailto:${business.email}`}>
                  {business.email}
                </a>
              ) : null}
              {business.website ? (
                <a className="hover:underline" href={business.website} target="_blank" rel="noreferrer">
                  {business.website}
                </a>
              ) : null}
              {mapsHref ? (
                <a className="hover:underline" href={mapsHref} target="_blank" rel="noreferrer">
                  {locale === "ar" ? "فتح الخريطة" : "Open map"}
                </a>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </AppPage>
  );
}
