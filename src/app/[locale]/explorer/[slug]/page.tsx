import { notFound } from "next/navigation";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessBySlug, getBusinessByUsername } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import { getUserById } from "@/lib/db/users";
import {
  getBusinessLikeCount,
  hasUserLikedBusiness,
  listBusinessComments,
} from "@/lib/db/businessEngagement";
import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { ExplorerBusinessView } from "@/components/business/ExplorerBusinessView";

export default async function ExplorerBusinessDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);

  const business = slug.startsWith("@")
    ? getBusinessByUsername(slug)
    : getBusinessBySlug(slug);
  if (!business) notFound();

  const category = business.categoryId ? getCategoryById(business.categoryId) : null;

  const handlePath = business.username
    ? `/@${business.username}`
    : `/${locale}/businesses/${business.slug}`;

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

      <ExplorerBusinessView
        business={business}
        locale={locale as Locale}
        siteLocale={locale as Locale}
        user={user}
        category={category}
        categoryIconId={category?.iconId}
        handlePath={handlePath}
        mapsHref={mapsHref}
        likeCount={likeCount}
        liked={liked}
        approvedComments={approvedComments}
        myPendingComments={myPendingComments}
        pendingForModeration={pendingForModeration}
        canModerate={canModerate}
        usersById={usersById}
      />
    </AppPage>
  );
}
