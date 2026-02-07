"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { Story } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { StoryEditor } from "./StoryEditor";

interface StoryUploadProps {
  businessId: string;
  locale: Locale;
  existingStories: Story[];
  onStoryAdded?: () => void;
}

export function StoryUpload({ businessId, locale, existingStories, onStoryAdded }: StoryUploadProps) {
  const ar = locale === "ar";
  const router = useRouter();
  
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteStory = async (storyId: string) => {
    if (!confirm(ar ? "هل تريد حذف هذا الستوري؟" : "Delete this story?")) return;

    try {
      const res = await fetch(`/api/businesses/${businessId}/stories`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStoryCreated = () => {
    setShowEditor(false);
    router.refresh();
    onStoryAdded?.();
  };

  return (
    <>
      <div className="sbc-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {ar ? "الستوري" : "Stories"}
            </h3>
            <p className="text-sm text-(--muted-foreground) mt-0.5">
              {ar ? "انشر ستوري يظهر لمدة 24 ساعة" : "Post stories visible for 24 hours"}
            </p>
          </div>
          <span className="text-sm text-(--muted-foreground)">
            {existingStories.length} {ar ? "ستوري نشط" : "active"}
          </span>
        </div>

        {/* Existing Stories */}
        {existingStories.length > 0 && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {existingStories.map((story) => (
              <div key={story.id} className="relative flex-shrink-0 group">
                <div className="w-20 h-36 rounded-xl overflow-hidden bg-(--surface) border border-(--surface-border)">
                  {story.mediaType === "video" ? (
                    <video
                      src={story.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <Image
                      src={story.mediaUrl}
                      alt="Story"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeleteStory(story.id)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Time remaining */}
                <div className="absolute bottom-1 left-1 right-1 text-[10px] text-white bg-black/50 rounded px-1 py-0.5 text-center">
                  {getTimeRemaining(story.expiresAt, ar)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Story Button */}
        <Button
          onClick={() => setShowEditor(true)}
          className="w-full"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {ar ? "إنشاء ستوري جديد" : "Create New Story"}
        </Button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Story Editor Modal */}
      {showEditor && (
        <StoryEditor
          businessId={businessId}
          locale={locale}
          onClose={() => setShowEditor(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </>
  );
}

function getTimeRemaining(expiresAt: string, ar: boolean): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  
  if (diffMs <= 0) return ar ? "منتهي" : "Expired";
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return ar ? `${diffHours}س متبقية` : `${diffHours}h left`;
  }
  return ar ? `${diffMins}د متبقية` : `${diffMins}m left`;
}
