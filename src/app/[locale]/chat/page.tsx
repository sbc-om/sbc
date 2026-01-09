import Link from "next/link";
import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { requireUser } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { listConversationsByUser } from "@/lib/db/chats";
import { getBusinessById } from "@/lib/db/businesses";
import { AppPage } from "@/components/AppPage";

export default async function ChatIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireUser(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const businesses = listBusinesses({ locale: locale as Locale }).slice(0, 50);

  return (
    <AppPage>
        <h1 className="text-2xl font-semibold tracking-tight">
          {locale === "ar" ? "الدردشة" : (dict.nav.chat ?? "Chat")}
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {locale === "ar" ? "ابدأ محادثة مع أي عمل." : "Start a conversation with any business."}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {businesses.map((b) => {
            const name = locale === "ar" ? b.name.ar : b.name.en;
            return (
              <Link
                key={b.id}
                href={`/${locale}/chat/${b.slug}`}
                className="sbc-card sbc-card--interactive rounded-2xl p-4"
              >
                <div className="font-semibold truncate">{name}</div>
                <div className="mt-1 text-xs text-(--muted-foreground) font-mono">/{b.slug}</div>
              </Link>
            );
          })}
        </div>

        {businesses.length === 0 ? (
          <div className="mt-10 text-center text-(--muted-foreground)">
            {locale === "ar" ? "لا توجد أعمال بعد." : "No businesses yet."}
          </div>
        ) : null}
    </AppPage>
  );
}
