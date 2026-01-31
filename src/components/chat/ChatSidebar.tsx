"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useChatSidebar } from "./ChatLayoutClient";

type Conversation = {
  id: string;
  businessId: string;
  businessSlug: string;
  updatedAt: string;
  lastMessageAt?: string;
  unreadCount?: number;
  lastMessage?: {
    text: string;
    senderId: string;
    messageType?: string;
    createdAt?: string;
  } | null;
  business?: {
    id: string;
    slug: string;
    name: { ar: string; en: string };
    category?: string;
    media?: {
      logo?: string;
      cover?: string;
      banner?: string;
    };
  } | null;
};

type ChatSidebarProps = {
  locale: string;
};

function formatDate(dateStr: string | undefined, locale: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (diff < dayMs) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  } else if (diff < 7 * dayMs) {
    return date.toLocaleDateString(locale, { weekday: "short" });
  } else {
    return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
  }
}

function getMessagePreview(message: Conversation["lastMessage"], locale: string): string {
  if (!message) return locale === "ar" ? "ابدأ المحادثة" : "Start a conversation";
  
  switch (message.messageType) {
    case "image":
      return locale === "ar" ? "📷 صورة" : "📷 Photo";
    case "voice":
      return locale === "ar" ? "🎤 رسالة صوتية" : "🎤 Voice message";
    case "file":
      return locale === "ar" ? "📎 ملف" : "📎 File";
    case "location":
      return locale === "ar" ? "📍 موقع" : "📍 Location";
    default:
      return message.text || (locale === "ar" ? "ابدأ المحادثة" : "Start a conversation");
  }
}

export function ChatSidebar({ locale }: ChatSidebarProps) {
  const sidebarRef = useChatSidebar();
  const params = useParams();
  const activeSlug = params?.slug as string | undefined;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setConversations(data.conversations || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource("/api/chat/user-stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "new_message") {
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.id === data.conversationId);
            if (idx === -1) {
              // New conversation, refetch
              fetchConversations();
              return prev;
            }

            const updated = [...prev];
            const conv = { ...updated[idx] };
            
            // Update last message
            conv.lastMessage = {
              text: data.message.text,
              senderId: data.message.senderId,
              messageType: data.message.messageType,
              createdAt: data.message.createdAt,
            };
            conv.lastMessageAt = data.message.createdAt;
            
            // Increment unread if not active chat
            const isActive = activeSlug === conv.business?.slug || 
                            decodeURIComponent(activeSlug || "") === `@${conv.business?.slug}`;
            if (!isActive) {
              conv.unreadCount = (conv.unreadCount || 0) + 1;
            }

            // Remove from current position
            updated.splice(idx, 1);
            // Add to top
            updated.unshift(conv);

            return updated;
          });
        } else if (data.type === "messages_read") {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === data.conversationId
                ? { ...conv, unreadCount: 0 }
                : conv
            )
          );
        }
      } catch (e) {
        console.error("Error parsing SSE message:", e);
      }
    };

    eventSource.onerror = () => {
      console.log("User SSE connection error, will reconnect...");
    };

    return () => {
      eventSource.close();
    };
  }, [activeSlug, fetchConversations]);

  // Reset unread count when opening a chat
  useEffect(() => {
    if (activeSlug) {
      const decodedSlug = decodeURIComponent(activeSlug).replace(/^@/, "");
      setConversations((prev) =>
        prev.map((conv) =>
          conv.business?.slug === decodedSlug || conv.business?.slug === activeSlug
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    }
  }, [activeSlug]);

  return (
    <div className="h-full flex flex-col border-e border-(--surface-border) bg-(--surface/0.5)">
      <div className="p-4 border-b border-(--surface-border)">
        <h2 className="text-lg font-semibold tracking-tight">
          {locale === "ar" ? "الدردشات" : "Chats"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-(--chip-bg)" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-(--chip-bg) rounded" />
                  <div className="h-3 w-16 bg-(--chip-bg) rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-(--chip-bg) flex items-center justify-center">
              <svg
                className="h-8 w-8 text-(--muted-foreground)"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-sm text-(--muted-foreground)">
              {locale === "ar" ? "لا توجد محادثات بعد" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="grid">
            {conversations.map((conv) => {
              const business = conv.business;
              if (!business) return null;

              const name = locale === "ar" ? business.name.ar : business.name.en;
              const logo = business.media?.logo || business.media?.cover;
              const isActive = activeSlug === business.slug || 
                              decodeURIComponent(activeSlug || "") === `@${business.slug}`;
              const timeStr = formatDate(conv.lastMessage?.createdAt || conv.lastMessageAt || conv.updatedAt, locale);
              const preview = getMessagePreview(conv.lastMessage, locale);
              const unread = conv.unreadCount || 0;

              return (
                <Link
                  key={conv.id}
                  href={`/${locale}/chat/${business.slug}`}
                  onClick={() => sidebarRef?.current?.close()}
                  className={`
                    flex items-center gap-3 px-4 py-3 border-b border-(--surface-border) 
                    transition-colors hover:bg-(--surface)
                    ${isActive ? "bg-(--surface) border-s-2 border-s-blue-500" : ""}
                  `}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-(--chip-bg) flex items-center justify-center">
                    {logo ? (
                      <Image
                        src={logo}
                        alt={name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-lg font-bold text-(--muted-foreground)">
                        {name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className={`truncate text-sm ${unread > 0 ? "font-semibold" : "font-medium"}`}>
                        {name}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {timeStr && (
                          <div className={`text-xs ${unread > 0 ? "text-blue-500 font-medium" : "text-(--muted-foreground)"}`}>
                            {timeStr}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className={`truncate text-xs ${unread > 0 ? "text-foreground font-medium" : "text-(--muted-foreground)"}`}>
                        {preview}
                      </div>
                      {unread > 0 && (
                        <div className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center">
                          {unread > 99 ? "99+" : unread}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
