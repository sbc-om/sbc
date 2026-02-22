import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { MarkdownRenderer } from "@/components/ui/MarkdownEditor";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinessNewsModerationQueue } from "@/lib/db/businessContent";
import { isLocale, type Locale } from "@/lib/i18n/locales";

import { moderateBusinessNewsAction } from "../actions";

export const runtime = "nodejs";

type ModerationFilter = "all" | "pending" | "approved" | "rejected";

function parseFilter(value: string | undefined): ModerationFilter {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return "all";
}

function moderationLabel(status: "pending" | "approved" | "rejected", ar: boolean): string {
  if (status === "approved") return ar ? "مقبول" : "Approved";
  if (status === "rejected") return ar ? "مرفوض" : "Rejected";
  return ar ? "بانتظار المراجعة" : "Pending";
}

function moderationClass(status: "pending" | "approved" | "rejected"): string {
  if (status === "approved") return "border-emerald-300/40 bg-emerald-500/5 text-emerald-700";
  if (status === "rejected") return "border-rose-300/40 bg-rose-500/5 text-rose-700";
  return "border-amber-300/40 bg-amber-500/5 text-amber-700";
}

function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function AdminModerationNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const sp = await searchParams;
  const currentFilter = parseFilter(sp.status);
  const items = await listBusinessNewsModerationQueue(500);
  const filteredItems = currentFilter === "all" ? items : items.filter((item) => item.moderationStatus === currentFilter);
  const ar = locale === "ar";
  const counts = {
    all: items.length,
    pending: items.filter((item) => item.moderationStatus === "pending").length,
    approved: items.filter((item) => item.moderationStatus === "approved").length,
    rejected: items.filter((item) => item.moderationStatus === "rejected").length,
  };
  const filters: Array<{ value: ModerationFilter; label: string }> = [
    { value: "all", label: ar ? "الكل" : "All" },
    { value: "pending", label: ar ? "بانتظار المراجعة" : "Pending" },
    { value: "approved", label: ar ? "مقبول" : "Approved" },
    { value: "rejected", label: ar ? "مرفوض" : "Rejected" },
  ];

  return (
    <AppPage>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{ar ? "مراجعة أخبار الأنشطة" : "Moderate Business News"}</h1>
        <Link href={`/${locale}/admin`} className="text-sm text-(--muted-foreground) hover:underline">
          {ar ? "العودة للوحة التحكم" : "Back to admin dashboard"}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = currentFilter === filter.value;
          const href = filter.value === "all"
            ? `/${locale}/admin/moderation/news`
            : `/${locale}/admin/moderation/news?status=${filter.value}`;

          return (
            <Link
              key={filter.value}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-(--surface-border) text-(--muted-foreground) hover:bg-(--chip-bg)"
              }`}
            >
              <span>{filter.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                active ? "bg-accent/20 text-accent" : "bg-(--chip-bg) text-(--muted-foreground)"
              }`}>
                {counts[filter.value]}
              </span>
            </Link>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {ar ? "لا توجد عناصر في هذا الفلتر." : "No submissions for this filter."}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const approve = moderateBusinessNewsAction.bind(null, locale as Locale, item.id, "approved");
            const reject = moderateBusinessNewsAction.bind(null, locale as Locale, item.id, "rejected");
            const title = ar ? item.title.ar : item.title.en;
            const businessName = ar ? item.businessName.ar : item.businessName.en;
            const localeValue = locale as Locale;

            return (
              <article key={item.id} className="sbc-card rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-(--muted-foreground)">
                      {businessName} • @{item.businessSlug}
                    </p>
                    <h2 className="mt-1 text-base font-semibold">{title}</h2>
                    <p className="mt-1 text-xs text-(--muted-foreground)">
                      {ar ? "تاريخ الإرسال:" : "Submitted:"} {formatDate(item.createdAt, localeValue)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={approve}>
                      <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                        {ar ? "قبول" : "Approve"}
                      </button>
                    </form>
                    <form action={reject}>
                      <button type="submit" className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                        {ar ? "رفض" : "Reject"}
                      </button>
                    </form>
                  </div>
                </div>

                {item.imageUrl ? (
                  <div className="relative mt-4 h-52 w-full overflow-hidden rounded-xl border border-(--surface-border)">
                    <Image src={item.imageUrl} alt={title} fill className="object-cover" />
                  </div>
                ) : null}

                {item.linkUrl ? (
                  <p className="mt-3 text-sm">
                    <span className="text-(--muted-foreground)">{ar ? "الرابط:" : "Link:"} </span>
                    <a href={item.linkUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline break-all">
                      {item.linkUrl}
                    </a>
                  </p>
                ) : null}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-(--surface-border) p-3">
                    <p className="mb-2 text-xs font-semibold text-(--muted-foreground)">EN</p>
                    <h3 className="text-sm font-semibold">{item.title.en}</h3>
                    <div className="mt-2 text-sm leading-7">
                      <MarkdownRenderer content={item.content.en} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-(--surface-border) p-3">
                    <p className="mb-2 text-xs font-semibold text-(--muted-foreground)">AR</p>
                    <h3 className="text-sm font-semibold">{item.title.ar}</h3>
                    <div className="mt-2 text-sm leading-7">
                      <MarkdownRenderer content={item.content.ar} />
                    </div>
                  </div>
                </div>

                <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${moderationClass(item.moderationStatus)}`}>
                  {ar ? "الحالة الحالية:" : "Current status:"} {moderationLabel(item.moderationStatus, ar)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppPage>
  );
}
