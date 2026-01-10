"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Locale } from "@/lib/i18n/locales";

type ProfileDTO = {
  email: string;
  role: "admin" | "user";
  displayName: string;
  bio: string;
  avatarUrl: string | null;
};

function initials(email: string) {
  const base = email.split("@")[0] || "U";
  return base.slice(0, 1).toUpperCase();
}

export function ProfileClient({
  locale,
  initial,
}: {
  locale: Locale;
  initial: ProfileDTO;
}) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatarUrl);

  const [busy, setBusy] = useState(false);
  const [busyAvatar, setBusyAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const t = useMemo(() => {
    const ar = locale === "ar";
    return {
      title: ar ? "الملف الشخصي" : "Profile",
      subtitle: ar ? "قم بتحديث معلوماتك وصورتك." : "Update your info and avatar.",
      displayName: ar ? "الاسم المعروض" : "Display name",
      bio: ar ? "نبذة" : "Bio",
      save: ar ? "حفظ" : "Save",
      saving: ar ? "جارٍ الحفظ…" : "Saving…",
      changePhoto: ar ? "تغيير الصورة" : "Change photo",
      removePhoto: ar ? "حذف الصورة" : "Remove photo",
      uploading: ar ? "جارٍ الرفع…" : "Uploading…",
      updated: ar ? "تم التحديث" : "Updated",
    };
  }, [locale]);

  async function saveProfile() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch("/api/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      const json = (await res.json()) as
        | { ok: true; profile: ProfileDTO }
        | { ok: false; error: string };
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setDisplayName(json.profile.displayName);
      setBio(json.profile.bio);
      setAvatarUrl(json.profile.avatarUrl);
      setSuccess(t.updated);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "SAVE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function onPickAvatar(files: FileList | null) {
    setError(null);
    setSuccess(null);
    if (!files || files.length === 0) return;

    const file = files[0];

    // optimistic preview
    const nextPreview = URL.createObjectURL(file);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(nextPreview);

    setBusyAvatar(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/users/me/avatar", { method: "POST", body: fd });
      const json = (await res.json()) as
        | { ok: true; avatarUrl: string | null }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setAvatarUrl(json.avatarUrl);
      if (nextPreview) URL.revokeObjectURL(nextPreview);
      setLocalPreview(null);
      setSuccess(t.updated);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPLOAD_FAILED");
    } finally {
      setBusyAvatar(false);
    }
  }

  async function removeAvatar() {
    setError(null);
    setSuccess(null);
    setBusyAvatar(true);
    try {
      const res = await fetch("/api/users/me/avatar", { method: "DELETE" });
      const json = (await res.json()) as
        | { ok: true; avatarUrl: string | null }
        | { ok: false; error: string };
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setAvatarUrl(json.avatarUrl);
      setLocalPreview(null);
      setSuccess(t.updated);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "DELETE_FAILED");
    } finally {
      setBusyAvatar(false);
    }
  }

  const avatarSrc = localPreview ?? avatarUrl;

  return (
    <div className="mt-6 grid gap-6">
      <div className="sbc-card rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <div className="shrink-0">
            <div className="relative h-24 w-24">
              {avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={initial.email}
                  fill
                  className="rounded-full object-cover ring-2 ring-accent/20"
                  sizes="96px"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-linear-to-br from-accent to-accent-2 ring-2 ring-accent/20 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{initials(initial.email)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">{t.title}</h2>
                <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
                <p className="mt-3 text-sm font-medium truncate">{initial.email}</p>
              </div>

              {initial.role === "admin" ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                  Admin
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPickAvatar(e.target.files)}
              />

              <Button
                variant="secondary"
                size="sm"
                disabled={busyAvatar}
                onClick={() => fileRef.current?.click()}
              >
                {busyAvatar ? t.uploading : t.changePhoto}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={busyAvatar || (!avatarUrl && !localPreview)}
                onClick={removeAvatar}
              >
                {t.removePhoto}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="sbc-card rounded-2xl p-6">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium">{t.displayName}</label>
            <div className="mt-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={initial.email.split("@")[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">{t.bio}</label>
            <div className="mt-2">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={locale === "ar" ? "اكتب نبذة قصيرة…" : "Write a short bio…"}
                rows={4}
              />
            </div>
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

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="primary" size="sm" disabled={busy} onClick={saveProfile}>
              {busy ? t.saving : t.save}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
