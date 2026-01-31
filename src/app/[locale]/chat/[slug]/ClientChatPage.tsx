"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { MessageInput } from "@/components/chat/MessageInput";
import { ChatHeader } from "@/components/chat/ChatHeader";

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

type BusinessInfo = {
  id: string;
  slug: string;
  name: { ar: string; en: string };
  categoryId?: string;
  media?: {
    logo?: string;
    cover?: string;
    banner?: string;
  };
};

type TargetUserInfo = {
  id: string;
  username?: string;
  displayName: string;
  avatarUrl?: string;
};

type ClientChatPageProps = {
  locale: string;
  businessSlug: string;
  userId: string;
  participantType?: "business" | "user";
  business?: BusinessInfo;
  targetUser?: TargetUserInfo;
  initialMessages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: string;
    status?: "sent" | "delivered" | "read";
    messageType?: "text" | "image" | "file" | "voice" | "location";
    mediaUrl?: string;
    mediaType?: string;
    locationLat?: number;
    locationLng?: number;
  }>;
};

export function ClientChatPage({
  locale,
  businessSlug,
  userId,
  participantType = "business",
  business,
  targetUser,
  initialMessages,
}: ClientChatPageProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      sender: (msg.senderId === userId ? "user" : "business") as "user" | "business",
      text: msg.text,
      createdAt: msg.createdAt,
      status: msg.status || "sent",
      messageType: msg.messageType || "text",
      mediaUrl: msg.mediaUrl,
      mediaType: msg.mediaType,
      locationLat: msg.locationLat,
      locationLng: msg.locationLng,
    }))
  );
  
  const [conversationId, setConversationId] = useState<string | null>(
    initialMessages[0]?.conversationId || null
  );
  const eventSourceRef = useRef<EventSource | null>(null);

  // Create a unified participant info object for rendering
  const participantInfo: BusinessInfo = business || {
    id: targetUser?.id || "",
    slug: targetUser?.username || targetUser?.id || "",
    name: { 
      ar: targetUser?.displayName || "", 
      en: targetUser?.displayName || "" 
    },
    media: targetUser?.avatarUrl ? { logo: targetUser.avatarUrl } : undefined,
  };

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (!conversationId) return;
    
    const markAsRead = async () => {
      try {
        await fetch("/api/chat/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });
      } catch (e) {
        console.error("Failed to mark messages as read:", e);
      }
    };
    
    markAsRead();
  }, [conversationId]);

  // Connect to SSE stream
  useEffect(() => {
    if (!conversationId) return;

    const eventSource = new EventSource(`/api/chat/stream?conversationId=${conversationId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "message") {
          const newMsg = data.message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id,
                conversationId: newMsg.conversationId,
                sender: (newMsg.senderId === userId ? "user" : "business") as "user" | "business",
                text: newMsg.text,
                createdAt: newMsg.createdAt,
                status: newMsg.status || "sent",
                messageType: newMsg.messageType || "text",
                mediaUrl: newMsg.mediaUrl,
                mediaType: newMsg.mediaType,
                locationLat: newMsg.locationLat,
                locationLng: newMsg.locationLng,
              },
            ];
          });
          
          // Mark incoming messages as read immediately
          if (newMsg.senderId !== userId) {
            fetch("/api/chat/read", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId }),
            }).catch(console.error);
          }
        } else if (data.type === "messages_read") {
          // Update read status for messages we sent
          setMessages((prev) =>
            prev.map((m) =>
              m.sender === "user" && m.status !== "read"
                ? { ...m, status: "read" as const }
                : m
            )
          );
        }
      } catch (e) {
        console.error("Error parsing SSE message:", e);
      }
    };

    eventSource.onerror = () => {
      console.log("SSE connection error, will reconnect...");
    };

    return () => {
      eventSource.close();
    };
  }, [conversationId, userId]);

  const handleSendMessage = useCallback(async (
    text: string,
    options?: {
      messageType?: "text" | "image" | "file" | "voice" | "location";
      mediaUrl?: string;
      mediaType?: string;
      locationLat?: number;
      locationLng?: number;
    }
  ) => {
    try {
      // Build request body based on participant type
      const requestBody: Record<string, unknown> = {
        text,
        messageType: options?.messageType || "text",
        mediaUrl: options?.mediaUrl,
        mediaType: options?.mediaType,
        locationLat: options?.locationLat,
        locationLng: options?.locationLng,
      };

      // For user-to-user chat, use participantId
      if (participantType === "user" && targetUser) {
        requestBody.participantId = targetUser.id;
        requestBody.participantType = "user";
      } else {
        // For business chat, use businessSlug
        requestBody.businessSlug = businessSlug;
      }

      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const json = await res.json();
      
      if (res.ok && json.ok) {
        // Update conversation ID if this was first message
        if (!conversationId && json.conversation) {
          setConversationId(json.conversation.id);
        }
        
        // Add message locally (SSE will also add it, but we check for duplicates)
        if (json.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === json.message.id)) return prev;
            return [
              ...prev,
              {
                id: json.message.id,
                conversationId: json.message.conversationId,
                sender: "user" as const,
                text: json.message.text,
                createdAt: json.message.createdAt,
                status: json.message.status || "sent",
                messageType: json.message.messageType || "text",
                mediaUrl: json.message.mediaUrl,
                mediaType: json.message.mediaType,
                locationLat: json.message.locationLat,
                locationLng: json.message.locationLng,
              },
            ];
          });
        }
      } else {
        throw new Error(json.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }, [businessSlug, conversationId, participantType, targetUser]);

  return (
    <div className="h-full flex flex-col">
      <ChatHeader 
        business={participantInfo} 
        locale={locale} 
        participantType={participantType}
      />
      <div className="flex-1 min-h-0">
        <ChatMessages messages={messages} business={participantInfo} locale={locale} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} locale={locale} />
    </div>
  );
}
