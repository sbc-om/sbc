"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Message = {
  id: string;
  conversationId: string;
  sender: "user" | "business";
  text: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  messageType?: "text" | "image" | "file" | "voice" | "location";
  mediaUrl?: string;
  mediaType?: string;
  locationLat?: number;
  locationLng?: number;
};

type Business = {
  name: { ar: string; en: string };
  media?: {
    logo?: string;
    cover?: string;
    banner?: string;
  };
};

type ChatMessagesProps = {
  messages: Message[];
  business: Business;
  locale: string;
};

// Read receipt ticks component
function MessageTicks({ status, isUser }: { status?: string; isUser: boolean }) {
  if (!isUser) return null;
  
  const isRead = status === "read";
  const isSent = status === "sent" || status === "delivered" || status === "read";
  
  return (
    <span className={`inline-flex items-center ms-1 ${isRead ? "text-blue-500" : "text-(--muted-foreground)"}`}>
      {isSent && (
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="inline">
          <path
            d="M4 5.5L6.5 8L12 2.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {isRead && (
            <path
              d="M8 5.5L10.5 8L16 2.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform="translate(-4, 0)"
            />
          )}
        </svg>
      )}
    </span>
  );
}

// Image message component
function ImageMessage({
  url,
  locale,
  onPreview,
}: {
  url: string;
  locale: string;
  onPreview: (url: string) => void;
}) {
  return (
    <div className="max-w-[240px] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onPreview(url)}
        className="block cursor-zoom-in"
        aria-label={locale === "ar" ? "عرض الصورة بحجم أكبر" : "View image larger"}
      >
        <Image
          src={url}
          alt={locale === "ar" ? "صورة" : "Image"}
          width={240}
          height={180}
          className="object-cover"
        />
      </button>
    </div>
  );
}

// Voice message component
function VoiceMessage({ url, locale }: { url: string; locale: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </div>
      <audio controls className="h-8 flex-1" style={{ maxWidth: "180px" }}>
        <source src={url} />
        {locale === "ar" ? "المتصفح لا يدعم الصوت" : "Browser doesn't support audio"}
      </audio>
    </div>
  );
}

// File message component
function FileMessage({ url, locale }: { url: string; locale: string }) {
  const fileName = url.split("/").pop() || (locale === "ar" ? "ملف" : "File");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-(--chip-bg) hover:bg-(--surface-border) transition-colors"
    >
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <div className="text-sm truncate max-w-[150px]">{fileName}</div>
    </a>
  );
}

// Location message component - compact version that links to full map page
function LocationMessage({ lat, lng, locale }: { lat: number; lng: number; locale: string }) {
  const mapPageUrl = `/${locale}/map?lat=${lat}&lng=${lng}`;
  
  return (
    <a 
      href={mapPageUrl}
      className="flex items-center gap-3 px-3 py-2.5 bg-(--chip-bg) hover:bg-(--surface-border) rounded-xl transition-colors max-w-[200px] group"
    >
      {/* Map preview icon */}
      <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/40 dark:to-green-900/40 flex items-center justify-center shrink-0 overflow-hidden">
        <svg className="w-6 h-6 drop-shadow" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
          <circle cx="12" cy="9" r="2" fill="white"/>
        </svg>
      </div>
      
      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {locale === "ar" ? "موقع مشترك" : "Shared location"}
        </p>
        <p className="text-xs text-(--muted-foreground) truncate">
          {locale === "ar" ? "انقر للعرض" : "Tap to view"}
        </p>
      </div>
      
      {/* Arrow indicator */}
      <svg 
        className="w-4 h-4 text-(--muted-foreground) group-hover:text-foreground transition-colors shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === "ar" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
      </svg>
    </a>
  );
}

export function ChatMessages({ messages, business, locale }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const name = locale === "ar" ? business.name.ar : business.name.en;
  const logo = business.media?.logo || business.media?.cover;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!previewImageUrl) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImageUrl(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [previewImageUrl]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="relative mx-auto h-20 w-20 mb-4 overflow-hidden rounded-full bg-(--chip-bg) flex items-center justify-center">
            {logo ? (
              <Image src={logo} alt={name} fill sizes="80px" className="object-cover" />
            ) : (
              <div className="text-3xl font-bold text-(--muted-foreground)">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? "اكتب أول رسالة لبدء المحادثة"
              : "Write your first message to start the conversation"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => {
        const isUser = msg.sender === "user";
        const messageType = msg.messageType || "text";
        
        return (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar - only show for business */}
            {!isUser && (
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-(--chip-bg) flex items-center justify-center">
                {logo ? (
                  <Image src={logo} alt={name} fill sizes="32px" className="object-cover" />
                ) : (
                  <div className="text-xs font-bold text-(--muted-foreground)">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
            )}
            
            {/* Message bubble */}
            <div className={`flex-1 min-w-0 ${isUser ? "flex flex-col items-end" : ""}`}>
              <div
                className={`inline-block rounded-2xl text-sm max-w-[85%] ${
                  messageType === "image" || messageType === "location"
                    ? "p-1"
                    : "px-4 py-2.5"
                }`}
                style={{
                  background: isUser
                    ? "var(--primary)"
                    : "rgba(var(--surface-rgb, 255,255,255), 0.6)",
                  color: isUser ? "white" : "inherit",
                  border: isUser ? "none" : "1px solid var(--surface-border)",
                }}
              >
                {/* Render based on message type */}
                {messageType === "image" && msg.mediaUrl ? (
                  <ImageMessage
                    url={msg.mediaUrl}
                    locale={locale}
                    onPreview={setPreviewImageUrl}
                  />
                ) : messageType === "voice" && msg.mediaUrl ? (
                  <VoiceMessage url={msg.mediaUrl} locale={locale} />
                ) : messageType === "file" && msg.mediaUrl ? (
                  <FileMessage url={msg.mediaUrl} locale={locale} />
                ) : messageType === "location" && msg.locationLat && msg.locationLng ? (
                  <LocationMessage lat={msg.locationLat} lng={msg.locationLng} locale={locale} />
                ) : (
                  <div className="whitespace-pre-wrap wrap-break-word">{msg.text}</div>
                )}
              </div>
              
              {/* Time and read status */}
              <div className={`mt-1 text-[11px] text-(--muted-foreground) px-1 flex items-center gap-1 ${isUser ? "flex-row-reverse" : ""}`}>
                <span>
                  {new Date(msg.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
                    hour: "numeric",
                    minute: "numeric",
                  })}
                </span>
                <MessageTicks status={msg.status} isUser={isUser} />
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "ar" ? "معاينة الصورة" : "Image preview"}
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div
            className="relative z-10 max-h-[90vh] max-w-[95vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-3 -right-3 z-20 h-9 w-9 rounded-full bg-(--surface) border border-(--surface-border) shadow-lg flex items-center justify-center"
              aria-label={locale === "ar" ? "إغلاق" : "Close"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <Image
              src={previewImageUrl}
              alt={locale === "ar" ? "معاينة الصورة" : "Image preview"}
              width={1400}
              height={1050}
              className="max-h-[85vh] w-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
