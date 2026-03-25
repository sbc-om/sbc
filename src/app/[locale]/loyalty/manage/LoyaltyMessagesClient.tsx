"use client";

import { useMemo, useState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";

type MessageDTO = {
  id: string;
  userId: string;
  customerId?: string;
  title: string;
  body: string;
  createdAt: string;
};

export function LoyaltyMessagesClient({ locale }: { locale: Locale }) {
  const rtl = localeDir(locale) === "rtl";
  const ar = locale === "ar";

  const t = useMemo(() => {
    return {
      title: ar ? "رسائل للعملاء" : "Messages to customers",
      subtitle: ar
        ? "أرسل رسالة لكل العملاء أو لعميل محدد (ستظهر على صفحة البطاقة، ويمكن ربطها لاحقاً بإشعارات Wallet)."
        : "Send a message to all customers or a specific customer (shown on the card page; can be wired to Wallet notifications later).",
      modeAll: ar ? "إرسال للجميع" : "Send to all",
      modeOne: ar ? "إرسال لعميل" : "Send to one customer",
      customerId: ar ? "معرّف العميل أو Member ID" : "Customer ID or Member ID",
      customerIdHint: ar
        ? "يمكن نسخه من صفحة إدارة العملاء (Customer ID) أو استخدام Member ID مثل SPH01."
        : "Use internal Customer ID from Customers page, or a Member ID like SPH01.",
      titleLabel: ar ? "العنوان" : "Title",
      bodyLabel: ar ? "النص" : "Message",
      send: ar ? "إرسال" : "Send",
      sending: ar ? "جارٍ الإرسال…" : "Sending…",
      sent: ar ? "تم الإرسال" : "Sent",
      customerRequired: ar ? "أدخل Customer ID أو Member ID." : "Enter Customer ID or Member ID.",
      titleRequired: ar ? "العنوان يجب أن يكون حرفين على الأقل." : "Title must be at least 2 characters.",
      bodyRequired: ar ? "نص الرسالة يجب أن يكون حرفين على الأقل." : "Message body must be at least 2 characters.",
    };
  }, [ar]);

  const [mode, setMode] = useState<"all" | "one">("all");
  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function send() {
    setError(null);
    setSuccess(null);

    const target = customerId.trim();
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (mode === "one" && !target) {
      setError(t.customerRequired);
      return;
    }
    if (trimmedTitle.length < 2) {
      setError(t.titleRequired);
      return;
    }
    if (trimmedBody.length < 2) {
      setError(t.bodyRequired);
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/loyalty/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: mode === "one" ? target : undefined,
          title: trimmedTitle,
          body: trimmedBody,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | { ok: true; message: MessageDTO }
        | { ok: false; error: string };

      if (!res.ok) {
        const apiError = json && !json.ok ? json.error : null;
        throw new Error(apiError || `HTTP_${res.status}`);
      }
      if (!json.ok) throw new Error(json.error);

      setSuccess(t.sent);
      setTitle("");
      setBody("");
      if (mode === "one") setCustomerId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "SEND_FAILED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 sm:mt-8 sbc-card rounded-2xl p-4 sm:p-6">
      <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4", rtl ? "sm:flex-row-reverse" : "")}>
        <div className={cn(rtl ? "text-right" : "text-left")}>
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
        </div>
        <Button type="button" variant="primary" size="md" disabled={busy} onClick={send}>
          {busy ? t.sending : t.send}
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">
          {success}
        </div>
      ) : null}

      <div className={cn("mt-5 grid gap-4", rtl ? "text-right" : "text-left")}>
        <div className={cn("flex items-center gap-3", rtl ? "flex-row-reverse" : "")}>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="msgMode"
              checked={mode === "all"}
              onChange={() => setMode("all")}
              disabled={busy}
            />
            <span className="text-sm">{t.modeAll}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="msgMode"
              checked={mode === "one"}
              onChange={() => setMode("one")}
              disabled={busy}
            />
            <span className="text-sm">{t.modeOne}</span>
          </label>
        </div>

        {mode === "one" ? (
          <div>
            <div className="text-sm font-medium">{t.customerId}</div>
            <div className="mt-1">
              <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} disabled={busy} dir="ltr" />
            </div>
            <div className="mt-1 text-xs text-(--muted-foreground)">{t.customerIdHint}</div>
          </div>
        ) : null}

        <div>
          <div className="text-sm font-medium">{t.titleLabel}</div>
          <div className="mt-1">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} />
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">{t.bodyLabel}</div>
          <div className="mt-1">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} disabled={busy} rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
