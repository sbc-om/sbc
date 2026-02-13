import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessBySlug, getBusinessByUsername } from "@/lib/db/businesses";
import { getUserByUsername, getUserById } from "@/lib/db/users";
import { getOrCreateConversation, getConversationMessages } from "@/lib/db/chats";
import { ClientChatPage } from "./ClientChatPage";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: rawSlug } = await params;
  if (!isLocale(locale)) notFound();

  // Decode URL-encoded characters (e.g., %40 -> @)
  const slug = decodeURIComponent(rawSlug);
  const cleanSlug = slug.startsWith("@") ? slug.slice(1) : slug;

  const user = await requireUser(locale as Locale);
  
  // First try to find as business
  const business = await getBusinessByUsername(cleanSlug) || await getBusinessBySlug(cleanSlug);
  
  if (business) {
    // Business conversation
    const otherParticipantId = business.ownerId || business.id;
    const conv = await getOrCreateConversation([user.id, otherParticipantId]);
    const messages = await getConversationMessages(conv.id);

    return (
      <ClientChatPage
        locale={locale}
        businessSlug={business.slug}
        userId={user.id}
        participantType="business"
        business={{
          id: business.id,
          slug: business.slug,
          name: business.name,
          categoryId: business.categoryId,
          media: business.media,
        }}
        initialMessages={messages}
      />
    );
  }

  // Try to find as user
  const targetUser = await getUserByUsername(cleanSlug) || await getUserById(cleanSlug);
  
  if (targetUser) {
    // Prevent chatting with self
    if (targetUser.id === user.id) {
      notFound();
    }

    const conv = await getOrCreateConversation([user.id, targetUser.id]);
    const messages = await getConversationMessages(conv.id);

    return (
      <ClientChatPage
        locale={locale}
        businessSlug={targetUser.username || targetUser.id}
        userId={user.id}
        participantType="user"
        targetUser={{
          id: targetUser.id,
          username: targetUser.username,
          displayName: targetUser.displayName || targetUser.fullName || targetUser.email,
          avatarUrl: targetUser.avatarUrl,
        }}
        initialMessages={messages}
      />
    );
  }

  notFound();
}

