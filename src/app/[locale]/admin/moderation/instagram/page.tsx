import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listBusinessInstagramModerationQueue } from "@/lib/db/businesses";
import { isLocale, type Locale } from "@/lib/i18n/locales";

import { moderateBusinessInstagramAction } from "../actions";

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

export default async function AdminModerationInstagramPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const ar = locale === "ar";
  const sp = await searchParams;
  const currentFilter = parseFilter(sp.status);
  const items = await listBusinessInstagramModerationQueue(500);
  const filteredItems = currentFilter === "all" ? items : items.filter((item) => item.instagramModerationStatus === currentFilter);

  const counts = {
    all: items.length,
    pending: items.filter((item) => item.instagramModerationStatus === "pending").length,
    approved: items.filter((item) => item.instagramModerationStatus === "approved").length,
    rejected: items.filter((item) => item.instagramModerationStatus === "rejected").length,
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
        <h1 className="text-2xl font-bold">{ar ? "مراجعة صفحات إنستاغرام" : "Moderate Instagram Pages"}</h1>
        <Link href={`/${locale}/admin`} className="text-sm text-(--muted-foreground) hover:underline">
          {ar ? "العودة للوحة التحكم" : "Back to admin dashboard"}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = currentFilter === filter.value;
          const href = filter.value === "all"
            ? `/${locale}/admin/moderation/instagram`
            : `/${locale}/admin/moderation/instagram?status=${filter.value}`;

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
            const approve = moderateBusinessInstagramAction.bind(null, locale as Locale, item.id, "approved");
            const reject = moderateBusinessInstagramAction.bind(null, locale as Locale, item.id, "rejected");
            const businessName = ar ? item.name.ar : item.name.en;

            return (
              <article key={item.id} className="sbc-card rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-(--muted-foreground)">
                      {businessName} • @{item.username || item.slug}
                    </p>
                    <h2 className="mt-1 text-base font-semibold">@{item.instagramUsername}</h2>
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

                <a
                  href={`https://www.instagram.com/${String(item.instagramUsername || "").replace(/^@/, "")}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm text-accent hover:underline"
                >
                  {ar ? "فتح حساب إنستاغرام" : "Open Instagram profile"}
                </a>

                <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${moderationClass(item.instagramModerationStatus || "pending")}`}>
                  {ar ? "الحالة الحالية:" : "Current status:"} {moderationLabel((item.instagramModerationStatus || "pending") as "pending" | "approved" | "rejected", ar)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppPage>
  );
}
