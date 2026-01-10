import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { listUsers } from "@/lib/db/users";

export const runtime = "nodejs";

function formatDate(iso: string, locale: Locale) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const users = listUsers();

  const title = dict.nav.users ?? (locale === "ar" ? "المستخدمون" : "Users");

  return (
    <AppPage>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {locale === "ar"
              ? `إجمالي المستخدمين: ${users.length}`
              : `Total users: ${users.length}`}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        {users.length === 0 ? (
          <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
            {locale === "ar" ? "لا يوجد مستخدمون بعد." : "No users yet."}
          </div>
        ) : (
          <div className="sbc-card rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_120px_140px] gap-3 px-5 py-3 text-xs font-semibold text-(--muted-foreground) border-b" style={{ borderColor: "var(--surface-border)" }}>
              <div>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</div>
              <div>{locale === "ar" ? "الدور" : "Role"}</div>
              <div>{locale === "ar" ? "تاريخ الإنشاء" : "Created"}</div>
            </div>

            <div className="divide-y" style={{ borderColor: "var(--surface-border)" }}>
              {users.map((u) => (
                <div key={u.id} className="px-5 py-4 sm:grid sm:grid-cols-[1fr_120px_140px] sm:gap-3 sm:items-center">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{u.email}</div>
                    <div className="mt-1 text-xs text-(--muted-foreground) truncate">ID: {u.id}</div>
                  </div>

                  <div className="mt-3 sm:mt-0">
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                        (u.role === "admin"
                          ? "bg-accent/10 text-accent"
                          : "bg-(--surface) text-foreground")
                      }
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="mt-3 sm:mt-0 text-xs text-(--muted-foreground)">
                    {formatDate(u.createdAt, locale as Locale)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppPage>
  );
}
