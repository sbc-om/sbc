"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { BusinessWithStories } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";
import { StoriesCarousel } from "./StoriesCarousel";
import { StoryViewer } from "./StoryViewer";

interface StoriesContainerProps {
  initialBusinesses: BusinessWithStories[];
  locale: Locale;
}

export function StoriesContainer({ initialBusinesses, locale }: StoriesContainerProps) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenStory = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setViewerOpen(true);
    // Prevent body scroll when viewer is open
    document.body.style.overflow = "hidden";
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedBusinessId(null);
    document.body.style.overflow = "";
  };

  // Don't render anything if no stories
  if (businesses.length === 0) {
    return null;
  }

  return (
    <>
      <StoriesCarousel
        businesses={businesses}
        locale={locale}
        onOpenStory={handleOpenStory}
      />

      {mounted && viewerOpen && selectedBusinessId && createPortal(
        <StoryViewer
          businesses={businesses}
          initialBusinessId={selectedBusinessId}
          locale={locale}
          onClose={handleCloseViewer}
        />,
        document.body
      )}
    </>
  );
}
