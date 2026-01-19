import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { ChatLayoutClient } from "@/components/chat/ChatLayoutClient";

export default async function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireUser(locale as Locale);

  return (
    <div className="h-screen flex overflow-hidden bg-background pb-20 lg:pb-0">
      <ChatLayoutClient locale={locale}>
        {children}
      </ChatLayoutClient>
    </div>
  );
}
