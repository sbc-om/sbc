import { notFound } from "next/navigation";
import Link from "next/link";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";

import { AppPage } from "@/components/AppPage";
import { BusinessFeedCard } from "@/components/BusinessFeedCard";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinessesByOwner } from "@/lib/db/businesses";
import { getCategoryById } from "@/lib/db/categories";
import {
  getBusinessLikeCount,
  hasUserLikedBusiness,
  hasUserSavedBusiness,
  getBusinessComments,
} from "@/lib/db/businessEngagement";
import { toggleBusinessLikeAction, toggleBusinessSaveAction } from "../../home/actions";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function ProfileBusinessesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await requireUser(locale as Locale);
  const businesses = await listBusinessesByOwner(auth.id);

  // Prepare engagement data for each business
  const businessesWithEngagement = await Promise.all(businesses.map(async (b) => {
    const category = b.categoryId ? await getCategoryById(b.categoryId) : null;
    const comments = await getBusinessComments(b.id);
    const approvedComments = comments.filter((c) => c.status === "approved");

    return {
      business: b,
      categoryName: category ? (locale === "ar" ? category.name.ar : category.name.en) : undefined,
      categoryIconId: category?.iconId,
      initialLikeCount: await getBusinessLikeCount(b.id),
      initialLiked: await hasUserLikedBusiness(auth.id, b.id),
      initialSaved: await hasUserSavedBusiness(auth.id, b.id),
      commentCount: approvedComments.length,
    };
  }));

  const t = {
    title: locale === "ar" ? "أعمالي" : "My Businesses",
    back: locale === "ar" ? "رجوع" : "Back",
    empty: locale === "ar" ? "لم تقم بإضافة أي أعمال بعد" : "You haven't created any businesses yet",
    emptyDesc: locale === "ar" ? "عندما تقوم بإنشاء عمل، سيظهر هنا" : "When you create a business, it will appear here",
  };

  return (
    <AppPage>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-2 text-sm text-(--muted-foreground) hover:text-foreground transition-colors"
        >
          {locale === "ar" ? <IoArrowForward className="w-5 h-5" /> : <IoArrowBack className="w-5 h-5" />}
          {t.back}
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {businesses.length} {locale === "ar" ? "عمل" : "businesses"}
        </p>
      </div>

      {businesses.length === 0 ? (
        <div className="sbc-card rounded-2xl p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-(--muted-foreground) opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="mt-4 text-base font-medium">{t.empty}</p>
          <p className="mt-2 text-sm text-(--muted-foreground)">{t.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businessesWithEngagement.map((item) => (
            <BusinessFeedCard
              key={item.business.id}
              business={item.business}
              locale={locale}
              categoryName={item.categoryName}
              categoryIconId={item.categoryIconId}
              initialLikeCount={item.initialLikeCount}
              initialLiked={item.initialLiked}
              initialSaved={item.initialSaved}
              commentCount={item.commentCount}
              onToggleLike={toggleBusinessLikeAction.bind(null, locale)}
              onToggleSave={toggleBusinessSaveAction.bind(null, locale)}
            />
          ))}
        </div>
      )}
    </AppPage>
  );
}
