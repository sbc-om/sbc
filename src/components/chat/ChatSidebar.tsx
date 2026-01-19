"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useChatSidebar } from "./ChatLayoutClient";

type Conversation = {
  id: string;
  businessId: string;
  businessSlug: string;
  updatedAt: string;
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

export function ChatSidebar({ locale }: ChatSidebarProps) {
  const sidebarRef = useChatSidebar();
  const params = useParams();
  const activeSlug = params?.slug as string | undefined;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConversations() {
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
    }

    fetchConversations();
  }, []);

  return (
    <div className="h-full flex flex-col border-e border-(--surface-border) bg-(--surface/0.5)">
      <div className="p-4 border-b border-(--surface-border)">
        <h2 className="text-lg font-semibold tracking-tight">
          {locale === "ar" ? "الدردشات" : "Chats"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-(--muted-foreground)">
            {locale === "ar" ? "جارٍ التحميل..." : "Loading..."}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-(--muted-foreground)">
            {locale === "ar" ? "لا توجد محادثات بعد" : "No conversations yet"}
          </div>
        ) : (
          <div className="grid">
            {conversations.map((conv) => {
              const business = conv.business;
              if (!business) return null;

              const name = locale === "ar" ? business.name.ar : business.name.en;
              const logo = business.media?.logo || business.media?.cover;
              const isActive = activeSlug === business.slug;

              return (
                <Link
                  key={conv.id}
                  href={`/${locale}/chat/${business.slug}`}
                  onClick={() => sidebarRef?.current?.close()}
                  className={`
                    flex items-center gap-3 p-4 border-b border-(--surface-border) 
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
                    <div className="truncate font-medium text-sm">{name}</div>
                    <div className="truncate text-xs text-(--muted-foreground) mt-0.5">
                      {business.category || ""}
                    </div>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
