"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import React, { useMemo, useRef, useState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { OsmLocationValue } from "@/components/maps/OsmLocationPicker";

const OsmLocationPicker = dynamic(
  () => import("@/components/maps/OsmLocationPicker").then((mod) => ({ default: mod.OsmLocationPicker })),
  { ssr: false }
);

type LoyaltyProfileDTO = {
  userId: string;
  businessName: string;
  logoUrl?: string;
  joinCode: string;
  location?: {
    lat: number;
    lng: number;
    radiusMeters: number;
    label?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export function LoyaltyProfileClient({
  locale,
  initialProfile,
  baseUrl,
}: {
  locale: Locale;
  initialProfile: LoyaltyProfileDTO | null;
  baseUrl: string | null;
}) {
  const rtl = localeDir(locale) === "rtl";
  const ar = locale === "ar";

  const [businessName, setBusinessName] = useState(initialProfile?.businessName ?? "");
  const [joinCode, setJoinCode] = useState(initialProfile?.joinCode ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initialProfile?.logoUrl ?? null);
  const [location, setLocation] = useState<OsmLocationValue | null>(initialProfile?.location ?? null);

  const [busy, setBusy] = useState(false);
  const [busyLogo, setBusyLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const t = useMemo(() => {
    return {
      title: ar ? "بيانات النشاط + QR" : "Business info + QR",
      subtitle: ar
        ? "أدخل اسم نشاطك، شعارك، وكود الانضمام. يمكن للعميل مسح QR للتسجيل."
        : "Enter your business name, logo, and join code. Customers scan the QR to register.",
      businessName: ar ? "اسم النشاط" : "Business name",
      joinCode: ar ? "كود الانضمام" : "Join code",
      joinCodeHint: ar
        ? "أحرف/أرقام فقط (4-16). اتركه فارغاً لتوليده تلقائياً."
        : "Letters/numbers only (4–16). Leave empty to auto-generate.",
      logo: ar ? "شعار النشاط" : "Business logo",
      locationTitle: ar ? "موقع النشاط" : "Business location",
      locationHint: ar
        ? "اختر الموقع الدقيق وحدد نطاق الإشعار (يستخدمه Wallet للتنبيه حسب الموقع)."
        : "Pick the exact location and set the notification range (used by Wallet location alerts).",
      changeLogo: ar ? "رفع شعار" : "Upload logo",
      removeLogo: ar ? "حذف الشعار" : "Remove logo",
      save: ar ? "حفظ" : "Save",
      saving: ar ? "جارٍ الحفظ…" : "Saving…",
      saved: ar ? "تم الحفظ" : "Saved",
      link: ar ? "رابط الانضمام" : "Join link",
      copy: ar ? "نسخ" : "Copy",
      copied: ar ? "تم النسخ" : "Copied",
      downloadQr: ar ? "تحميل QR" : "Download QR",
      downloadQrHint: ar ? "PNG" : "PNG",
      qr: ar ? "QR Code" : "QR Code",
      note: ar
        ? "اطبع QR وضعه في المتجر/الكاشير."
        : "Print the QR and place it at the counter / on the receipt.",
      noQr: ar ? "لا يوجد QR بعد." : "No QR yet.",
      saveToGenerate: ar
        ? "احفظ البيانات أولاً لإنشاء رابط الانضمام."
        : "Save first to generate a join link.",
    };
  }, [ar]);

  const joinUrl = useMemo(() => {
    if (!joinCode) return null;
    if (!baseUrl) return null;
    return `${baseUrl}/${locale}/loyalty/join/${joinCode}`;
  }, [joinCode, locale, baseUrl]);

  React.useEffect(() => {
    let cancelled = false;

    async function gen() {
      if (!joinUrl) {
        setQrDataUrl(null);
        return;
      }
      try {
        const mod = await import("qrcode");
        const url = await mod.toDataURL(joinUrl, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    }

    void gen();
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  async function save() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch("/api/loyalty/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          joinCode: joinCode || undefined,
          logoUrl: logoUrl || undefined,
          location: location ?? undefined,
        }),
      });

      const json = (await res.json()) as
        | { ok: true; profile: LoyaltyProfileDTO }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setBusinessName(json.profile.businessName);
      setJoinCode(json.profile.joinCode);
      setLogoUrl(json.profile.logoUrl ?? null);
      setLocation(json.profile.location ?? null);
      setSuccess(t.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "SAVE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function uploadLogo(files: FileList | null) {
    setError(null);
    setSuccess(null);
    if (!files || files.length === 0) return;

    setBusyLogo(true);
    try {
      const fd = new FormData();
      fd.set("file", files[0]);
      const res = await fetch("/api/loyalty/profile/logo", { method: "POST", body: fd });
      const json = (await res.json()) as
        | { ok: true; logoUrl: string | null; profile: LoyaltyProfileDTO }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setLogoUrl(json.logoUrl);
      setBusinessName(json.profile.businessName);
      setJoinCode(json.profile.joinCode);
      setSuccess(t.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPLOAD_FAILED");
    } finally {
      setBusyLogo(false);
    }
  }

  async function removeLogo() {
    setError(null);
    setSuccess(null);
    setBusyLogo(true);
    try {
      const res = await fetch("/api/loyalty/profile/logo", { method: "DELETE" });
      const json = (await res.json()) as
        | { ok: true; logoUrl: null; profile: LoyaltyProfileDTO | null }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setLogoUrl(null);
      if (json.profile) {
        setBusinessName(json.profile.businessName);
        setJoinCode(json.profile.joinCode);
      }
      setSuccess(t.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "DELETE_FAILED");
    } finally {
      setBusyLogo(false);
    }
  }

  async function copyLink() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setSuccess(t.copied);
    } catch {
      // ignore
    }
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `loyalty-join-${(joinCode || "QR").toUpperCase()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <section className="mt-8 mx-auto max-w-6xl">
      <div className="sbc-card rounded-2xl p-6 sm:p-8">
        <div className={cn("flex flex-col gap-1", rtl ? "text-right" : "text-left")}>
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <p className="text-sm text-(--muted-foreground)">{t.subtitle}</p>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] xl:gap-8 xl:items-start">
          <div className="min-w-0 grid gap-4">
            <div>
              <label className={cn("block text-sm font-medium", rtl ? "text-right" : "text-left")}>
                {t.businessName}
              </label>
              <div className="mt-2">
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={ar ? "مثال: مقهى SBC" : "Example: SBC Cafe"}
                />
              </div>
            </div>

            <div>
              <label className={cn("block text-sm font-medium", rtl ? "text-right" : "text-left")}>
                {t.joinCode}
              </label>
              <div className="mt-2">
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={ar ? "مثال: SBC2026" : "Example: SBC2026"}
                />
              </div>
              <div className={cn("mt-1 text-xs text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
                {t.joinCodeHint}
              </div>
            </div>

            <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
              <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", rtl ? "sm:flex-row-reverse" : "")}> 
                <div className={cn("min-w-0", rtl ? "text-right" : "text-left")}>
                  <div className="text-sm font-medium">{t.logo}</div>
                  <div className="text-xs text-(--muted-foreground)">
                    {ar ? "PNG/JPG/WebP/GIF حتى 10MB" : "PNG/JPG/WebP/GIF up to 10MB"}
                  </div>
                </div>
                <div className={cn("flex items-center gap-2", rtl ? "justify-start" : "justify-end")}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => uploadLogo(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busyLogo}
                    onClick={() => fileRef.current?.click()}
                  >
                    {busyLogo ? (ar ? "…" : "…") : t.changeLogo}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busyLogo || !logoUrl}
                    onClick={removeLogo}
                  >
                    {t.removeLogo}
                  </Button>
                </div>
              </div>

              {logoUrl ? (
                <div className={cn("mt-4 flex items-center gap-3", rtl ? "flex-row-reverse" : "")}> 
                  <Image
                    src={logoUrl}
                    alt={businessName || "logo"}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-xl border border-(--surface-border) bg-(--surface) object-cover"
                  />
                </div>
              ) : (
                <div className={cn("mt-4 text-sm text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
                  {ar ? "لا يوجد شعار بعد." : "No logo yet."}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
              <div className={cn("flex flex-col gap-1", rtl ? "text-right" : "text-left")}>
                <div className="text-sm font-medium">{t.locationTitle}</div>
                <div className="text-xs text-(--muted-foreground)">{t.locationHint}</div>
              </div>

              <div className="mt-4">
                <OsmLocationPicker
                  locale={ar ? "ar" : "en"}
                  value={location}
                  onChange={setLocation}
                  disabled={busy}
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                {success}
              </div>
            ) : null}

            <div className={cn("flex", rtl ? "justify-start" : "justify-end")}>
              <Button type="button" variant="primary" size="md" disabled={busy} onClick={save}>
                {busy ? t.saving : t.save}
              </Button>
            </div>
          </div>

          <div className="min-w-0 grid gap-4">
            <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
              <div className={cn("flex items-center justify-between gap-3", rtl ? "flex-row-reverse" : "")}>
                <div className={cn("min-w-0", rtl ? "text-right" : "text-left")}>
                  <div className="text-sm font-medium">{t.link}</div>
                  <div className="mt-1 text-xs text-(--muted-foreground)">
                    {ar ? "انسخ الرابط وشاركه مع العملاء." : "Copy and share this link with customers."}
                  </div>
                </div>
                <Button type="button" variant="secondary" size="sm" disabled={!joinUrl} onClick={copyLink}>
                  {t.copy}
                </Button>
              </div>

              {joinUrl ? (
                <div className="mt-3">
                  <Input value={joinUrl} readOnly dir="ltr" />
                </div>
              ) : (
                <div className={cn("mt-3 text-sm text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
                  {t.saveToGenerate}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
              <div className={cn("flex items-start justify-between gap-3", rtl ? "flex-row-reverse" : "")}>
                <div className={cn("min-w-0", rtl ? "text-right" : "text-left")}>
                  <div className="text-sm font-medium">{t.qr}</div>
                  <div className="mt-1 text-xs text-(--muted-foreground)">
                    {businessName ? businessName : (ar ? "—" : "—")}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!qrDataUrl}
                  onClick={downloadQr}
                >
                  {t.downloadQr} <span className="opacity-70">{t.downloadQrHint}</span>
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-center">
                {qrDataUrl ? (
                  <div className="h-56 w-56 max-w-full rounded-2xl border border-(--surface-border) bg-white p-2 sm:h-64 sm:w-64">
                    <Image
                      src={qrDataUrl}
                      alt="QR"
                      width={224}
                      height={224}
                      unoptimized
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="flex h-56 w-56 max-w-full items-center justify-center rounded-2xl border border-(--surface-border) bg-(--surface) text-sm text-(--muted-foreground) sm:h-64 sm:w-64">
                    {t.noQr}
                  </div>
                )}
              </div>

              <div className={cn("mt-3 text-xs text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
                {t.note}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
