"use client";

import { useRouter } from "next/navigation";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { MessageInput } from "@/components/chat/MessageInput";
import { ChatHeader } from "@/components/chat/ChatHeader";

type ClientChatPageProps = {
  locale: string;
  businessSlug: string;
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
    sender: "user";
    text: string;
    createdAt: string;
  }>;
};

export function ClientChatPage({
  locale,
  businessSlug,
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

  return (
    <div className="h-full flex flex-col">
      <ChatHeader business={business} locale={locale} />
      <div className="flex-1 min-h-0">
        <ChatMessages messages={initialMessages} business={business} locale={locale} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} locale={locale} />
    </div>
  );
}
