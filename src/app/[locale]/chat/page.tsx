import { notFound, redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { requireUser } from "@/lib/auth/requireUser";
import { getUserConversations } from "@/lib/db/chats";
import { getBusinessById } from "@/lib/db/businesses";

export default async function ChatIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const conversations = await getUserConversations(user.id);

  // If user has conversations, redirect to the most recent one
  if (conversations.length > 0) {
    // Find the other participant (the business) in the conversation
    const otherParticipantId = conversations[0].participantIds.find(id => id !== user.id);
    if (otherParticipantId) {
      const business = await getBusinessById(otherParticipantId);
      if (business) {
        redirect(`/${locale}/chat/${business.slug}`);
      }
    }
  }

  // Otherwise, show empty state
  const dict = await getDictionary(locale as Locale);

  return (
    <div className="h-screen flex items-center justify-center bg-background">
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
          {locale === "ar" ? "لا توجد محادثات بعد" : "No conversations yet"}
        </h1>
        <p className="mt-2 text-sm text-(--muted-foreground)">
          {locale === "ar"
            ? "ابدأ محادثة مع أي بيزنس من خلال زيارة صفحة البيزنس والضغط على زر الدردشة"
            : "Start a conversation with any business by visiting their page and clicking the chat button"}
        </p>
      </div>
    </div>
  );
}
