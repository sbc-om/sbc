import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinesses } from "@/lib/db/businesses";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { deleteBusinessAction } from "@/app/[locale]/admin/actions";

export const runtime = "nodejs";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);
  const dict = await getDictionary(locale as Locale);

  const businesses = listBusinesses();

  return (
    <Container>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{dict.nav.admin}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {locale === "ar" ? "إدارة دليل الأعمال" : "Manage your business directory"}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/new`}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {locale === "ar" ? "إضافة عمل" : "Add business"}
        </Link>
      </div>

      <div className="mt-8 grid gap-3">
        {businesses.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            {locale === "ar" ? "لا توجد أعمال بعد." : "No businesses yet."}
          </div>
        ) : null}

        {businesses.map((b) => (
          <div
            key={b.id}
            className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 dark:border-white/10 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {locale === "ar" ? b.name.ar : b.name.en}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-mono">/{b.slug}</span>
                {b.city ? <span>{b.city}</span> : null}
                {b.category ? <span>{b.category}</span> : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/${locale}/businesses/${b.slug}`}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                {locale === "ar" ? "عرض" : "View"}
              </Link>
              <Link
                href={`/${locale}/admin/${b.id}/edit`}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-50 dark:hover:bg-zinc-900"
              >
                {locale === "ar" ? "تعديل" : "Edit"}
              </Link>
              <form action={deleteBusinessAction.bind(null, locale as Locale, b.id)}>
                <button
                  className="rounded-xl border border-red-500/25 bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500"
                  type="submit"
                >
                  {locale === "ar" ? "حذف" : "Delete"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
