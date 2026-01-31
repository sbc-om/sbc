"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useChatSidebar } from "./ChatLayoutClient";

type ChatHeaderProps = {
  business: {
    id?: string;
    name: { ar: string; en: string };
    slug: string;
    categoryId?: string;
    media?: {
      logo?: string;
      cover?: string;
      banner?: string;
    };
  };
  locale: string;
  participantType?: "business" | "user";
};

export function ChatHeader({ business, locale, participantType = "business" }: ChatHeaderProps) {
  const sidebarRef = useChatSidebar();
  const name = locale === "ar" ? business.name.ar : business.name.en;
  const logo = business.media?.logo || business.media?.cover;
  const [categoryName, setCategoryName] = useState<string | null>(null);

  // Only fetch category for business participants
  useEffect(() => {
    if (participantType === "business" && business.categoryId) {
      fetch(`/api/categories/${business.categoryId}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.category) {
            setCategoryName(locale === "ar" ? data.category.name.ar : data.category.name.en);
          }
        })
        .catch(() => {});
    }
  }, [business.categoryId, locale, participantType]);

  // Determine link destination based on participant type
  const profileLink = participantType === "user" 
    ? `/${locale}/u/@${business.slug}`
    : `/${locale}/explorer/${business.slug}`;

  return (
    <div className="border-b border-(--surface-border) bg-(--surface/0.5) backdrop-blur-sm">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => sidebarRef?.current?.open()}
          className="lg:hidden h-9 w-9 rounded-lg hover:bg-(--surface) flex items-center justify-center transition-colors shrink-0"
          aria-label={locale === "ar" ? "فتح قائمة الدردشات" : "Open chats menu"}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link
          href={profileLink}
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-(--chip-bg) flex items-center justify-center">
            {logo ? (
              <Image src={logo} alt={name} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="text-sm font-bold text-(--muted-foreground)">{name.charAt(0)}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-sm">{name}</div>
            {participantType === "business" && categoryName && (
              <div className="truncate text-xs text-(--muted-foreground)">{categoryName}</div>
            )}
            {participantType === "user" && (
              <div className="truncate text-xs text-(--muted-foreground)">
                {locale === "ar" ? "کاربر" : "User"}
              </div>
            )}
          </div>
        </Link>

        <Link
          href={profileLink}
          className="h-9 px-3 rounded-lg hover:bg-(--surface) flex items-center gap-1.5 text-xs font-medium text-(--muted-foreground) hover:text-foreground transition-colors shrink-0"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="hidden sm:inline">
            {locale === "ar" ? "معلومات" : "Info"}
          </span>
        </Link>
      </div>
    </div>
  );
}
