"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

import { getCategoryIconComponent } from "@/lib/icons/categoryIcons";
import { Button } from "@/components/ui/Button";

export function BusinessAvatarSettings({
  locale,
  businessId,
  businessName,
  initialAvatarMode,
  initialLogoUrl,
  categoryIconId,
}: {
  locale: "en" | "ar";
  businessId: string;
  businessName: string;
  initialAvatarMode: "icon" | "logo";
  initialLogoUrl?: string;
  categoryIconId?: string;
}) {
  const ar = locale === "ar";

  const [avatarMode, setAvatarMode] = useState<"icon" | "logo">(initialAvatarMode);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(initialLogoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const Icon = useMemo(() => getCategoryIconComponent(categoryIconId), [categoryIconId]);

  async function persistMode(next: "icon" | "logo") {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/avatar-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarMode: next }),
      });
      const json = (await res.json()) as
        | { ok: true; avatarMode: "icon" | "logo" }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);
      setAvatarMode(json.avatarMode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SAVE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function uploadLogo(file: File) {
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("kind", "logo");
      fd.append("file", file);

      const res = await fetch(`/api/businesses/${businessId}/media`, {
        method: "POST",
        body: fd,
      });

      const json = (await res.json()) as
        | { ok: true; urls: string[]; media: { logo?: string } }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      const url = json.media?.logo ?? json.urls?.[0];
      if (url) setLogoUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPLOAD_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function removeLogo() {
    if (!logoUrl) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/businesses/${businessId}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "logo", url: logoUrl }),
      });

      const json = (await res.json()) as
        | { ok: true; media: { logo?: string } }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);
      setLogoUrl(undefined);

      // If user was using logo, fall back to icon.
      if (avatarMode === "logo") await persistMode("icon");
    } catch (e) {
      setError(e instanceof Error ? e.message : "DELETE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  const canUseLogo = !!logoUrl;

  return (
    <section className="mt-6 sbc-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold">{ar ? "صورة الملف" : "Profile image"}</h2>
      <p className="mt-1 text-sm text-(--muted-foreground)">
        {ar
          ? "الافتراضي هو أيقونة التصنيف. يمكنك رفع شعار واستخدامه بدل الأيقونة." 
          : "Default is the category icon. You can upload a logo and use it instead."}
      </p>

      <div className="mt-5 flex items-center gap-4">
        <div className="h-18 w-18 rounded-2xl border border-(--surface-border) bg-(--chip-bg) overflow-hidden flex items-center justify-center relative">
          {avatarMode === "logo" && logoUrl ? (
            <Image src={logoUrl} alt={businessName} fill sizes="72px" className="object-cover" />
          ) : (
            <Icon className="h-8 w-8 text-(--muted-foreground)" />
          )}
        </div>

        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={avatarMode === "icon"} onChange={() => void persistMode("icon")} disabled={busy} />
            {ar ? "استخدم أيقونة التصنيف" : "Use category icon"}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={avatarMode === "logo"}
              onChange={() => void persistMode("logo")}
              disabled={busy || !canUseLogo}
            />
            {ar ? "استخدم الشعار" : "Use logo"}
            {!canUseLogo ? (
              <span className="text-xs text-(--muted-foreground)">{ar ? "(ارفع شعار أولاً)" : "(upload a logo first)"}</span>
            ) : null}
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadLogo(f);
              e.currentTarget.value = "";
            }}
          />

          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {ar ? "رفع شعار" : "Upload logo"}
          </Button>

          {logoUrl ? (
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void removeLogo()}>
              {ar ? "حذف الشعار" : "Remove logo"}
            </Button>
          ) : null}
        </div>

        {logoUrl ? (
          <div className="text-xs text-(--muted-foreground)">
            {ar ? "الشعار الحالي:" : "Current logo:"} <span className="font-mono break-all">{logoUrl}</span>
          </div>
        ) : null}

        {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
      </div>
    </section>
  );
}
