"use client";

import { useRouter } from "next/navigation";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { MessageInput } from "@/components/chat/MessageInput";
import { ChatHeader } from "@/components/chat/ChatHeader";

type ClientChatPageProps = {
  locale: string;
  businessSlug: string;
  userId: string;
  business: {
    id: string;
    slug: string;
    name: { ar: string; en: string };
    category?: string;
    media?: {
      logo?: string;
      cover?: string;
      banner?: string;
    };
  };
  initialMessages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: string;
  }>;
};

export function ClientChatPage({
  locale,
  businessSlug,
  userId,
  business,
  initialMessages,
}: ClientChatPageProps) {
  const router = useRouter();

  const handleSendMessage = async (text: string) => {
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessSlug, text }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const messages = initialMessages.map((msg) => ({
    id: msg.id,
    conversationId: msg.conversationId,
    sender: (msg.senderId === userId ? "user" : "business") as "user" | "business",
    text: msg.text,
    createdAt: msg.createdAt,
  }));

  return (
    <div className="h-full flex flex-col">
      <ChatHeader business={business} locale={locale} />
      <div className="flex-1 min-h-0">
        <ChatMessages messages={messages} business={business} locale={locale} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} locale={locale} />
    </div>
  );
}
