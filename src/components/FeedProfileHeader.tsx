import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";

interface FeedProfileHeaderProps {
  user: {
    displayName: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    isVerified?: boolean;
    stats?: {
      businesses: number;
      followers: number;
      followedCategories: number;
    };
  };
  locale: Locale;
}

export function FeedProfileHeader({ user, locale }: FeedProfileHeaderProps) {
  const initial = (user.displayName?.trim() || user.email.split("@")[0] || "U")
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="sbc-card rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Link href={`/${locale}/profile`} className="shrink-0">
          <div className="relative">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-accent to-accent-2 ring-2 ring-accent/20">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName || user.email}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <span className="text-2xl font-bold text-white">{initial}</span>
              )}
            </div>
          </div>
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/${locale}/profile`} className="inline-flex items-center gap-2 min-w-0">
            <h2 className="text-xl font-bold hover:opacity-80 transition-opacity truncate">
              {user.displayName}
            </h2>
            {user.isVerified ? (
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 text-blue-600"
                aria-label={locale === "ar" ? "حساب موثق" : "Verified account"}
                title={locale === "ar" ? "حساب موثق" : "Verified account"}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                </svg>
              </span>
            ) : null}
          </Link>
          <p className="text-sm text-(--muted-foreground) truncate">{user.email}</p>
          {user.role === "admin" && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {locale === "ar" ? "مدير" : "Admin"}
            </span>
          )}
        </div>

        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-6 text-center">
          <Link
            href={`/${locale}/profile/businesses`}
            className="hover:opacity-70 transition-opacity"
          >
            <div className="text-xl font-bold">{user.stats?.businesses ?? 0}</div>
            <div className="text-xs text-(--muted-foreground)">
              {locale === "ar" ? "الأنشطة التجارية" : "Businesses"}
            </div>
          </Link>
          <Link
            href={`/${locale}/profile/followers`}
            className="hover:opacity-70 transition-opacity"
          >
            <div className="text-xl font-bold">{user.stats?.followers ?? 0}</div>
            <div className="text-xs text-(--muted-foreground)">
              {locale === "ar" ? "المتابعون" : "Followers"}
            </div>
          </Link>
          <Link
            href={`/${locale}/profile/following`}
            className="hover:opacity-70 transition-opacity"
          >
            <div className="text-xl font-bold">{user.stats?.followedCategories ?? 0}</div>
            <div className="text-xs text-(--muted-foreground)">
              {locale === "ar" ? "المتابَعة" : "Following"}
            </div>
          </Link>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-4">
        <Link
          href={`/${locale}/profile`}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-center bg-(--muted-foreground)/10 hover:bg-(--muted-foreground)/20 transition-colors"
        >
          {locale === "ar" ? "تعديل الملف الشخصي" : "Edit Profile"}
        </Link>
        <Link
          href={`/${locale}/businesses`}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-center bg-(--muted-foreground)/10 hover:bg-(--muted-foreground)/20 transition-colors"
        >
          {locale === "ar" ? "تصفح الأعمال" : "Browse Businesses"}
        </Link>
      </div>
    </div>
  );
}
