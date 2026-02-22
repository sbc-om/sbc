"use client";

import { MessageCircle } from "lucide-react";

import { useAgentChatStore } from "@/store/agentflow/chat-store";

export function ChatTrigger({ label }: { label: string }) {
  const isOpen = useAgentChatStore((state) => state.isOpen);
  const toggleOpen = useAgentChatStore((state) => state.toggleOpen);

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={toggleOpen}
      className="fixed bottom-5 end-5 z-40 inline-flex items-center gap-2 rounded-full bg-(--accent) px-4 py-2 text-sm font-semibold text-(--accent-foreground) shadow-[var(--shadow)]"
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </button>
  );
}
