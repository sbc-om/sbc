"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type MessageInputProps = {
  onSendMessage: (text: string) => Promise<void>;
  locale: string;
};

export function MessageInput({ onSendMessage, locale }: MessageInputProps) {
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

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

  return (
    <form onSubmit={handleSubmit} className="border-t border-(--surface-border) p-4 bg-(--surface/0.5)">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={locale === "ar" ? "اكتب رسالة..." : "Type a message..."}
          disabled={isPending}
          className="flex-1"
          maxLength={2000}
        />
        <Button type="submit" disabled={!text.trim() || isPending}>
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
          ) : locale === "ar" ? (
            "إرسال"
          ) : (
            "Send"
          )}
        </Button>
      </div>
      <div className="mt-1 text-xs text-(--muted-foreground) text-end px-1">
        {text.length}/2000
      </div>
    </form>
  );
}
