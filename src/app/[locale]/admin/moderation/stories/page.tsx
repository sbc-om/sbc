import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";

import { AppPage } from "@/components/AppPage";
import { requireAdmin } from "@/lib/auth/requireUser";
import { countStoriesModerationQueue, listStoriesModerationQueue, type StoryOverlays } from "@/lib/db/stories";
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
  if (status === "approved") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (status === "rejected") return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
  return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
}

function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

const FILTER_STYLES: Record<string, string> = {
  none: "",
  grayscale: "grayscale(100%)",
  sepia: "sepia(80%)",
  warm: "saturate(1.3) sepia(20%) brightness(1.1)",
  cool: "saturate(1.1) hue-rotate(10deg) brightness(1.05)",
  vintage: "sepia(30%) contrast(1.1) brightness(0.95)",
  dramatic: "contrast(1.4) saturate(1.2) brightness(0.9)",
  fade: "contrast(0.9) brightness(1.1) saturate(0.8)",
  vivid: "saturate(1.5) contrast(1.1)",
};

function buildFilterStyle(o: StoryOverlays): string {
  const f = FILTER_STYLES[o.filter ?? "none"] || "";
  return `${f} brightness(${o.brightness ?? 100}%) contrast(${o.contrast ?? 100}%) saturate(${o.saturation ?? 100}%)`.trim();
}

function StoryOverlayLayer({ overlays }: { overlays: StoryOverlays }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[5]">
      {overlays.textOverlays?.map((t, i) => (
        <div
          key={`t-${i}`}
          className="absolute"
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            transform: `translate(-50%, -50%) rotate(${t.rotation}deg) scale(${t.scale})`,
          }}
        >
          <span
            style={{
              fontSize: `${t.fontSize}px`,
              fontFamily: t.fontFamily,
              fontWeight: t.fontWeight ?? 400,
              color: t.color,
              backgroundColor: t.backgroundColor,
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
            }}
          >
            {t.text}
          </span>
        </div>
      ))}
      {overlays.stickerOverlays?.map((s, i) => (
        <div
          key={`s-${i}`}
          className="absolute text-3xl sm:text-5xl"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
          }}
        >
          {s.emoji}
        </div>
      ))}
    </div>
  );
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "bg-accent/10 text-accent"
                  : "text-(--muted-foreground) hover:bg-(--chip-bg)"
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
        <div className="sbc-card !border-0 rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {ar ? "لا توجد عناصر في هذا الفلتر." : "No submissions for this filter."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => {
              const approve = moderateStoryAction.bind(null, locale as Locale, item.id, "approved");
              const reject = moderateStoryAction.bind(null, locale as Locale, item.id, "rejected");
              const businessName = ar ? item.businessName.ar : item.businessName.en;
              const localeValue = locale as Locale;

              return (
                <article key={item.id} className="sbc-card !border-0 rounded-2xl overflow-hidden">
                  {/* Media — edge-to-edge */}
                  <div className="relative w-full aspect-[9/16] bg-(--surface) overflow-hidden">
                    {item.mediaType === "video" ? (
                      <video
                        src={item.mediaUrl}
                        className="h-full w-full object-cover object-top"
                        style={item.overlays ? {
                          filter: buildFilterStyle(item.overlays),
                          transform: `scale(${item.overlays.imageScale ?? 1}) translate(${item.overlays.imagePosition?.x ?? 0}%, ${item.overlays.imagePosition?.y ?? 0}%)`,
                        } : undefined}
                        controls
                      />
                    ) : (
                      <Image src={item.mediaUrl} alt={businessName} fill className="object-cover object-top" />
                    )}

                    {/* Story overlays (text + stickers) */}
                    {item.overlays && <StoryOverlayLayer overlays={item.overlays} />}

                    {/* Status badge overlay */}
                    <div className={`absolute top-2 start-2 rounded-lg px-2 py-1 text-[10px] font-semibold backdrop-blur-md ${moderationClass(item.moderationStatus)}`}>
                      {moderationLabel(item.moderationStatus, ar)}
                    </div>

                    {/* View count overlay */}
                    {item.viewCount > 0 && (
                      <div className="absolute top-2 end-2 flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-md">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {item.viewCount}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4 space-y-2.5">
                    {/* Business info */}
                    <div className="flex items-center gap-2 min-w-0">
                      {item.businessAvatar ? (
                        <Image
                          src={item.businessAvatar}
                          alt={businessName}
                          width={24}
                          height={24}
                          className="h-6 w-6 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-6 w-6 shrink-0 rounded-full bg-(--chip-bg)" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{businessName}</p>
                        <p className="truncate text-[10px] text-(--muted-foreground)">@{item.businessUsername || "-"}</p>
                      </div>
                    </div>

                    {/* Caption */}
                    {item.caption ? (
                      <p className="text-xs leading-relaxed line-clamp-2 text-(--muted-foreground)">{item.caption}</p>
                    ) : null}

                    {/* Date */}
                    <p className="text-[10px] text-(--muted-foreground)">
                      {formatDate(item.createdAt, localeValue)}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <form action={approve} className="flex-1">
                        <button type="submit" className="w-full rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                          {ar ? "قبول" : "Approve"}
                        </button>
                      </form>
                      <form action={reject} className="flex-1">
                        <button type="submit" className="w-full rounded-lg bg-rose-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                          {ar ? "رفض" : "Reject"}
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-(--surface) px-4 py-3 text-sm">
              <div className="text-(--muted-foreground)">
                {ar
                  ? `عرض ${offset + 1}-${Math.min(offset + ITEMS_PER_PAGE, totalFiltered)} من ${totalFiltered}`
                  : `Showing ${offset + 1}-${Math.min(offset + ITEMS_PER_PAGE, totalFiltered)} of ${totalFiltered}`}
              </div>
              <div className="flex items-center gap-2">
                {safePage > 1 ? (
                  <Link href={buildModerationHref(currentFilter, safePage - 1)} className="rounded-lg bg-(--chip-bg) px-3 py-1.5 font-medium hover:opacity-80">
                    {ar ? "السابق" : "Previous"}
                  </Link>
                ) : null}
                <span className="px-2 font-medium">
                  {safePage} / {totalPages}
                </span>
                {safePage < totalPages ? (
                  <Link href={buildModerationHref(currentFilter, safePage + 1)} className="rounded-lg bg-(--chip-bg) px-3 py-1.5 font-medium hover:opacity-80">
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
