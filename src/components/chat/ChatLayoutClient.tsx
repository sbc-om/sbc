"use client";

import { createContext, useRef, useContext } from "react";
import { MobileChatSidebar, type MobileChatSidebarRef } from "./MobileChatSidebar";
import { ChatSidebar } from "./ChatSidebar";

const ChatSidebarContext = createContext<React.RefObject<MobileChatSidebarRef | null> | null>(null);

export function useChatSidebar() {
  return useContext(ChatSidebarContext);
}

type ChatLayoutClientProps = {
  locale: string;
  children: React.ReactNode;
};

export function ChatLayoutClient({ locale, children }: ChatLayoutClientProps) {
  const sidebarRef = useRef<MobileChatSidebarRef | null>(null);

  return (
    <ChatSidebarContext.Provider value={sidebarRef}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 shrink-0">
        <ChatSidebar locale={locale} />
      </aside>

      {/* Mobile Sidebar */}
      <MobileChatSidebar ref={sidebarRef} locale={locale} />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </ChatSidebarContext.Provider>
  );
}
