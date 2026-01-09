import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessBySlug } from "@/lib/db/businesses";
import { getOrCreateConversation, listMessages } from "@/lib/db/chats";
import { AppPage } from "@/components/AppPage";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { sendChatMessageAction } from "../actions";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const user = await requireUser(locale as Locale);
  const business = getBusinessBySlug(slug);
  if (!business) notFound();

  const conv = getOrCreateConversation({
    userId: user.id,
    businessId: business.id,
    businessSlug: business.slug,
  });

  const messages = listMessages(conv.id);
  const businessName = locale === "ar" ? business.name.ar : business.name.en;

  return (
    <AppPage>
        <div className="sbc-card rounded-2xl p-5">
          <div className="font-semibold">{businessName}</div>
          <div className="mt-1 text-xs text-(--muted-foreground)">
            {locale === "ar" ? "محادثة" : "Conversation"}
          </div>

          <div className="mt-5 grid gap-2">
            {messages.length ? (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: "rgba(var(--surface-rgb, 255,255,255), 0.6)",
                    border: "1px solid",
                    borderColor: "var(--surface-border)",
                  }}
                >
                  <div className="whitespace-pre-wrap wrap-break-word">{m.text}</div>
                  <div className="mt-1 text-[11px] text-(--muted-foreground)">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-(--muted-foreground)">
                {locale === "ar"
                  ? "اكتب أول رسالة لبدء المحادثة."
                  : "Write your first message to start the chat."}
              </div>
            )}
          </div>
        </div>

        <form
          action={sendChatMessageAction.bind(null, locale as Locale, business.slug)}
          className="mt-4 flex gap-2"
        >
          <Input
            name="text"
            placeholder={locale === "ar" ? "اكتب رسالة..." : "Type a message..."}
          />
          <Button type="submit">{locale === "ar" ? "إرسال" : "Send"}</Button>
        </form>
    </AppPage>
  );
}
