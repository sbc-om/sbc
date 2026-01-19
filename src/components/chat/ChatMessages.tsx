"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

type Message = {
  id: string;
  conversationId: string;
  sender: "user";
  text: string;
  createdAt: string;
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

export function ChatMessages({ messages, business, locale }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const name = locale === "ar" ? business.name.ar : business.name.en;
  const logo = business.media?.logo || business.media?.cover;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      {messages.map((msg) => (
        <div key={msg.id} className="flex items-start gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-(--chip-bg) flex items-center justify-center">
            {logo ? (
              <Image src={logo} alt={name} fill sizes="32px" className="object-cover" />
            ) : (
              <div className="text-xs font-bold text-(--muted-foreground)">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="inline-block rounded-2xl px-4 py-2.5 text-sm max-w-[85%]"
              style={{
                background: "rgba(var(--surface-rgb, 255,255,255), 0.6)",
                border: "1px solid",
                borderColor: "var(--surface-border)",
              }}
            >
              <div className="whitespace-pre-wrap wrap-break-word">{msg.text}</div>
            </div>
            <div className="mt-1 text-[11px] text-(--muted-foreground) px-1">
              {new Date(msg.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
                hour: "numeric",
                minute: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
