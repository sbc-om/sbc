import Link from "next/link";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/auth/requireUser";
import { listRealtimeEngagementHealthLogs } from "@/lib/db/realtimeHealthLogs";
import { isLocale, type Locale } from "@/lib/i18n/locales";

export const runtime = "nodejs";

function normalizeMode(value?: string): "idle" | "sse" | "fallback" | undefined {
  if (value === "idle" || value === "sse" || value === "fallback") return value;
  return undefined;
}

function modeBadgeClass(mode: "idle" | "sse" | "fallback") {
  if (mode === "sse") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (mode === "fallback") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export default async function AdminRealtimeHealthPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ mode?: string; errors?: string; path?: string; limit?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await requireAdmin(locale as Locale);

  const ar = locale === "ar";
  const raw = (await searchParams) ?? {};
  const mode = normalizeMode(raw.mode);
  const onlyErrors = raw.errors === "1";
  const pathContains = raw.path?.trim();
  const parsedLimit = Number(raw.limit || "200");
  const limit = Number.isFinite(parsedLimit) ? Math.max(20, Math.min(parsedLimit, 500)) : 200;

  const logs = await listRealtimeEngagementHealthLogs({
    mode,
    onlyErrors,
    pathContains,
    limit,
  });

  const total = logs.length;
  const withErrors = logs.filter((l) => l.streamErrors > 0).length;
  const fallbackCount = logs.filter((l) => l.mode === "fallback").length;
  const sseCount = logs.filter((l) => l.mode === "sse").length;

  const modeQuery = mode ? `&mode=${mode}` : "";
  const pathQuery = pathContains ? `&path=${encodeURIComponent(pathContains)}` : "";
  const limitQuery = `&limit=${limit}`;

  return (
    <AppPage>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ar ? "صحة الاتصال الفوري" : "Realtime Engagement Health"}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "سجل مراقبة اتصال SSE والتحويل التلقائي في الزمن الحقيقي"
              : "Observability logs for SSE connectivity and fallback behavior."}
          </p>
        </div>
        <Link href={`/${locale}/admin`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {ar ? "لوحة الإدارة" : "Admin dashboard"}
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sbc-card rounded-2xl p-4">
          <div className="text-xs text-(--muted-foreground)">{ar ? "السجلات" : "Logs"}</div>
          <div className="mt-2 text-2xl font-semibold">{total}</div>
        </div>
        <div className="sbc-card rounded-2xl p-4">
          <div className="text-xs text-(--muted-foreground)">{ar ? "بأخطاء" : "With errors"}</div>
          <div className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">{withErrors}</div>
        </div>
        <div className="sbc-card rounded-2xl p-4">
          <div className="text-xs text-(--muted-foreground)">{ar ? "وضع SSE" : "SSE mode"}</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{sseCount}</div>
        </div>
        <div className="sbc-card rounded-2xl p-4">
          <div className="text-xs text-(--muted-foreground)">{ar ? "وضع Fallback" : "Fallback mode"}</div>
          <div className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400">{fallbackCount}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/${locale}/admin/realtime-health?limit=${limit}${pathQuery}`}
          className={buttonVariants({ variant: !mode ? "primary" : "secondary", size: "sm" })}
        >
          {ar ? "كل الأوضاع" : "All modes"}
        </Link>
        <Link
          href={`/${locale}/admin/realtime-health?mode=sse${onlyErrors ? "&errors=1" : ""}${pathQuery}${limitQuery}`}
          className={buttonVariants({ variant: mode === "sse" ? "primary" : "secondary", size: "sm" })}
        >
          SSE
        </Link>
        <Link
          href={`/${locale}/admin/realtime-health?mode=fallback${onlyErrors ? "&errors=1" : ""}${pathQuery}${limitQuery}`}
          className={buttonVariants({ variant: mode === "fallback" ? "primary" : "secondary", size: "sm" })}
        >
          Fallback
        </Link>
        <Link
          href={`/${locale}/admin/realtime-health?mode=idle${onlyErrors ? "&errors=1" : ""}${pathQuery}${limitQuery}`}
          className={buttonVariants({ variant: mode === "idle" ? "primary" : "secondary", size: "sm" })}
        >
          Idle
        </Link>
        <Link
          href={`/${locale}/admin/realtime-health?errors=1${modeQuery}${pathQuery}${limitQuery}`}
          className={buttonVariants({ variant: onlyErrors ? "primary" : "secondary", size: "sm" })}
        >
          {ar ? "أخطاء فقط" : "Errors only"}
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-2" action={`/${locale}/admin/realtime-health`}>
        {mode ? <input type="hidden" name="mode" value={mode} /> : null}
        {onlyErrors ? <input type="hidden" name="errors" value="1" /> : null}
        <input type="hidden" name="limit" value={String(limit)} />
        <input
          name="path"
          defaultValue={pathContains || ""}
          placeholder={ar ? "فلترة حسب المسار..." : "Filter by path..."}
          className="h-10 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-3 text-sm sm:w-80"
        />
      </form>

      {logs.length === 0 ? (
        <div className="sbc-card rounded-2xl p-6 text-sm text-(--muted-foreground)">
          {ar ? "لا توجد سجلات مطابقة للفلاتر." : "No logs found for current filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-(--surface-border)">
          <table className="min-w-full divide-y divide-(--surface-border) text-sm">
            <thead className="bg-(--surface)">
              <tr className="text-start text-xs uppercase tracking-wide text-(--muted-foreground)">
                <th className="px-4 py-3">{ar ? "الوقت" : "Time"}</th>
                <th className="px-4 py-3">{ar ? "المستخدم" : "User"}</th>
                <th className="px-4 py-3">{ar ? "الوضع" : "Mode"}</th>
                <th className="px-4 py-3">{ar ? "الاشتراكات" : "Subs"}</th>
                <th className="px-4 py-3">{ar ? "إعادة الاتصال" : "Reconnect"}</th>
                <th className="px-4 py-3">{ar ? "الأخطاء" : "Errors"}</th>
                <th className="px-4 py-3">{ar ? "مرئي" : "Visible"}</th>
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--surface-border)">
              {logs.map((log) => (
                <tr key={log.id} className="bg-(--surface-elevated)">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-(--muted-foreground)">
                    {new Date(log.createdAt).toLocaleString(locale)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[220px] truncate font-medium">{log.userLabel}</div>
                    <div className="max-w-[220px] truncate text-xs text-(--muted-foreground)">{log.userId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${modeBadgeClass(log.mode)}`}>
                      {log.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.subscribedBusinesses}</td>
                  <td className="px-4 py-3">{log.reconnectAttempts}</td>
                  <td className="px-4 py-3">
                    <span className={log.streamErrors > 0 ? "font-semibold text-rose-600 dark:text-rose-400" : ""}>
                      {log.streamErrors}
                    </span>
                  </td>
                  <td className="px-4 py-3">{log.visible ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")}</td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-xs text-(--muted-foreground)">
                    {log.path || "-"}
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-xs text-(--muted-foreground)">
                    {log.source || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppPage>
  );
}
