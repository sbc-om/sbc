import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { countStoriesModerationQueue, listStoriesModerationQueue } from "@/lib/db/stories";
import { isLocale, type Locale } from "@/lib/i18n/locales";

import { moderateStoryAction } from "../actions";

export const runtime = "nodejs";
const ITEMS_PER_PAGE = 24;

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

export default async function AdminModerationStoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const sp = await searchParams;
  const currentFilter = parseFilter(sp.status);
  const parsedPage = Number.parseInt(sp.page || "1", 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const statusFilter = currentFilter === "all" ? undefined : currentFilter;
  const ar = locale === "ar";

  const [allCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    countStoriesModerationQueue(),
    countStoriesModerationQueue("pending"),
    countStoriesModerationQueue("approved"),
    countStoriesModerationQueue("rejected"),
  ]);

  const totalFiltered = currentFilter === "all"
    ? allCount
    : currentFilter === "pending"
      ? pendingCount
      : currentFilter === "approved"
        ? approvedCount
        : rejectedCount;

  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * ITEMS_PER_PAGE;
  const filteredItems = await listStoriesModerationQueue({
    limit: ITEMS_PER_PAGE,
    offset,
    status: statusFilter,
  });

  const counts = {
    all: allCount,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
  };
  const filters: Array<{ value: ModerationFilter; label: string }> = [
    { value: "all", label: ar ? "الكل" : "All" },
    { value: "pending", label: ar ? "بانتظار المراجعة" : "Pending" },
    { value: "approved", label: ar ? "مقبول" : "Approved" },
    { value: "rejected", label: ar ? "مرفوض" : "Rejected" },
  ];

  function buildModerationHref(filter: ModerationFilter, page = 1): string {
    const query = new URLSearchParams();
    if (filter !== "all") query.set("status", filter);
    if (page > 1) query.set("page", String(page));
    const qs = query.toString();
    return qs ? `/${locale}/admin/moderation/stories?${qs}` : `/${locale}/admin/moderation/stories`;
  }

  return (
    <AppPage>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{ar ? "مراجعة الستوري" : "Moderate Stories"}</h1>
        <Link href={`/${locale}/admin`} className="text-sm text-(--muted-foreground) hover:underline">
          {ar ? "العودة للوحة التحكم" : "Back to admin dashboard"}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = currentFilter === filter.value;
          const href = buildModerationHref(filter.value);

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
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map((item) => {
              const approve = moderateStoryAction.bind(null, locale as Locale, item.id, "approved");
              const reject = moderateStoryAction.bind(null, locale as Locale, item.id, "rejected");
              const businessName = ar ? item.businessName.ar : item.businessName.en;

              return (
                <article key={item.id} className="sbc-card rounded-2xl p-4">
                  <div className="relative mb-3 w-full aspect-[9/16] overflow-hidden rounded-xl bg-(--surface)">
                    {item.mediaType === "video" ? (
                      <video src={item.mediaUrl} className="h-full w-full object-cover object-top" controls />
                    ) : (
                      <Image src={item.mediaUrl} alt={businessName} fill className="object-cover object-top" />
                    )}
                  </div>

                  <p className="text-xs text-(--muted-foreground)">
                    {businessName} • @{item.businessUsername || "-"}
                  </p>
                  {item.caption ? <p className="mt-2 text-sm">{item.caption}</p> : null}

                  <div className={`mt-2 inline-flex rounded-lg border px-2 py-1 text-xs ${moderationClass(item.moderationStatus)}`}>
                    {moderationLabel(item.moderationStatus, ar)}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
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
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-(--surface-border) bg-(--surface) px-4 py-3 text-sm">
              <div className="text-(--muted-foreground)">
                {ar
                  ? `عرض ${offset + 1}-${Math.min(offset + ITEMS_PER_PAGE, totalFiltered)} من ${totalFiltered}`
                  : `Showing ${offset + 1}-${Math.min(offset + ITEMS_PER_PAGE, totalFiltered)} of ${totalFiltered}`}
              </div>
              <div className="flex items-center gap-2">
                {safePage > 1 ? (
                  <Link href={buildModerationHref(currentFilter, safePage - 1)} className="rounded-lg border border-(--surface-border) px-3 py-1.5 font-medium hover:bg-(--chip-bg)">
                    {ar ? "السابق" : "Previous"}
                  </Link>
                ) : null}
                <span className="px-2 font-medium">
                  {safePage} / {totalPages}
                </span>
                {safePage < totalPages ? (
                  <Link href={buildModerationHref(currentFilter, safePage + 1)} className="rounded-lg border border-(--surface-border) px-3 py-1.5 font-medium hover:bg-(--chip-bg)">
                    {ar ? "التالي" : "Next"}
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </AppPage>
  );
}
