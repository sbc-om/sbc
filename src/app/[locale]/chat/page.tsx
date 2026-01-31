import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";

export default async function ChatIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireUser(locale as Locale);

  // Empty state - conversation list is in sidebar
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="mx-auto h-20 w-20 mb-6 rounded-full bg-(--chip-bg) flex items-center justify-center">
          <svg
            className="h-10 w-10 text-(--muted-foreground)"
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
        <h1 className="text-2xl font-semibold tracking-tight">
          {locale === "ar" ? "اختر محادثة" : "Select a conversation"}
        </h1>
        <p className="mt-2 text-sm text-(--muted-foreground)">
          {locale === "ar"
            ? "اختر محادثة من القائمة أو ابدأ محادثة جديدة مع أي بيزنس"
            : "Choose a conversation from the list or start a new one with any business"}
        </p>
      </div>
    </div>
  );
}
