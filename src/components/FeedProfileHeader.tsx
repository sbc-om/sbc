import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";

interface FeedProfileHeaderProps {
  user: { username: string; email: string; role: string };
  locale: Locale;
}

export function FeedProfileHeader({ user, locale }: FeedProfileHeaderProps) {
  return (
    <div className="sbc-card rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Link href={`/${locale}/dashboard`} className="shrink-0">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-accent to-accent-2 ring-2 ring-accent/20">
              <span className="text-2xl font-bold text-white">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/${locale}/dashboard`}>
            <h2 className="text-xl font-bold hover:opacity-80 transition-opacity">
              {user.username}
            </h2>
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
          <div>
            <div className="text-xl font-bold">0</div>
            <div className="text-xs text-(--muted-foreground)">
              {locale === "ar" ? "المنشورات" : "Posts"}
            </div>
          </div>
          <div>
            <div className="text-xl font-bold">0</div>
            <div className="text-xs text-(--muted-foreground)">
              {locale === "ar" ? "المتابعون" : "Followers"}
            </div>
          </div>
          <div>
            <div className="text-xl font-bold">0</div>
            <div className="text-xs text-(--muted-foreground)">
              {locale === "ar" ? "المتابَعون" : "Following"}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-4">
        <Link
          href={`/${locale}/dashboard`}
          className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-center bg-(--surface) hover:bg-(--muted-foreground)/10 transition-colors"
        >
          {locale === "ar" ? "تعديل الملف الشخصي" : "Edit Profile"}
        </Link>
        <Link
          href={`/${locale}/businesses`}
          className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-center bg-(--surface) hover:bg-(--muted-foreground)/10 transition-colors"
        >
          {locale === "ar" ? "تصفح الأعمال" : "Browse Businesses"}
        </Link>
      </div>
    </div>
  );
}
