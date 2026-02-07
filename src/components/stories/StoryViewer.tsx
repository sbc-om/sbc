"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";

import type { BusinessWithStories, Story, StoryOverlays } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";
import { getTimeAgo } from "./StoriesCarousel";

/* ─── types ─── */

interface StoryViewerProps {
  businesses: BusinessWithStories[];
  initialBusinessId: string;
  locale: Locale;
  onClose: () => void;
  currentUserId?: string;
  isBusinessOwner?: boolean;
  isAdmin?: boolean;
}

interface StoryEngagement {
  liked: boolean;
  likeCount: number;
  commentCount: number;
}

interface StoryComment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  userFullName?: string;
  userAvatar?: string;
  userUsername?: string;
}

/* ─── constants ─── */
const STORY_DURATION = 15000; // 15 seconds for all stories

const FILTER_STYLES: Record<string, string> = {
  none: "",
  grayscale: "grayscale(100%)",
  sepia: "sepia(80%)",
  warm: "saturate(1.3) sepia(20%) brightness(1.1)",
  cool: "saturate(1.1) hue-rotate(10deg) brightness(1.05)",
  vintage: "sepia(30%) contrast(1.1) brightness(0.95)",
  dramatic: "contrast(1.4) saturate(1.2) brightness(0.9)",
  fade: "contrast(0.9) brightness(1.1) saturate(0.8)",
  vivid: "saturate(1.5) contrast(1.1)",
};

function buildFilterStyle(overlays: StoryOverlays): string {
  const filter = FILTER_STYLES[overlays.filter ?? "none"] || "";
  const b = overlays.brightness ?? 100;
  const c = overlays.contrast ?? 100;
  const s = overlays.saturation ?? 100;
  const adjustments = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
  return `${filter} ${adjustments}`.trim();
}

/* ─── component ─── */

