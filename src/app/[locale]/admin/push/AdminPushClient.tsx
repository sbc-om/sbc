"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Locale } from "@/lib/i18n/locales";

export type PushSubscriber = {
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  subscriptionCount: number;
  lastUpdatedAt: string;
};

export function AdminPushClient({
  locale,
  subscribers,
}: {
  locale: Locale;
  subscribers: PushSubscriber[];
}) {
  const ar = locale === "ar";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectedCount = selected.size;
  const canSend = title.trim().length >= 2 && body.trim().length >= 2 && !busy;

  const t = useMemo(() => {
    return {
      composeTitle: ar ? "رسالة جديدة" : "New message",
      titleLabel: ar ? "العنوان" : "Title",
      bodyLabel: ar ? "النص" : "Body",
      urlLabel: ar ? "الرابط (اختياري)" : "URL (optional)",
      iconLabel: ar ? "أيقونة (اختياري)" : "Icon URL (optional)",
      sendAll: ar ? "إرسال للجميع" : "Send to all",
      sendSelected: ar ? "إرسال للمحدد" : "Send to selected",
      subscribersTitle: ar ? "المشتركون" : "Subscribers",
      none: ar ? "لا يوجد مستخدمون مفعلون" : "No active subscribers",
      selectAll: ar ? "تحديد الكل" : "Select all",
      selectedCount: ar ? `المحدد: ${selectedCount}` : `Selected: ${selectedCount}`,
      sent: ar ? "تم الإرسال" : "Sent",
      failed: ar ? "فشل الإرسال" : "Send failed",
    };
  }, [ar, selectedCount]);

  function toggleAll() {
    if (selected.size === subscribers.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(subscribers.map((s) => s.userId)));
  }

  function toggleOne(userId: string) {
    const next = new Set(selected);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelected(next);
  }

  async function send(target: "all" | "selected") {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const payload: any = {
        title: title.trim(),
        body: body.trim(),
      };
      if (url.trim()) payload.url = url.trim();
      if (iconUrl.trim()) payload.iconUrl = iconUrl.trim();
      if (target === "selected") {
        payload.userIds = Array.from(selected);
      }

      const res = await fetch("/api/admin/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as
        | { ok: true; sent: number; failed: number }
        | { ok: false; error: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.ok ? "SEND_FAILED" : json.error);
      }

      setSuccess(`${t.sent}: ${json.sent}${json.failed ? ` • ${t.failed}: ${json.failed}` : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SEND_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="sbc-card p-6">
        <h2 className="text-lg font-semibold mb-4">{t.composeTitle}</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium">{t.titleLabel}</label>
            <div className="mt-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">{t.bodyLabel}</label>
            <div className="mt-2">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">{t.urlLabel}</label>
              <div className="mt-2">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">{t.iconLabel}</label>
              <div className="mt-2">
                <Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" disabled={!canSend} onClick={() => send("all")}
            >
              {t.sendAll}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!canSend || selectedCount === 0}
              onClick={() => send("selected")}
            >
              {t.sendSelected}
            </Button>
            <span className="text-xs text-(--muted-foreground)">{t.selectedCount}</span>
          </div>
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          ) : null}
        </div>
      </div>

      <div className="sbc-card p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">{t.subscribersTitle}</h2>
          {subscribers.length ? (
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {t.selectAll}
            </Button>
          ) : null}
        </div>

        {subscribers.length === 0 ? (
          <div className="text-sm text-(--muted-foreground)">{t.none}</div>
        ) : (
          <div className="grid gap-3">
            {subscribers.map((s) => (
              <label
                key={s.userId}
                className="flex items-start gap-3 rounded-xl border border-(--surface-border) p-4 hover:bg-(--surface)"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.userId)}
                  onChange={() => toggleOne(s.userId)}
                  className="mt-1 h-4 w-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium truncate">{s.fullName}</span>
                    <span className="text-xs text-(--muted-foreground)">{s.email}</span>
                    {s.phone ? <span className="text-xs text-(--muted-foreground)">{s.phone}</span> : null}
                  </div>
                  <div className="mt-1 text-xs text-(--muted-foreground)">
                    {ar ? "الاشتراكات:" : "Subscriptions:"} {s.subscriptionCount} • {ar ? "آخر تحديث:" : "Last updated:"}{" "}
                    {new Date(s.lastUpdatedAt).toLocaleString(ar ? "ar" : "en")}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
