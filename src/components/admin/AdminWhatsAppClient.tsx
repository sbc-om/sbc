"use client";

import { useMemo, useState, useRef } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import type { Locale } from "@/lib/i18n/locales";

export type WhatsAppUser = {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
};

export function AdminWhatsAppClient({
  locale,
  users,
  enabled,
}: {
  locale: Locale;
  users: WhatsAppUser[];
  enabled: boolean;
}) {
  const ar = locale === "ar";
  const [messageType, setMessageType] = useState<"text" | "image">("text");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const selectedCount = selected.size;
  const canSendText = messageType === "text" && message.trim().length >= 2 && !busy;
  const canSendImage = messageType === "image" && imageUrl.trim().length > 0 && !busy;
  const canSend = (canSendText || canSendImage) && selectedCount > 0;

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
    );
  }, [users, search]);

  const t = useMemo(() => {
    return {
      title: ar ? "إرسال رسالة واتساب" : "Send WhatsApp Message",
      subtitle: ar ? "إرسال رسالة نصية أو صورة لمستخدمين محددين" : "Send text or image message to selected users",
      notEnabled: ar ? "واتساب غير مفعّل. تحقق من إعدادات WAHA." : "WhatsApp is not enabled. Check WAHA settings.",
      textTab: ar ? "رسالة نصية" : "Text Message",
      imageTab: ar ? "صورة" : "Image",
      messageLabel: ar ? "نص الرسالة" : "Message text",
      messagePlaceholder: ar ? "اكتب رسالتك هنا..." : "Type your message here...",
      imageUrlLabel: ar ? "رابط الصورة" : "Image URL",
      imageUrlPlaceholder: ar ? "https://example.com/image.jpg" : "https://example.com/image.jpg",
      captionLabel: ar ? "نص مرافق (اختياري)" : "Caption (optional)",
      captionPlaceholder: ar ? "نص مرافق للصورة..." : "Caption for the image...",
      usersTitle: ar ? "المستخدمون" : "Users",
      none: ar ? "لا يوجد مستخدمون مع رقم هاتف" : "No users with phone number",
      selectAll: ar ? "تحديد الكل" : "Select all",
      deselectAll: ar ? "إلغاء التحديد" : "Deselect all",
      selectedCount: ar ? `المحدد: ${selectedCount}` : `Selected: ${selectedCount}`,
      send: ar ? "إرسال" : "Send",
      sending: ar ? "جاري الإرسال..." : "Sending...",
      sent: ar ? "تم الإرسال" : "Sent",
      failed: ar ? "فشل" : "Failed",
      searchPlaceholder: ar ? "بحث عن مستخدم..." : "Search users...",
      preview: ar ? "معاينة الصورة" : "Image Preview",
    };
  }, [ar, selectedCount]);

  function toggleAll() {
    if (selected.size === filteredUsers.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filteredUsers.map((u) => u.userId)));
  }

  function toggleOne(userId: string) {
    const next = new Set(selected);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setSelected(next);
  }

  async function send() {
    setError(null);
    setSuccess(null);
    setBusy(true);

    try {
      const payload: Record<string, unknown> = {
        userIds: Array.from(selected),
      };

      if (messageType === "text") {
        payload.message = message.trim();
      } else {
        payload.imageUrl = imageUrl.trim();
        if (caption.trim()) {
          payload.caption = caption.trim();
        }
      }

      const res = await fetch("/api/admin/whatsapp/broadcast", {
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
      // Clear form on success
      if (messageType === "text") {
        setMessage("");
      } else {
        setImageUrl("");
        setCaption("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "SEND_FAILED");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) {
    return (
      <div className="sbc-card p-6">
        <div className="flex items-center gap-3 text-amber-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{t.notEnabled}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Compose Section */}
      <div className="sbc-card p-6">
        <h2 className="text-lg font-semibold mb-2">{t.title}</h2>
        <p className="text-sm text-(--muted-foreground) mb-4">{t.subtitle}</p>

        {/* Message Type Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMessageType("text")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              messageType === "text"
                ? "bg-green-600 text-white"
                : "bg-(--surface) text-(--muted-foreground) hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageIcon className="h-4 w-4" />
              {t.textTab}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMessageType("image")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              messageType === "image"
                ? "bg-green-600 text-white"
                : "bg-(--surface) text-(--muted-foreground) hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {t.imageTab}
            </span>
          </button>
        </div>

        {/* Text Message Form */}
        {messageType === "text" && (
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium">{t.messageLabel}</label>
              <div className="mt-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder={t.messagePlaceholder}
                  maxLength={4096}
                />
              </div>
              <div className="mt-1 text-xs text-(--muted-foreground) text-end">
                {message.length} / 4096
              </div>
            </div>
          </div>
        )}

        {/* Image Message Form */}
        {messageType === "image" && (
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium">{t.imageUrlLabel}</label>
              <div className="mt-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={t.imageUrlPlaceholder}
                  type="url"
                />
              </div>
            </div>

            {/* Image Preview */}
            {imageUrl && (
              <div className="rounded-xl border border-(--surface-border) p-4">
                <p className="text-sm font-medium mb-2">{t.preview}</p>
                <div className="relative aspect-video max-w-sm rounded-lg overflow-hidden bg-(--surface)">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium">{t.captionLabel}</label>
              <div className="mt-2">
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder={t.captionPlaceholder}
                  maxLength={1024}
                />
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Button
            variant="primary"
            size="md"
            disabled={!canSend}
            onClick={send}
            className="bg-green-600 hover:bg-green-700"
          >
            <WhatsAppIcon className="h-4 w-4 me-2" />
            {busy ? t.sending : t.send}
          </Button>
          <span className="text-sm text-(--muted-foreground)">{t.selectedCount}</span>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            {success}
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="sbc-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">{t.usersTitle}</h2>
          <div className="flex items-center gap-2">
            {filteredUsers.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selected.size === filteredUsers.length ? t.deselectAll : t.selectAll}
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="max-w-sm"
          />
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-sm text-(--muted-foreground)">{t.none}</div>
        ) : (
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((u) => (
              <label
                key={u.userId}
                className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                  selected.has(u.userId)
                    ? "border-green-500 bg-green-500/10"
                    : "border-(--surface-border) hover:bg-(--surface)"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(u.userId)}
                  onChange={() => toggleOne(u.userId)}
                  className="h-4 w-4 accent-green-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium truncate">{u.fullName}</span>
                    <span className="text-xs text-(--muted-foreground)">{u.email}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-green-600 font-mono" dir="ltr">
                    {u.phone}
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
