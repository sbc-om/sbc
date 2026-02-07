"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";

import type { BusinessWithStories, Story } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";

interface StoriesCarouselProps {
  businesses: BusinessWithStories[];
  locale: Locale;
  onOpenStory: (businessId: string, storyIndex?: number) => void;
}

export function StoriesCarousel({ businesses, locale, onOpenStory }: StoriesCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const ar = locale === "ar";

  if (businesses.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 px-4 py-3" dir={ar ? "rtl" : "ltr"}>
          {businesses.map((business) => (
            <StoryCircle
              key={business.businessId}
              business={business}
              locale={locale}
              onClick={() => onOpenStory(business.businessId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface StoryCircleProps {
  business: BusinessWithStories;
  locale: Locale;
  onClick: () => void;
}

function StoryCircle({ business, locale, onClick }: StoryCircleProps) {
  const ar = locale === "ar";
  const hasUnviewed = business.hasUnviewed;
  const name = ar ? business.businessName.ar : business.businessName.en;
  const avatar = business.businessAvatar;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 group active:scale-95 transition-transform duration-150"
    >
      {/* Circle with gradient border */}
      <div
        className={`relative rounded-full p-[2.5px] transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg ${
          hasUnviewed
            ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-pink-500/20"
            : "bg-(--surface-border) opacity-70"
        }`}
      >
        {/* Inner ring */}
        <div className="rounded-full p-[2px] bg-background">
          {/* Avatar */}
          <div className="relative w-[66px] h-[66px] rounded-full overflow-hidden bg-(--surface)">
            {avatar ? (
              <Image
                src={avatar}
                alt={name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-(--muted-foreground) bg-gradient-to-br from-(--surface) to-(--chip-bg)">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        
        {/* Story count badge */}
        {business.stories.length > 1 && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-background shadow-sm">
            {business.stories.length}
          </div>
        )}
      </div>
      
      {/* Name */}
      <span className={`text-[11px] font-medium max-w-[76px] truncate transition-colors ${
        hasUnviewed ? "text-foreground" : "text-(--muted-foreground)"
      }`}>
        {name}
      </span>
    </button>
  );
}

// Time ago helper
function getTimeAgo(date: string, ar: boolean): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return ar ? "الآن" : "now";
  if (diffMins < 60) return ar ? `${diffMins}د` : `${diffMins}m`;
  if (diffHours < 24) return ar ? `${diffHours}س` : `${diffHours}h`;
  return ar ? "أمس" : "yesterday";
}

export { getTimeAgo };
