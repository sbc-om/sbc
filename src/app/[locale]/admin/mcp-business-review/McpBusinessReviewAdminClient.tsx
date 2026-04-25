"use client";

import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";

type ActionType = "list" | "get" | "review";

type Props = {
  locale: Locale;
  publicEndpoint: string;
  infoEndpoint: string;
  authRequired: boolean;
  authConfigured: boolean;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
};

export function McpBusinessReviewAdminClient({
  locale,
  publicEndpoint,
  infoEndpoint,
  authRequired,
  authConfigured,
  rateLimit,
}: Props) {
  const ar = locale === "ar";
  const dir = localeDir(locale);
  const [action, setAction] = useState<ActionType>("review");
  const [search, setSearch] = useState("");
  const [approval, setApproval] = useState<"all" | "approved" | "pending">("approved");
  const [limit, setLimit] = useState("5");
  const [offset, setOffset] = useState("0");
  const [slug, setSlug] = useState("");
  const [businessIds, setBusinessIds] = useState("");
  const [useAi, setUseAi] = useState(true);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        action,
        approval,
        search: search || undefined,
        limit: Number(limit) || undefined,
        offset: action === "list" ? Number(offset) || 0 : undefined,
        slug: action === "get" ? slug || undefined : undefined,
        businessIds:
          action === "review" && businessIds.trim().length > 0
            ? businessIds
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : undefined,
        locale,
        useAi: action === "review" ? useAi : undefined,
      };

      const response = await fetch("/api/admin/mcp/business-review/test", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Request failed");
      }

      setResult(JSON.stringify(data.result, null, 2));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
      setResult("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir={dir} className="grid gap-6 xl:grid-cols-[minmax(20rem,0.95fr)_minmax(0,1.05fr)]">
      <section className="min-w-0 space-y-6 xl:min-w-[20rem]">
        <div className="rounded-3xl border border-(--surface-border) bg-(--surface) p-6">
          <h2 className="text-xl font-semibold">
            {ar ? "اختبار MCP داخلياً" : "Test MCP internally"}
          </h2>
          <p className="mt-2 text-sm leading-7 text-(--muted-foreground)">
            {ar
              ? "نفّذ list أو get أو review مباشرة من داخل لوحة الإدارة بدون الحاجة إلى عميل خارجي."
              : "Run list, get, or review directly from the admin area without an external MCP client."}
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium">
              {ar ? "العملية" : "Action"}
              <select
                value={action}
                onChange={(event) => setAction(event.target.value as ActionType)}
                className="mt-1 w-full rounded-2xl border border-(--surface-border) bg-background px-4 py-3 text-sm"
              >
                <option value="list">list</option>
                <option value="get">get</option>
                <option value="review">review</option>
              </select>
            </label>

            <label className="block text-sm font-medium">
              {ar ? "الحالة" : "Approval"}
              <select
                value={approval}
                onChange={(event) => setApproval(event.target.value as "all" | "approved" | "pending")}
                className="mt-1 w-full rounded-2xl border border-(--surface-border) bg-background px-4 py-3 text-sm"
              >
                <option value="approved">approved</option>
                <option value="all">all</option>
                <option value="pending">pending</option>
              </select>
            </label>

            <label className="block text-sm font-medium">
              {ar ? "البحث" : "Search"}
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-(--surface-border) bg-background px-4 py-3 text-sm"
                placeholder={ar ? "مثال: مطعم" : "Example: restaurant"}
              />
            </label>

            {action === "get" ? (
              <label className="block text-sm font-medium">
                {ar ? "Slug النشاط" : "Business slug"}
                <input
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-(--surface-border) bg-background px-4 py-3 text-sm"
                  placeholder="business-slug"
                />
              </label>
            ) : null}

            {action === "review" ? (
              <>
                <label className="block text-sm font-medium">
                  {ar ? "معرفات الأنشطة" : "Business IDs"}
                  <input
                    value={businessIds}
                    onChange={(event) => setBusinessIds(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-(--surface-border) bg-background px-4 py-3 text-sm"
                    placeholder={ar ? "id1, id2, id3" : "id1, id2, id3"}
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-(--surface-border) bg-background px-4 py-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(event) => setUseAi(event.target.checked)}
                  />
                  <span>{ar ? "تفعيل التحليل بالذكاء الاصطناعي" : "Enable AI analysis"}</span>
                </label>
              </>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                {ar ? "الحد" : "Limit"}
                <input
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                  className="mt-1 w-full rounded-2xl border border-(--surface-border) bg-background px-4 py-3 text-sm"
                  inputMode="numeric"
                />
              </label>

              {action === "list" ? (
                <label className="block text-sm font-medium">
                  {ar ? "الإزاحة" : "Offset"}
                  <input
                    value={offset}
                    onChange={(event) => setOffset(event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-(--surface-border) bg-background px-4 py-3 text-sm"
                    inputMode="numeric"
                  />
                </label>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
              {loading ? (ar ? "جارٍ التنفيذ..." : "Running...") : ar ? "نفّذ الاختبار" : "Run test"}
            </Button>
          </form>
        </div>

        <div className="rounded-3xl border border-(--surface-border) bg-(--surface) p-6">
          <h2 className="text-xl font-semibold">{ar ? "الحالة العامة" : "Public readiness"}</h2>
          <div className="mt-4 space-y-3 text-sm text-(--muted-foreground)">
            <div>
              <div className="font-semibold text-foreground">{ar ? "الـ endpoint العام" : "Public endpoint"}</div>
              <div className="mt-1 break-all rounded-2xl bg-background px-4 py-3">{publicEndpoint}</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">{ar ? "Endpoint المعلومات" : "Info endpoint"}</div>
              <div className="mt-1 break-all rounded-2xl bg-background px-4 py-3">{infoEndpoint}</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-background px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em]">Auth</div>
                <div className="mt-1 font-semibold text-foreground">
                  {authRequired ? (ar ? "مطلوب" : "Required") : authConfigured ? (ar ? "مُعد لكنه غير مفروض" : "Configured but optional") : ar ? "غير مفعل" : "Disabled"}
                </div>
              </div>
              <div className="rounded-2xl bg-background px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em]">Rate Limit</div>
                <div className="mt-1 font-semibold text-foreground">
                  {rateLimit.maxRequests} / {Math.round(rateLimit.windowMs / 1000)}s
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-6">
        <div className="rounded-3xl border border-(--surface-border) bg-(--surface) p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{ar ? "النتيجة" : "Result"}</h2>
            <a href={infoEndpoint} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              {ar ? "افتح info" : "Open info"}
            </a>
          </div>
          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <pre className="mt-4 min-h-[420px] min-w-0 overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm leading-7 text-slate-100">
            <code>{result || (ar ? "نفّذ اختباراً لعرض النتيجة هنا." : "Run a test to display the result here.")}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}