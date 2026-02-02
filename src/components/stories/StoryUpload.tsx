"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { Story } from "@/lib/db/stories";
import type { Locale } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";

interface StoryUploadProps {
  businessId: string;
  locale: Locale;
  existingStories: Story[];
  onStoryAdded?: () => void;
}

export function StoryUpload({ businessId, locale, existingStories, onStoryAdded }: StoryUploadProps) {
  const ar = locale === "ar";
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      setError(ar ? "نوع الملف غير مدعوم" : "Unsupported file type");
      return;
    }

    // Validate file size
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(ar 
        ? `حجم الملف كبير جداً. الحد الأقصى ${isVideo ? "50" : "10"} ميجابايت`
        : `File too large. Max ${isVideo ? "50MB" : "10MB"}`
      );
      return;
    }

    setSelectedFile(file);
    setPreview({
      url: URL.createObjectURL(file),
      type: isVideo ? "video" : "image"
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mediaType", preview?.type || "image");
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      const res = await fetch(`/api/businesses/${businessId}/stories`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setCaption("");
      
      // Refresh
      router.refresh();
      onStoryAdded?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

  return (
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

      {/* Upload Area */}
      {!preview ? (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="border-2 border-dashed border-(--surface-border) rounded-xl p-8 text-center hover:border-accent transition-colors">
            <div className="w-12 h-12 rounded-full bg-(--chip-bg) flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-(--muted-foreground)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-sm font-medium">
              {ar ? "اضغط لإضافة ستوري" : "Click to add a story"}
            </p>
            <p className="text-xs text-(--muted-foreground) mt-1">
              {ar ? "صورة أو فيديو (1080×1920)" : "Image or video (1080×1920)"}
            </p>
            <p className="text-xs text-(--muted-foreground) mt-0.5">
              {ar ? "صور حتى 10MB، فيديو حتى 50MB" : "Images up to 10MB, videos up to 50MB"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative aspect-[9/16] max-w-[280px] mx-auto rounded-xl overflow-hidden bg-black">
            {preview.type === "video" ? (
              <video
                src={preview.url}
                className="w-full h-full object-contain"
                controls
                muted
              />
            ) : (
              <Image
                src={preview.url}
                alt="Preview"
                fill
                className="object-contain"
              />
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {ar ? "التعليق (اختياري)" : "Caption (optional)"}
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={ar ? "أضف تعليقاً..." : "Add a caption..."}
              maxLength={500}
              rows={2}
              className="w-full rounded-xl border border-(--surface-border) bg-(--surface) px-4 py-3 text-sm resize-none focus:border-accent outline-none"
            />
            <div className="text-xs text-(--muted-foreground) text-end mt-1">
              {caption.length}/500
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="flex-1"
              disabled={isUploading}
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleUpload}
              className="flex-1"
              disabled={isUploading}
            >
              {isUploading 
                ? (ar ? "جارٍ النشر..." : "Posting...") 
                : (ar ? "نشر الستوري" : "Post Story")
              }
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
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