export function StoryViewer({
  businesses,
  initialBusinessId,
  locale,
  onClose,
  currentUserId,
  isBusinessOwner = false,
  isAdmin = false,
}: StoryViewerProps) {
  const ar = locale === "ar";

  // Find initial business index
  const initialIndex = Math.max(0, businesses.findIndex((b) => b.businessId === initialBusinessId));

  /* ── Embla Carousel for businesses ── */
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialIndex,
    loop: false,
    dragFree: false,
    containScroll: "keepSnaps",
    direction: ar ? "rtl" : "ltr",
  });

  const [currentBusinessIndex, setCurrentBusinessIndex] = useState(initialIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  /* ── progress ── */
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  /* ── pause sources ── */
  const [holdPaused, setHoldPaused] = useState(false);
  const [commentFocused, setCommentFocused] = useState(false);
  const [panelOpen, setPanelOpen] = useState<"comments" | "stats" | null>(null);
  const isPaused = holdPaused || commentFocused || panelOpen !== null;

  /* ── media ── */
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ── engagement ── */
  const [engagement, setEngagement] = useState<StoryEngagement>({ liked: false, likeCount: 0, commentCount: 0 });
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storyStats, setStoryStats] = useState<any>(null);

  /* ── like animation ── */
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef(0);

  /* ── derived ── */
  const currentBusiness = businesses[currentBusinessIndex];
  const currentStory = currentBusiness?.stories[currentStoryIndex];
  const canViewComments = isBusinessOwner || isAdmin;

  /* ════════════════════════════════════════════
     Embla sync
     ════════════════════════════════════════════ */

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      if (idx !== currentBusinessIndex) {
        setCurrentBusinessIndex(idx);
        setCurrentStoryIndex(0);
        resetProgress();
      }
    };

    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, currentBusinessIndex]);

  /* ════════════════════════════════════════════
     Navigation
     ════════════════════════════════════════════ */

  const resetProgress = useCallback(() => {
    progressRef.current = 0;
    lastTimeRef.current = null;
    setProgress(0);
  }, []);

  const goNextStory = useCallback(() => {
    if (!currentBusiness) return;
    
    if (currentStoryIndex < currentBusiness.stories.length - 1) {
      setCurrentStoryIndex((p) => p + 1);
      resetProgress();
    } else if (currentBusinessIndex < businesses.length - 1) {
      // Go to next business
      emblaApi?.scrollNext();
    } else {
      // End of all stories
      onClose();
    }
  }, [currentBusiness, currentStoryIndex, currentBusinessIndex, businesses.length, emblaApi, onClose, resetProgress]);

  const goPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((p) => p - 1);
      resetProgress();
    } else if (currentBusinessIndex > 0) {
      // Go to previous business (last story)
      emblaApi?.scrollPrev();
    }
  }, [currentStoryIndex, currentBusinessIndex, emblaApi, resetProgress]);

  /* ════════════════════════════════════════════
     Progress timer (RAF-based, 15 seconds)
     ════════════════════════════════════════════ */

  useEffect(() => {
    if (!currentStory) return;

    // For videos, wait until loaded
    if (currentStory.mediaType === "video" && !isVideoLoaded) return;

    if (isPaused) {
      // Pause video
      if (currentStory.mediaType === "video" && videoRef.current) {
        videoRef.current.pause();
      }
      lastTimeRef.current = null;
      return;
    }

    // Resume video
    if (currentStory.mediaType === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }

    const tick = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }

      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      progressRef.current += (delta / STORY_DURATION) * 100;
      
      if (progressRef.current >= 100) {
        goNextStory();
        return;
      }

      setProgress(progressRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentStory?.id, isPaused, isVideoLoaded, goNextStory]);

  // Reset on story change
  useEffect(() => {
    resetProgress();
    setIsVideoLoaded(false);
    setShowHeartBurst(false);
    setPanelOpen(null);
    setNewComment("");
    if (videoRef.current) videoRef.current.currentTime = 0;
  }, [currentStory?.id, resetProgress]);

  /* ════════════════════════════════════════════
     Fetch engagement data
     ════════════════════════════════════════════ */

  useEffect(() => {
    if (!currentStory) return;

    // Record view
    fetch(`/api/stories/${currentStory.id}/view`, { method: "POST" }).catch(() => {});

    // Likes
    fetch(`/api/stories/${currentStory.id}/like`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setEngagement((p) => ({ ...p, liked: d.data.userLiked, likeCount: d.data.likeCount }));
      })
      .catch(() => {});

    // Comments (only fetch if can view)
    if (canViewComments) {
      fetch(`/api/stories/${currentStory.id}/comments`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) {
            setComments(d.data);
            setEngagement((p) => ({ ...p, commentCount: d.data.length }));
          }
        })
        .catch(() => {});
    }
  }, [currentStory?.id, canViewComments]);

  // Stats for owner/admin
  useEffect(() => {
    if (currentStory && (isBusinessOwner || isAdmin) && panelOpen === "stats") {
      fetch(`/api/stories/${currentStory.id}/stats`)
        .then((r) => r.json())
        .then((d) => { if (d.ok) setStoryStats(d.data.stats); })
        .catch(() => {});
    }
  }, [currentStory?.id, isBusinessOwner, isAdmin, panelOpen]);

  /* ════════════════════════════════════════════
     Like
     ════════════════════════════════════════════ */

  const handleLike = useCallback(async () => {
    if (!currentStory) return;
    try {
      if (engagement.liked) {
        const res = await fetch(`/api/stories/${currentStory.id}/like`, { method: "DELETE", credentials: "include" });
        const d = await res.json();
        if (d.ok) setEngagement((p) => ({ ...p, liked: false, likeCount: d.data.likeCount }));
      } else {
        const res = await fetch(`/api/stories/${currentStory.id}/like`, { method: "POST", credentials: "include" });
        const d = await res.json();
        if (d.ok) setEngagement((p) => ({ ...p, liked: true, likeCount: d.data.likeCount }));
      }
    } catch {}
  }, [currentStory?.id, engagement.liked]);

  const handleDoubleTap = useCallback(() => {
    if (engagement.liked) return;
    handleLike();
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 1000);
  }, [engagement.liked, handleLike]);

  /* ════════════════════════════════════════════
     Submit comment
     ════════════════════════════════════════════ */

  const handleSubmitComment = useCallback(async () => {
    if (!currentStory || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/stories/${currentStory.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment.trim() }),
        credentials: "include",
      });
      const d = await res.json();
      if (d.ok) {
        if (canViewComments) {
          setComments((p) => [...p, d.data]);
        }
        setEngagement((p) => ({ ...p, commentCount: p.commentCount + 1 }));
        setNewComment("");
      }
    } catch {}
    setIsSubmitting(false);
  }, [currentStory?.id, newComment, canViewComments]);

  /* ════════════════════════════════════════════
     Keyboard
     ════════════════════════════════════════════ */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
          setCommentFocused(false);
          setPanelOpen(null);
        }
        return;
      }
      if (panelOpen) {
        if (e.key === "Escape") setPanelOpen(null);
        return;
      }
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") ar ? goPrevStory() : goNextStory();
      if (e.key === "ArrowLeft") ar ? goNextStory() : goPrevStory();
      if (e.key === " ") {
        e.preventDefault();
        setHoldPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [ar, goNextStory, goPrevStory, onClose, panelOpen]);

  /* ════════════════════════════════════════════
     Touch & Click handlers
     ════════════════════════════════════════════ */

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = () => {
    holdTimerRef.current = setTimeout(() => setHoldPaused(true), 200);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setHoldPaused(false);
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, textarea, [data-interactive]")) return;

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleTap();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // Tap zones: left 1/3 = prev, right 1/3 = next, middle = pause toggle
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const zone = x / rect.width;

    if (zone < 0.33) {
      ar ? goNextStory() : goPrevStory();
    } else if (zone > 0.67) {
      ar ? goPrevStory() : goNextStory();
    }
  };

  /* ════════════════════════════════════════════
     Render
     ════════════════════════════════════════════ */

  if (!currentBusiness || !currentStory) return null;

  const businessName = ar ? currentBusiness.businessName.ar : currentBusiness.businessName.en;
  const timeAgo = getTimeAgo(currentStory.createdAt, ar);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center select-none">
      {/* Close button - single one at top right */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[60] text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Desktop navigation arrows */}
      {currentBusinessIndex > 0 && (
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {currentBusinessIndex < businesses.length - 1 && (
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Embla Carousel */}
      <div className="w-full h-full md:w-[420px] md:h-[calc(100vh-48px)] md:max-h-[860px] overflow-hidden" ref={emblaRef}>
        <div className="flex h-full" style={{ direction: ar ? "rtl" : "ltr" }}>
          {businesses.map((business, bizIdx) => (
            <div key={business.businessId} className="flex-[0_0_100%] min-w-0 h-full">
              {bizIdx === currentBusinessIndex && (
                <div
                  className="relative w-full h-full md:rounded-2xl overflow-hidden bg-black"
                  onClick={handleTap}
                  onMouseDown={handlePointerDown}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchEnd={handlePointerUp}
                >
                  {/* Media */}
                  <div className="absolute inset-0">
                    {currentStory.mediaType === "video" ? (
                      <video
                        ref={videoRef}
                        key={currentStory.id}
                        src={currentStory.mediaUrl}
                        className="w-full h-full object-contain"
                        style={currentStory.overlays ? { filter: buildFilterStyle(currentStory.overlays), transform: `scale(${currentStory.overlays.imageScale ?? 1}) translate(${currentStory.overlays.imagePosition?.x ?? 0}%, ${currentStory.overlays.imagePosition?.y ?? 0}%)`, transformOrigin: "center center" } : undefined}
                        autoPlay
                        playsInline
                        muted={false}
                        onLoadedData={() => setIsVideoLoaded(true)}
                        onEnded={goNextStory}
                      />
                    ) : (
                      <Image
                        key={currentStory.id}
                        src={currentStory.mediaUrl}
                        alt="Story"
                        fill
                        className="object-contain"
                        priority
                      />
                    )}
                  </div>

                  {/* Video overlays (text + stickers stored as metadata) */}
                  {currentStory.overlays && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      {currentStory.overlays.textOverlays?.map((text, i) => (
                        <div key={`t-${i}`} className="absolute" style={{ left: `${text.x}%`, top: `${text.y}%`, transform: `translate(-50%, -50%) rotate(${text.rotation}deg) scale(${text.scale})` }}>
                          <span className="px-3 py-1.5 whitespace-nowrap" style={{ fontSize: `${text.fontSize}px`, fontFamily: text.fontFamily, color: text.color, backgroundColor: text.backgroundColor, textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}>{text.text}</span>
                        </div>
                      ))}
                      {currentStory.overlays.stickerOverlays?.map((sticker, i) => (
                        <div key={`s-${i}`} className="absolute text-5xl" style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})` }}>
                          {sticker.emoji}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Gradients */}
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                  {/* Progress bars */}
                  <div className="absolute top-0 left-0 right-0 z-30 flex gap-[3px] px-3 pt-3" data-interactive>
                    {business.stories.map((story, idx) => (
                      <div key={story.id} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-white transition-none"
                          style={{
                            width: idx < currentStoryIndex ? "100%" : idx === currentStoryIndex ? `${progress}%` : "0%",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Header */}
                  <div className="absolute top-6 left-3 right-3 z-30 flex items-center gap-3" data-interactive>
                    <Link
                      href={business.businessUsername ? `/@${business.businessUsername}` : "#"}
                      className="flex items-center gap-3 min-w-0 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/20 flex-shrink-0 ring-2 ring-white/50">
                        {business.businessAvatar ? (
                          <Image src={business.businessAvatar} alt={businessName} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold">
                            {businessName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-semibold text-sm truncate drop-shadow-lg">{businessName}</div>
                        <div className="text-white/70 text-xs">{timeAgo}</div>
                      </div>
                    </Link>

                    {isPaused && (
                      <div className="flex items-center gap-1 text-white/60 text-xs bg-black/30 px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                        <span>{ar ? "متوقف" : "Paused"}</span>
                      </div>
                    )}
                  </div>

                  {/* Double-tap heart */}
                  {showHeartBurst && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                      <svg className="w-28 h-28 fill-white drop-shadow-2xl animate-[heartBurst_0.8s_ease-out_forwards]" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  )}

                  {/* Caption */}
                  {currentStory.caption && !panelOpen && (
                    <div className="absolute bottom-28 left-4 right-4 z-20 pointer-events-none">
                      <p className="text-white text-sm leading-relaxed drop-shadow-lg line-clamp-3">{currentStory.caption}</p>
                    </div>
                  )}

                  {/* Bottom engagement area */}
                  <div className="absolute bottom-0 left-0 right-0 z-30" data-interactive onClick={(e) => e.stopPropagation()}>
                    {panelOpen === null ? (
                      <div className="px-4 pb-6 pt-2">
                        {/* Engagement row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-5">
                            {/* Like */}
                            <button type="button" onClick={handleLike} className="group flex items-center gap-1.5 active:scale-90 transition-transform">
                              <svg
                                className={`w-7 h-7 transition-all ${engagement.liked ? "fill-red-500 text-red-500 scale-110" : "fill-none text-white group-hover:text-red-300"}`}
                                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {engagement.likeCount > 0 && <span className="text-white text-xs font-medium">{engagement.likeCount}</span>}
                            </button>

                            {/* Comment icon - shows count, opens panel only for owner/admin */}
                            <button
                              type="button"
                              onClick={() => canViewComments && setPanelOpen("comments")}
                              className="group flex items-center gap-1.5 active:scale-90 transition-transform"
                            >
                              <svg className="w-7 h-7 text-white group-hover:text-blue-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {engagement.commentCount > 0 && <span className="text-white text-xs font-medium">{engagement.commentCount}</span>}
                            </button>
                          </div>

                          {/* Stats for owner/admin */}
                          {(isBusinessOwner || isAdmin) && (
                            <button type="button" onClick={() => setPanelOpen("stats")} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span className="text-xs">{ar ? "إحصائيات" : "Stats"}</span>
                            </button>
                          )}
                        </div>

                        {/* Comment input - everyone can send */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onFocus={() => setCommentFocused(true)}
                            onBlur={() => setTimeout(() => setCommentFocused(false), 150)}
                            onKeyDown={(e) => { if (e.key === "Enter" && newComment.trim()) handleSubmitComment(); }}
                            placeholder={ar ? "اكتب رسالة..." : "Send a message..."}
                            className="flex-1 bg-white/10 backdrop-blur-md text-white placeholder-white/40 rounded-full px-4 py-2.5 text-sm outline-none border border-white/20 focus:border-white/40 transition-all"
                            dir={ar ? "rtl" : "ltr"}
                          />
                          {newComment.trim() && (
                            <button
                              type="button"
                              onClick={handleSubmitComment}
                              disabled={isSubmitting}
                              className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 hover:bg-white/90 active:scale-90 disabled:opacity-50 transition-all"
                            >
                              {isSubmitting ? (
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                              ) : (
                                <svg className={`w-5 h-5 ${ar ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : panelOpen === "comments" && canViewComments ? (
                      /* Comments panel - only for owner/admin */
                      <div className="bg-black/95 backdrop-blur-xl rounded-t-3xl max-h-[65vh] flex flex-col animate-[slideUp_0.25s_ease-out]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                          <h3 className="text-white font-semibold">{ar ? "التعليقات" : "Comments"} <span className="text-white/40 font-normal">({comments.length})</span></h3>
                          <button type="button" onClick={() => setPanelOpen(null)} className="text-white/50 hover:text-white p-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 max-h-[45vh]">
                          {comments.length === 0 ? (
                            <div className="text-center py-8">
                              <svg className="w-12 h-12 mx-auto text-white/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <p className="text-white/30 text-sm">{ar ? "لا توجد تعليقات بعد" : "No comments yet"}</p>
                            </div>
                          ) : (
                            comments.map((c) => (
                              <div key={c.id} className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                                  {c.userAvatar ? (
                                    <img src={c.userAvatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                      {c.userFullName?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-white font-semibold text-sm">{c.userFullName || (ar ? "مستخدم" : "User")}</span>
                                    <span className="text-white/30 text-[10px]">{getTimeAgo(c.createdAt, ar)}</span>
                                  </div>
                                  <p className="text-white/90 text-sm mt-0.5">{c.text}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : panelOpen === "stats" && storyStats ? (
                      /* Stats panel */
                      <div className="bg-black/95 backdrop-blur-xl rounded-t-3xl max-h-[65vh] flex flex-col animate-[slideUp_0.25s_ease-out]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                          <h3 className="text-white font-semibold">{ar ? "إحصائيات" : "Insights"}</h3>
                          <button type="button" onClick={() => setPanelOpen(null)} className="text-white/50 hover:text-white p-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="px-4 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white/5 rounded-2xl p-4 text-center">
                              <div className="text-white text-2xl font-bold">{storyStats.viewCount}</div>
                              <div className="text-white/50 text-xs mt-1">{ar ? "مشاهدات" : "Views"}</div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 text-center">
                              <div className="text-white text-2xl font-bold">{storyStats.likeCount}</div>
                              <div className="text-white/50 text-xs mt-1">{ar ? "إعجابات" : "Likes"}</div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 text-center">
                              <div className="text-white text-2xl font-bold">{storyStats.commentCount}</div>
                              <div className="text-white/50 text-xs mt-1">{ar ? "تعليقات" : "Comments"}</div>
                            </div>
                          </div>

                          {/* Likers */}
                          {storyStats.likers?.length > 0 && (
                            <div>
                              <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                {ar ? "الإعجابات" : "Likes"}
                              </h4>
                              <div className="space-y-2">
                                {storyStats.likers.slice(0, 15).map((l: any) => (
                                  <div key={l.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-red-500 overflow-hidden">
                                      {l.userAvatar ? <img src={l.userAvatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{l.userFullName?.charAt(0) || "?"}</div>}
                                    </div>
                                    <span className="text-white text-sm">{l.userFullName || "User"}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Viewers */}
                          {storyStats.viewers?.length > 0 && (
                            <div>
                              <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {ar ? "المشاهدون" : "Viewers"}
                              </h4>
                              <div className="space-y-2">
                                {storyStats.viewers.slice(0, 15).map((v: any) => (
                                  <div key={v.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 overflow-hidden">
                                      {v.userAvatar ? <img src={v.userAvatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{v.userFullName?.charAt(0) || "?"}</div>}
                                    </div>
                                    <span className="text-white text-sm">{v.userFullName || "User"}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : panelOpen === "stats" ? (
                      <div className="bg-black/95 rounded-t-3xl p-8 flex justify-center animate-[slideUp_0.25s_ease-out]">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes heartBurst {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes slideUp {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
