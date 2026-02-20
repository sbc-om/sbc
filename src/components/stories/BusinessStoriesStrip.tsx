"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

import type { BusinessWithStories, Story } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";
import { StoryViewer } from "./StoryViewer";
import { getTimeAgo } from "./StoriesCarousel";

type BusinessStoriesStripProps = {
  businessId: string;
  businessName: { en: string; ar: string };
  businessAvatar: string | null;
  businessUsername: string | null;
  stories: Story[];
  locale: Locale;
  currentUserId?: string;
  isBusinessOwner?: boolean;
  isAdmin?: boolean;
};

export function BusinessStoriesStrip({
  businessId,
  businessName,
  businessAvatar,
  businessUsername,
  stories,
  locale,
  currentUserId,
  isBusinessOwner = false,
  isAdmin = false,
}: BusinessStoriesStripProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);
  const ar = locale === "ar";
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
    direction: ar ? "rtl" : "ltr",
  });

  if (stories.length === 0) {
    return null;
  }

  const storyBusiness: BusinessWithStories = {
    businessId,
    businessName,
    businessAvatar,
    businessUsername,
    stories,
    hasUnviewed: true,
  };

  const openViewer = (storyIndex: number) => {
    setInitialStoryIndex(storyIndex);
    setViewerOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeViewer = () => {
    setViewerOpen(false);
    document.body.style.overflow = "";
  };

  return (
    <section className="mt-6 sbc-card rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">{ar ? "الستوري" : "Stories"}</h2>
        <span className="text-xs text-(--muted-foreground)">{stories.length}</span>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 pb-2" dir={ar ? "rtl" : "ltr"}>
          {stories.map((story, index) => (
            <button
              key={story.id}
              type="button"
              onClick={() => openViewer(index)}
              className="group flex flex-shrink-0 flex-col items-center gap-1.5 transition-transform duration-150 active:scale-95"
            >
              <div className="rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[2.5px]">
                <div className="rounded-full bg-background p-[2px]">
                  <div className="relative h-[66px] w-[66px] overflow-hidden rounded-full bg-(--surface)">
                      {story.mediaType === "video" ? (
                        <>
                          <video
                            src={story.mediaUrl}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            muted
                            playsInline
                            preload="metadata"
                          />
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="rounded-full bg-black/55 p-1.5 text-white">
                              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6 4.5A1.5 1.5 0 0 1 8.3 3.2l7.2 5.3a1.5 1.5 0 0 1 0 2.4l-7.2 5.3A1.5 1.5 0 0 1 6 15V4.5z" />
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Image
                          src={story.mediaUrl}
                          alt={ar ? "ستوري" : "Story"}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      )}
                  </div>
                </div>
              </div>
              <span className="max-w-[78px] truncate text-[11px] text-(--muted-foreground)">
                {getTimeAgo(story.createdAt, ar)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {typeof document !== "undefined" && viewerOpen
        ? createPortal(
            <StoryViewer
              businesses={[storyBusiness]}
              initialBusinessId={businessId}
              initialStoryIndex={initialStoryIndex}
              locale={locale}
              onClose={closeViewer}
              currentUserId={currentUserId}
              isBusinessOwner={isBusinessOwner}
              isAdmin={isAdmin}
            />,
            document.body,
          )
        : null}
    </section>
  );
}
