"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";
import type { User } from "@/lib/db/types";

type UserProfilePageProps = {
  locale: Locale;
  user: User;
};

export function UserProfilePage({ locale, user }: UserProfilePageProps) {
  const ar = locale === "ar";
  const displayName = user.displayName || user.fullName || user.email;
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/${locale}/u/@${user.username}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/u/@${user.username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-(--background)">
      {/* Header */}
      <div className="border-b border-(--surface-border) bg-(--surface/0.5) backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-(--muted-foreground) hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {ar ? "العودة" : "Back"}
          </Link>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="sbc-card rounded-2xl p-8 text-center">
          {/* Avatar */}
          <div className="relative h-24 w-24 mx-auto mb-4 rounded-full overflow-hidden bg-(--chip-bg)">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={displayName}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-3xl font-bold text-(--muted-foreground)">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-semibold">{displayName}</h1>
          
          {/* Username */}
          {user.username && (
            <p className="mt-1 text-(--muted-foreground)">@{user.username}</p>
          )}

          {/* Bio (if we add it later) */}
          {/* <p className="mt-4 text-sm text-(--muted-foreground)">Bio here...</p> */}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/chat/@${user.username || user.id}`}
              className={buttonVariants({ variant: "primary" })}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {ar ? "إرسال رسالة" : "Send Message"}
            </Link>

            <button
              onClick={handleShare}
              className={buttonVariants({ variant: "secondary" })}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {ar ? "مشاركة" : "Share"}
            </button>

            <button
              onClick={handleCopyLink}
              className={buttonVariants({ variant: "ghost" })}
            >
              {copied ? (
                <>
                  <svg className="h-4 w-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {ar ? "تم النسخ" : "Copied"}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {ar ? "نسخ الرابط" : "Copy Link"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Additional info section */}
        <div className="mt-6 text-center text-sm text-(--muted-foreground)">
          {ar 
            ? "انضم إلى المنصة للتواصل مع المستخدمين والشركات" 
            : "Join the platform to connect with users and businesses"
          }
        </div>
      </div>
    </div>
  );
}
