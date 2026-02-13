"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { ChatSidebar } from "./ChatSidebar";

type MobileChatSidebarProps = {
  locale: string;
};

export type MobileChatSidebarRef = {
  open: () => void;
  close: () => void;
};

export const MobileChatSidebar = forwardRef<MobileChatSidebarRef, MobileChatSidebarProps>(
  ({ locale }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }));

    return (
      <>
        {/* Mobile Sidebar Overlay */}
        {isOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <aside className="lg:hidden fixed inset-y-0 start-0 z-50 w-80 bg-background shadow-2xl">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-(--surface-border) flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {locale === "ar" ? "الدردشات" : "Chats"}
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 rounded-lg hover:bg-(--surface) flex items-center justify-center transition-colors"
                    aria-label={locale === "ar" ? "إغلاق" : "Close"}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatSidebar locale={locale} />
                </div>
              </div>
            </aside>
          </>
        )}
      </>
    );
  }
);

MobileChatSidebar.displayName = "MobileChatSidebar";
