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
        <div className="flex gap-3 px-4 py-2" dir={ar ? "rtl" : "ltr"}>
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
      className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
    >
      {/* Circle with gradient border */}
      <div
        className={`relative rounded-full p-[3px] transition-transform group-hover:scale-105 ${
          hasUnviewed
            ? "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600"
            : "bg-(--surface-border)"
        }`}
      >
        {/* White/dark inner ring */}
        <div className="rounded-full p-[2px] bg-background">
          {/* Avatar */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-(--surface)">
            {avatar ? (
              <Image
                src={avatar}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-(--muted-foreground)">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        
        {/* Story count badge */}
        {business.stories.length > 1 && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-accent text-(--accent-foreground) text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-background">
            {business.stories.length}
          </div>
        )}
      </div>
      
      {/* Name */}
      <span className="text-xs font-medium text-(--muted-foreground) max-w-[72px] truncate">
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
