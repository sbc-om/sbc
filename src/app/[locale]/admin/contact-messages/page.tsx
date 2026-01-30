import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listContactMessages } from "@/lib/db/contactMessages";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { setContactMessageReadAction } from "./actions";

export const runtime = "nodejs";

export default async function AdminContactMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const { filter = "unread", q = "" } = (await searchParams) ?? {};
  const query = q.trim().toLowerCase();

  const messages = await listContactMessages();
  const unreadCount = messages.filter((m) => !m.isRead).length;
  const readCount = messages.length - unreadCount;
  const ar = locale === "ar";

  const filtered = messages.filter((msg) => {
    if (filter === "unread" && msg.isRead) return false;
    if (filter === "read" && !msg.isRead) return false;
    if (!query) return true;

    const hay = [msg.name, msg.email, msg.subject, msg.message]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  });

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "رسائل التواصل" : "Contact Messages"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar ? "عرض رسائل صفحة تواصل معنا" : "View messages sent from the contact page"}
          </p>
        </div>
        <Link href={`/${locale}/admin`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {ar ? "لوحة الإدارة" : "Admin dashboard"}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          href={`/${locale}/admin/contact-messages?filter=unread${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={buttonVariants({ variant: filter === "unread" ? "primary" : "secondary", size: "sm" })}
        >
          {ar ? "غير مقروءة" : "Unread"}
          <span className="ms-2 text-xs opacity-70">{unreadCount}</span>
        </Link>
        <Link
          href={`/${locale}/admin/contact-messages?filter=read${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={buttonVariants({ variant: filter === "read" ? "primary" : "secondary", size: "sm" })}
        >
          {ar ? "مقروءة" : "Read"}
          <span className="ms-2 text-xs opacity-70">{readCount}</span>
        </Link>
        <Link
          href={`/${locale}/admin/contact-messages?filter=all${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={buttonVariants({ variant: filter === "all" ? "primary" : "secondary", size: "sm" })}
        >
          {ar ? "الكل" : "All"}
          <span className="ms-2 text-xs opacity-70">{messages.length}</span>
        </Link>

        <form className="ms-auto w-full sm:w-auto" action={`/${locale}/admin/contact-messages`}>
          <input type="hidden" name="filter" value={filter} />
          <input
            name="q"
            defaultValue={q}
            placeholder={ar ? "بحث في الرسائل..." : "Search messages..."}
            className="w-full sm:w-64 h-10 px-3 rounded-xl border border-(--surface-border) bg-(--surface) text-sm"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {ar ? "لا توجد رسائل." : "No messages found."}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((msg) => (
            <div key={msg.id} className="sbc-card rounded-2xl p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{msg.name}</div>
                    <span className="text-xs text-(--muted-foreground)">{msg.email}</span>
                    <span className="text-[11px] text-(--muted-foreground)">
                      {new Date(msg.createdAt).toLocaleString(locale)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold">{msg.subject}</div>
                  <p className="mt-2 text-sm text-(--muted-foreground) whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-(--muted-foreground)">
                    {msg.isRead ? (ar ? "مقروءة" : "Read") : (ar ? "غير مقروءة" : "Unread")}
                  </span>
                  {msg.isRead ? (
                    <form action={setContactMessageReadAction.bind(null, locale as Locale, msg.id, false)}>
                      <button type="submit" className={buttonVariants({ variant: "secondary", size: "xs" })}>
                        {ar ? "تعليم كغير مقروء" : "Mark unread"}
                      </button>
                    </form>
                  ) : (
                    <form action={setContactMessageReadAction.bind(null, locale as Locale, msg.id, true)}>
                      <button type="submit" className={buttonVariants({ variant: "primary", size: "xs" })}>
                        {ar ? "تعليم كمقروء" : "Mark read"}
                      </button>
                    </form>
                  )}
                  <a
                    href={`mailto:${msg.email}?subject=${encodeURIComponent(msg.subject)}`}
                    className={buttonVariants({ variant: "ghost", size: "xs" })}
                  >
                    {ar ? "رد بالبريد" : "Reply"}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppPage>
  );
}
