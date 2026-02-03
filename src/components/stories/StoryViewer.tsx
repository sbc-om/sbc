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
  currentUserId?: string;
  isBusinessOwner?: boolean;
}

interface StoryEngagement {
  liked: boolean;
  likeCount: number;
  commentCount: number;
  viewCount?: number;
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

export function StoryViewer({ 
  businesses, 
  initialBusinessId, 
  locale, 
  onClose,
  currentUserId,
  isBusinessOwner = false,
}: StoryViewerProps) {
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

  // Engagement state
  const [engagement, setEngagement] = useState<StoryEngagement>({ liked: false, likeCount: 0, commentCount: 0 });
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [storyStats, setStoryStats] = useState<any>(null);

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
      fetch(`/api/stories/${currentStory.id}/view`, { method: "POST" }).catch(() => {});
      
      // Load engagement data
      fetch(`/api/stories/${currentStory.id}/like`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setEngagement(prev => ({
              ...prev,
              liked: data.data.userLiked,
              likeCount: data.data.likeCount,
            }));
          }
        })
        .catch(() => {});

      // Load comments count
      fetch(`/api/stories/${currentStory.id}/comments`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setComments(data.data);
            setEngagement(prev => ({ ...prev, commentCount: data.data.length }));
          }
        })
        .catch(() => {});
    }
  }, [currentStory?.id]);

  // Load stats for business owner
  useEffect(() => {
    if (currentStory && isBusinessOwner && showStats) {
      fetch(`/api/stories/${currentStory.id}/stats`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setStoryStats(data.data.stats);
          }
        })
        .catch(() => {});
    }
  }, [currentStory?.id, isBusinessOwner, showStats]);

  // Handle like
  const handleLike = async () => {
    if (!currentStory) return;
    
    try {
      if (engagement.liked) {
        const res = await fetch(`/api/stories/${currentStory.id}/like`, { 
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json();
        console.log("Unlike response:", data);
        if (data.ok) {
          setEngagement(prev => ({ ...prev, liked: false, likeCount: data.data.likeCount }));
        }
      } else {
        const res = await fetch(`/api/stories/${currentStory.id}/like`, { 
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        console.log("Like response:", data);
        if (data.ok) {
          setEngagement(prev => ({ ...prev, liked: true, likeCount: data.data.likeCount }));
        }
      }
    } catch (e) {
      console.error("Like error:", e);
    }
  };

  // Handle comment submit
  const handleSubmitComment = async () => {
    if (!currentStory || !newComment.trim()) return;
    setIsSubmittingComment(true);
    
    try {
      const res = await fetch(`/api/stories/${currentStory.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      console.log("Comment response:", data);
      if (data.ok) {
        setComments(prev => [...prev, data.data]);
        setEngagement(prev => ({ ...prev, commentCount: prev.commentCount + 1 }));
        setNewComment("");
      }
    } catch (e) {
      console.error("Comment error:", e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

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
      // Don't handle keyboard events when typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }
      
      // Don't handle navigation when comments or stats panel is open
      if (showComments || showStats) {
        if (e.key === "Escape") {
          setShowComments(false);
          setShowStats(false);
          setIsPaused(false);
        }
        return;
      }
      
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
  }, [ar, goNext, goPrev, onClose, showComments, showStats]);

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
        {currentStory.caption && !showComments && !showStats && (
          <div 
            className="absolute bottom-20 left-4 right-4 z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3">
              <p className="text-white text-sm">{currentStory.caption}</p>
            </div>
          </div>
        )}

        {/* Engagement bar - Like, Comment, Stats */}
        <div 
          className="absolute bottom-4 left-4 right-4 z-40"
          onClick={(e) => e.stopPropagation()}
        >
          {!showComments && !showStats ? (
            <div className="flex items-center justify-between bg-black/50 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="flex items-center gap-4">
                {/* Like button */}
                <button
                  type="button"
                  onClick={handleLike}
                  className="flex items-center gap-1.5 text-white hover:scale-110 transition-transform"
                >
                  <svg 
                    className={`w-6 h-6 ${engagement.liked ? "fill-red-500 text-red-500" : "fill-none"}`} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {engagement.likeCount > 0 && (
                    <span className="text-sm">{engagement.likeCount}</span>
                  )}
                </button>

                {/* Comment button */}
                <button
                  type="button"
                  onClick={() => { setShowComments(true); setIsPaused(true); }}
                  className="flex items-center gap-1.5 text-white hover:scale-110 transition-transform"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {engagement.commentCount > 0 && (
                    <span className="text-sm">{engagement.commentCount}</span>
                  )}
                </button>
              </div>

              {/* Stats button (only for business owner) */}
              {isBusinessOwner && (
                <button
                  type="button"
                  onClick={() => { setShowStats(true); setIsPaused(true); }}
                  className="flex items-center gap-1.5 text-white/70 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm">{ar ? "إحصائيات" : "Stats"}</span>
                </button>
              )}
            </div>
          ) : showComments ? (
            /* Comments panel */
            <div className="bg-black/80 backdrop-blur-sm rounded-xl max-h-[60vh] flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <h3 className="text-white font-medium">{ar ? "التعليقات" : "Comments"} ({comments.length})</h3>
                <button
                  type="button"
                  onClick={() => { setShowComments(false); setIsPaused(false); }}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[40vh]">
                {comments.length === 0 ? (
                  <p className="text-white/50 text-center text-sm py-4">
                    {ar ? "لا توجد تعليقات بعد" : "No comments yet"}
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5 items-start">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden ring-1 ring-white/20">
                        {comment.userAvatar ? (
                          <img 
                            src={comment.userAvatar} 
                            alt={comment.userFullName || ""} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                            {comment.userFullName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white/90 text-xs font-semibold">{comment.userFullName || (ar ? "مستخدم" : "User")}</span>
                          {comment.userUsername && (
                            <span className="text-white/40 text-[10px]">@{comment.userUsername}</span>
                          )}
                        </div>
                        <p className="text-white text-sm mt-0.5 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                    placeholder={ar ? "اكتب تعليقاً..." : "Write a comment..."}
                    className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/30"
                    dir={ar ? "rtl" : "ltr"}
                  />
                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {isSubmittingComment ? "..." : ar ? "إرسال" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          ) : showStats && storyStats ? (
            /* Stats panel (for business owner) */
            <div className="bg-black/80 backdrop-blur-sm rounded-xl max-h-[60vh] flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <h3 className="text-white font-medium">{ar ? "إحصائيات القصة" : "Story Stats"}</h3>
                <button
                  type="button"
                  onClick={() => { setShowStats(false); setIsPaused(false); }}
                  className="text-white/60 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[50vh]">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-white text-lg font-bold">{storyStats.viewCount}</div>
                    <div className="text-white/60 text-xs">{ar ? "مشاهدات" : "Views"}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-white text-lg font-bold">{storyStats.likeCount}</div>
                    <div className="text-white/60 text-xs">{ar ? "إعجابات" : "Likes"}</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-white text-lg font-bold">{storyStats.commentCount}</div>
                    <div className="text-white/60 text-xs">{ar ? "تعليقات" : "Comments"}</div>
                  </div>
                </div>

                {/* Viewers */}
                {storyStats.viewers?.length > 0 && (
                  <div>
                    <h4 className="text-white/70 text-sm mb-2">{ar ? "المشاهدون" : "Viewers"}</h4>
                    <div className="space-y-2">
                      {storyStats.viewers.slice(0, 10).map((viewer: any) => (
                        <div key={viewer.id} className="flex items-center gap-2.5 text-white text-sm">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0 overflow-hidden ring-1 ring-white/20">
                            {viewer.userAvatar ? (
                              <img 
                                src={viewer.userAvatar} 
                                alt={viewer.userFullName || ""} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                                {viewer.userFullName?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-white/90 font-medium">{viewer.userFullName || (ar ? "مستخدم" : "User")}</span>
                            {viewer.userUsername && (
                              <span className="text-white/40 text-xs ml-1.5">@{viewer.userUsername}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {storyStats.viewers.length > 10 && (
                        <div className="text-white/50 text-xs">
                          +{storyStats.viewers.length - 10} {ar ? "آخرين" : "more"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Likers */}
                {storyStats.likers?.length > 0 && (
                  <div>
                    <h4 className="text-white/70 text-sm mb-2">{ar ? "المعجبون" : "Likers"}</h4>
                    <div className="space-y-2">
                      {storyStats.likers.slice(0, 10).map((liker: any) => (
                        <div key={liker.id} className="flex items-center gap-2.5 text-white text-sm">
                          <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex-shrink-0 overflow-hidden ring-1 ring-white/20">
                            {liker.userAvatar ? (
                              <img 
                                src={liker.userAvatar} 
                                alt={liker.userFullName || ""} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                                {liker.userFullName?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                            {/* Heart badge */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center ring-1 ring-black">
                              <svg className="w-2 h-2 fill-white" viewBox="0 0 24 24">
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-white/90 font-medium">{liker.userFullName || (ar ? "مستخدم" : "User")}</span>
                            {liker.userUsername && (
                              <span className="text-white/40 text-xs ml-1.5">@{liker.userUsername}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

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
