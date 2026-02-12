"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LocationPickerModal } from "@/components/chat/LocationPickerModal";
import { useToast } from "@/components/ui/Toast";

// Common emoji list for quick access
const COMMON_EMOJIS = [
  "😀", "😃", "😄", "😁", "😊", "😍", "🥰", "😘",
  "😎", "🤩", "😂", "🤣", "😅", "😇", "🙂", "🙃",
  "👍", "👎", "👏", "🙌", "🤝", "💪", "✌️", "🤞",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💕",
  "🎉", "🎊", "🔥", "⭐", "✨", "💫", "🌟", "💯",
];

type MessageInputProps = {
  onSendMessage: (
    text: string,
    options?: {
      messageType?: "text" | "image" | "file" | "voice" | "location";
      mediaUrl?: string;
      mediaType?: string;
      locationLat?: number;
      locationLng?: number;
    }
  ) => Promise<void>;
  locale: string;
};

export function MessageInput({ onSendMessage, locale }: MessageInputProps) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isPending) return;

    const message = text.trim();
    setText("");

    startTransition(async () => {
      try {
        await onSendMessage(message);
      } catch (error) {
        console.error("Failed to send message:", error);
        setText(message);
      }
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        
        // Upload the audio file
        const formData = new FormData();
        formData.append("file", audioBlob, "voice.webm");
        formData.append("type", "voice");
        
        try {
          const res = await fetch("/api/chat/upload", {
            method: "POST",
            body: formData,
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.url) {
              await onSendMessage("", {
                messageType: "voice",
                mediaUrl: data.url,
                mediaType: "audio/webm",
              });
            }
          }
        } catch (error) {
          console.error("Failed to upload voice:", error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        message: locale === "ar" ? "لا يمكن الوصول للميكروفون" : "Cannot access microphone",
        variant: "error",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // File/Image upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    try {
      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.url) {
          await onSendMessage(file.name, {
            messageType: type,
            mediaUrl: data.url,
            mediaType: file.type,
          });
        }
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
    
    // Reset input
    e.target.value = "";
    setShowAttachMenu(false);
  };

  // Location sharing - open the picker modal
  const handleShareLocation = () => {
    setShowAttachMenu(false);
    setShowLocationPicker(true);
  };

  // Handle location selection from the modal
  const handleLocationSelect = async (lat: number, lng: number) => {
    await onSendMessage("", {
      messageType: "location",
      locationLat: lat,
      locationLng: lng,
    });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Recording UI
  if (isRecording) {
    return (
      <div className="border-t border-(--surface-border) p-4 bg-(--surface/0.5)">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={cancelRecording}
            className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex-1 flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">{formatRecordingTime(recordingTime)}</span>
            <div className="flex-1 h-1 bg-(--chip-bg) rounded-full overflow-hidden">
              <div className="h-full bg-red-500 animate-pulse" style={{ width: "100%" }} />
            </div>
          </div>
          
          <button
            type="button"
            onClick={stopRecording}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 4h3v16H5V4zm11 0h3v16h-3V4z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-(--surface-border) p-4 bg-(--surface/0.5)">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        {/* Attach button */}
        <div className="relative" ref={attachMenuRef}>
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2.5 text-(--muted-foreground) hover:text-foreground hover:bg-(--chip-bg) rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          {showAttachMenu && (
            <div className="absolute bottom-full mb-2 start-0 bg-(--surface) border border-(--surface-border) rounded-xl shadow-lg p-2 min-w-[160px]">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-(--chip-bg) rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm">{locale === "ar" ? "صورة" : "Photo"}</span>
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-(--chip-bg) rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm">{locale === "ar" ? "ملف" : "File"}</span>
              </button>
              
              <button
                type="button"
                onClick={handleShareLocation}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-(--chip-bg) rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <span className="text-sm">{locale === "ar" ? "موقع" : "Location"}</span>
              </button>
            </div>
          )}
          
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "image")}
          />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "file")}
          />
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={locale === "ar" ? "اكتب رسالة..." : "Type a message..."}
            disabled={isPending}
            className="pe-10"
            maxLength={2000}
          />
          
          {/* Emoji button */}
          <div className="absolute end-2 top-1/2 -translate-y-1/2" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-(--muted-foreground) hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 end-0 bg-(--surface) border border-(--surface-border) rounded-xl shadow-lg p-3 w-72">
                <div className="grid grid-cols-8 gap-1">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-1.5 hover:bg-(--chip-bg) rounded text-xl transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Send or Voice button */}
        {text.trim() ? (
          <Button type="submit" disabled={isPending} className="shrink-0">
            {isPending ? (
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="p-2.5 text-(--muted-foreground) hover:text-foreground hover:bg-(--chip-bg) rounded-full transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
        )}
      </form>
      
      <div className="mt-1 text-xs text-(--muted-foreground) text-end px-1">
        {text.length}/2000
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationSelect}
        locale={locale}
      />
    </div>
  );
}
