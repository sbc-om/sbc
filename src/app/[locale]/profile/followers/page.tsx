import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";
import { HiUser } from "react-icons/hi2";

import { AppPage } from "@/components/AppPage";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinessesByOwner } from "@/lib/db/businesses";
import { getUserById } from "@/lib/db/users";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

export default async function ProfileFollowersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const auth = await requireUser(locale as Locale);
  const businesses = await listBusinessesByOwner(auth.id);
  const businessIds = businesses.map(b => b.id);

  // TODO: getBusinessFollowers doesn't exist yet - followers feature needs implementation
  // For now, return empty array
  const followers: NonNullable<Awaited<ReturnType<typeof getUserById>>>[] = [];

  const t = {
    title: locale === "ar" ? "المتابعون" : "Followers",
    subtitle: locale === "ar" ? "الأشخاص الذين يتابعون أعمالك" : "People who follow your businesses",
    back: locale === "ar" ? "رجوع" : "Back",
    empty: locale === "ar" ? "لا يوجد متابعون لأعمالك حتى الآن" : "No one is following your businesses yet",
    emptyDesc: locale === "ar" ? "عندما يعجب شخص بأعمالك أو يحفظها، سيظهر هنا" : "When someone likes or saves your businesses, they'll appear here",
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
        <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {followers.length} {locale === "ar" ? "متابع" : "followers"}
        </p>
      </div>

      {followers.length === 0 ? (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mt-4 text-base font-medium">{t.empty}</p>
          <p className="mt-2 text-sm text-(--muted-foreground)">{t.emptyDesc}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {followers.map((follower) => {
            const displayName = follower.displayName ?? follower.email.split("@")[0];
            const avatarInitial = (displayName || "U").slice(0, 1).toUpperCase();

            return (
              <div
                key={follower.id}
                className="sbc-card rounded-2xl p-6 flex flex-col items-center gap-4 hover:ring-2 hover:ring-accent/20 transition-all"
              >
                {/* Avatar */}
                <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-accent/20">
                  {follower.avatarUrl ? (
                    <Image
                      src={follower.avatarUrl}
                      alt={displayName}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-accent to-accent-2 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-white">
                        {avatarInitial}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="text-center">
                  <h3 className="font-semibold text-base">{displayName}</h3>
                  <p className="text-sm text-(--muted-foreground) mt-1">
                    {follower.email}
                  </p>
                  {follower.bio && (
                    <p className="text-sm text-(--muted-foreground) mt-2 line-clamp-2">
                      {follower.bio}
                    </p>
                  )}
                </div>

                {/* Role Badge */}
                {follower.role === "admin" && (
                  <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                    {locale === "ar" ? "مسؤول" : "Admin"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppPage>
  );
}
