import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessBySlug, getBusinessByUsername } from "@/lib/db/businesses";
import { getOrCreateConversation, listMessages } from "@/lib/db/chats";
import { ClientChatPage } from "./ClientChatPage";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const business = slug.startsWith("@")
    ? getBusinessByUsername(slug)
    : getBusinessBySlug(slug);
  if (!business) notFound();

  const conv = getOrCreateConversation({
    userId: user.id,
    businessId: business.id,
    businessSlug: business.slug,
  });

  const messages = listMessages(conv.id);

  return (
    <ClientChatPage
      locale={locale}
      businessSlug={business.slug}
      business={{
        id: business.id,
        slug: business.slug,
        name: business.name,
        category: business.category,
        media: business.media,
      }}
      initialMessages={messages}
    />
  );
}

