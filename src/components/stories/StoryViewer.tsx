"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { BusinessWithStories, Story } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";
import { getTimeAgo } from "./StoriesCarousel";

interface StoryViewerProps {
  businesses: BusinessWithStories[];
  initialBusinessId: string;
  locale: Locale;
  onClose: () => void;
}

export function StoryViewer({ businesses, initialBusinessId, locale, onClose }: StoryViewerProps) {
  const ar = locale === "ar";
  
  // Find initial business index
  const initialIndex = businesses.findIndex(b => b.businessId === initialBusinessId);
  const [currentBusinessIndex, setCurrentBusinessIndex] = useState(Math.max(0, initialIndex));
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const currentBusiness = businesses[currentBusinessIndex];
  const currentStory = currentBusiness?.stories[currentStoryIndex];
  
  // Story duration: 5 seconds for images, video duration for videos
  const storyDuration = currentStory?.mediaType === "video" ? 15000 : 5000;

  // Navigate to next story/business
  const goNext = useCallback(() => {
    if (!currentBusiness) return;
    
    if (currentStoryIndex < currentBusiness.stories.length - 1) {
      // Next story in same business
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentBusinessIndex < businesses.length - 1) {
      // Next business
      setCurrentBusinessIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      // End of all stories
      onClose();
    }
  }, [currentBusiness, currentStoryIndex, currentBusinessIndex, businesses.length, onClose]);

  // Navigate to previous story/business
  const goPrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Previous story in same business
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentBusinessIndex > 0) {
      // Previous business (start from their last story)
      const prevBusiness = businesses[currentBusinessIndex - 1];
      setCurrentBusinessIndex(prev => prev - 1);
      setCurrentStoryIndex(prevBusiness.stories.length - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, currentBusinessIndex, businesses]);

  // Track story view
  useEffect(() => {
    if (currentStory) {
      fetch(`/api/stories/${currentStory.id}`, { method: "POST" }).catch(() => {});
    }
  }, [currentStory?.id]);

  // Progress bar animation
  useEffect(() => {
    if (isPaused || !currentStory) return;
    
    // For videos, wait until loaded
    if (currentStory.mediaType === "video" && !isVideoLoaded) return;

    const startTime = Date.now();
    const duration = storyDuration;

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        goNext();
      }
    }, 50);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStory, isPaused, isVideoLoaded, storyDuration, goNext]);

  // Reset video loaded state when story changes
  useEffect(() => {
    setIsVideoLoaded(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [currentStory?.id]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") ar ? goPrev() : goNext();
      if (e.key === "ArrowLeft") ar ? goNext() : goPrev();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ar, goNext, goPrev, onClose]);

  // Handle touch/click for navigation
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;
    
    if (ar) {
      isLeftHalf ? goNext() : goPrev();
    } else {
      isLeftHalf ? goPrev() : goNext();
    }
  };

  if (!currentBusiness || !currentStory) {
    return null;
  }

  const businessName = ar ? currentBusiness.businessName.ar : currentBusiness.businessName.en;
  const timeAgo = getTimeAgo(currentStory.createdAt, ar);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onClick={handleContainerClick}
      ref={containerRef}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-50 text-white/80 hover:text-white p-2"
        aria-label="Close"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Story container - 9:16 aspect ratio */}
      <div className="relative w-full max-w-[420px] h-full max-h-[calc(100vh-32px)] aspect-[9/16] mx-auto">
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-40 flex gap-1">
          {currentBusiness.stories.map((story, idx) => (
            <div key={story.id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: idx < currentStoryIndex ? "100%" : idx === currentStoryIndex ? `${progress}%` : "0%"
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div 
          className="absolute top-6 left-2 right-2 z-40 flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Link 
            href={currentBusiness.businessUsername ? `/@${currentBusiness.businessUsername}` : `#`}
            className="flex items-center gap-3"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              {currentBusiness.businessAvatar ? (
                <Image
                  src={currentBusiness.businessAvatar}
                  alt={businessName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {businessName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">{businessName}</div>
              <div className="text-white/60 text-xs">{timeAgo}</div>
            </div>
          </Link>

          {/* Pause indicator */}
          {isPaused && (
            <div className="text-white/60 text-xs">
              {ar ? "متوقف" : "Paused"}
            </div>
          )}
        </div>

        {/* Media */}
        <div 
          className="absolute inset-0 bg-black rounded-xl overflow-hidden"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={false}
              onLoadedData={() => setIsVideoLoaded(true)}
              onEnded={goNext}
            />
          ) : (
            <Image
              src={currentStory.mediaUrl}
              alt="Story"
              fill
              className="object-contain"
              priority
            />
          )}
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div 
            className="absolute bottom-4 left-4 right-4 z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-white text-sm">{currentStory.caption}</p>
            </div>
          </div>
        )}

        {/* Navigation arrows for desktop */}
        {currentBusinessIndex > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className={`absolute top-1/2 -translate-y-1/2 ${ar ? "right-[-60px]" : "left-[-60px]"} hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors`}
          >
            <svg className={`w-6 h-6 ${ar ? "" : "rotate-180"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        
        {currentBusinessIndex < businesses.length - 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className={`absolute top-1/2 -translate-y-1/2 ${ar ? "left-[-60px]" : "right-[-60px]"} hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors`}
          >
            <svg className={`w-6 h-6 ${ar ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
