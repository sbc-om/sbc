"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

import type { BusinessWithStories } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";
import { StoriesCarousel } from "./StoriesCarousel";
import { StoryViewer } from "./StoryViewer";

interface StoriesContainerProps {
  initialBusinesses: BusinessWithStories[];
  locale: Locale;
  currentUserId?: string;
  ownedBusinessIds?: string[];
  isAdmin?: boolean;
}

export function StoriesContainer({ 
  initialBusinesses, 
  locale,
  currentUserId,
  ownedBusinessIds = [],
  isAdmin = false,
}: StoriesContainerProps) {
  const [businesses] = useState(initialBusinesses);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

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

  // Check if current user owns the selected business
  const isBusinessOwner = selectedBusinessId
    ? ownedBusinessIds.includes(selectedBusinessId)
    : false;

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

      {typeof document !== "undefined" && viewerOpen && selectedBusinessId && createPortal(
        <StoryViewer
          businesses={businesses}
          initialBusinessId={selectedBusinessId}
          locale={locale}
          onClose={handleCloseViewer}
          currentUserId={currentUserId}
          isBusinessOwner={isBusinessOwner}
          isAdmin={isAdmin}
        />,
        document.body
      )}
    </>
  );
}
