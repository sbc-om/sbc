"use client";

import Image from "next/image";
import React, { useMemo, useRef, useState } from "react";

import type { Locale } from "@/lib/i18n/locales";
import { localeDir } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { LoyaltyPointsIcons } from "@/components/loyalty/LoyaltyPointsIcons";

type LoyaltySettingsDTO = {
  userId: string;
  pointsRequiredPerRedemption: number;
  pointsDeductPerRedemption: number;
  pointsIconMode: "logo" | "custom";
  pointsIconUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type LoyaltyProfileDTO = {
  businessName: string;
  logoUrl?: string;
  joinCode: string;
};

export function LoyaltySettingsClient({
  locale,
  initialSettings,
  profile,
}: {
  locale: Locale;
  initialSettings: LoyaltySettingsDTO;
  profile: LoyaltyProfileDTO | null;
}) {
  const rtl = localeDir(locale) === "rtl";
  const ar = locale === "ar";

  const t = useMemo(() => {
    return {
      title: ar ? "إعدادات النقاط" : "Points settings",
      subtitle: ar
        ? "حدد قواعد استخدام النقاط وكيفية عرضها للعميل."
        : "Configure redemption rules and how points are rendered for customers.",
      required: ar ? "الحد الأدنى للاستخدام" : "Min points to redeem",
      deduct: ar ? "خصم عند الاستخدام" : "Deduct per redemption",
      save: ar ? "حفظ" : "Save",
      saved: ar ? "تم الحفظ" : "Saved",
      iconTitle: ar ? "أيقونة النقاط" : "Points icon",
      useLogo: ar ? "استخدم شعار النشاط" : "Use business logo",
      useCustom: ar ? "أيقونة مخصصة" : "Custom icon",
      upload: ar ? "رفع" : "Upload",
      remove: ar ? "حذف" : "Remove",
      preview: ar ? "معاينة" : "Preview",
      redeemHint: ar
        ? "مثال: إذا كان الحد الأدنى 10 والخصم 10، يمكن للموظف استبدال كل 10 نقاط مرة واحدة."
        : "Example: if min=10 and deduct=10, staff can redeem one reward per 10 points.",
    };
  }, [ar]);

  const [settings, setSettings] = useState<LoyaltySettingsDTO>(initialSettings);
  const [required, setRequired] = useState(String(initialSettings.pointsRequiredPerRedemption));
  const [deduct, setDeduct] = useState(String(initialSettings.pointsDeductPerRedemption));
  const [busy, setBusy] = useState(false);
  const [busyIcon, setBusyIcon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const effectiveIconUrl =
    settings.pointsIconMode === "custom" ? settings.pointsIconUrl : profile?.logoUrl;

  async function save() {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const pr = Math.max(1, Math.trunc(Number(required)));
      const pd = Math.max(1, Math.trunc(Number(deduct)));

      const res = await fetch("/api/loyalty/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointsRequiredPerRedemption: pr,
          pointsDeductPerRedemption: pd,
        }),
      });

      const json = (await res.json()) as
        | { ok: true; settings: LoyaltySettingsDTO }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setSettings(json.settings);
      setRequired(String(json.settings.pointsRequiredPerRedemption));
      setDeduct(String(json.settings.pointsDeductPerRedemption));
      setSuccess(t.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPDATE_FAILED");
    } finally {
      setBusy(false);
    }
  }

  async function setIconMode(mode: "logo" | "custom") {
    setBusyIcon(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/loyalty/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsIconMode: mode }),
      });

      const json = (await res.json()) as
        | { ok: true; settings: LoyaltySettingsDTO }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setSettings(json.settings);
      setSuccess(t.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPDATE_FAILED");
    } finally {
      setBusyIcon(false);
    }
  }

  async function uploadIcon(file: File) {
    setBusyIcon(true);
    setError(null);
    setSuccess(null);

    try {
      const fd = new FormData();
      fd.set("file", file);

      const res = await fetch("/api/loyalty/settings/icon", {
        method: "POST",
        body: fd,
      });

      const json = (await res.json()) as
        | { ok: true; settings: LoyaltySettingsDTO }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setSettings(json.settings);
      setSuccess(t.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "UPLOAD_FAILED");
    } finally {
      setBusyIcon(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeIcon() {
    setBusyIcon(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/loyalty/settings/icon", { method: "DELETE" });
      const json = (await res.json()) as
        | { ok: true; settings: LoyaltySettingsDTO }
        | { ok: false; error: string };

      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      if (!json.ok) throw new Error(json.error);

      setSettings(json.settings);
      setSuccess(t.saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "DELETE_FAILED");
    } finally {
      setBusyIcon(false);
    }
  }

  return (
    <div className="mt-8 sbc-card rounded-2xl p-6">
      <div className={cn("flex items-start justify-between gap-4", rtl ? "flex-row-reverse" : "")}
      >
        <div className={cn(rtl ? "text-right" : "text-left")}>
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
        </div>
        <Button type="button" variant="primary" size="md" disabled={busy} onClick={save}>
          {busy ? (ar ? "جارٍ الحفظ…" : "Saving…") : t.save}
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

      <div className={cn("mt-5 grid gap-3 sm:grid-cols-2", rtl ? "text-right" : "text-left")}>
        <div>
          <div className="text-sm font-medium">{t.required}</div>
          <div className="mt-1">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={required}
              onChange={(e) => setRequired(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <div>
          <div className="text-sm font-medium">{t.deduct}</div>
          <div className="mt-1">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={deduct}
              onChange={(e) => setDeduct(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
      </div>

      <p className={cn("mt-3 text-xs text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
        {t.redeemHint}
      </p>

      <div className="mt-6 rounded-2xl border border-(--surface-border) bg-(--surface) p-5">
        <div className={cn("flex items-start justify-between gap-4", rtl ? "flex-row-reverse" : "")}
        >
          <div className={cn(rtl ? "text-right" : "text-left")}>
            <div className="text-sm font-semibold">{t.iconTitle}</div>
            <div className="mt-1 text-xs text-(--muted-foreground)">
              {ar
                ? "يمكن عرض النقاط على بطاقة العميل كأيقونات (الشعار أو أيقونة مخصصة)."
                : "Points can be shown as icons on the customer card (logo or custom)."}
            </div>
          </div>
          <div className={cn("flex items-center gap-2", rtl ? "flex-row-reverse" : "")}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadIcon(f);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busyIcon}
              onClick={() => fileRef.current?.click()}
            >
              {t.upload}
            </Button>
            {settings.pointsIconMode === "custom" && settings.pointsIconUrl ? (
              <Button type="button" variant="ghost" size="sm" disabled={busyIcon} onClick={removeIcon}>
                {t.remove}
              </Button>
            ) : null}
          </div>
        </div>

        <div className={cn("mt-4 grid gap-3 sm:grid-cols-2", rtl ? "text-right" : "text-left")}>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="pointsIconMode"
              checked={settings.pointsIconMode === "logo"}
              onChange={() => void setIconMode("logo")}
              disabled={busyIcon}
            />
            <span className="text-sm">{t.useLogo}</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="pointsIconMode"
              checked={settings.pointsIconMode === "custom"}
              onChange={() => void setIconMode("custom")}
              disabled={busyIcon}
            />
            <span className="text-sm">{t.useCustom}</span>
          </label>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className={cn("flex items-center justify-center", rtl ? "sm:justify-end" : "sm:justify-start")}>
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-(--surface-border) bg-(--surface)">
              {effectiveIconUrl ? (
                <Image src={effectiveIconUrl} alt="Icon" fill className="object-cover" />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(14,165,233,0.22))",
                  }}
                />
              )}
            </div>
          </div>

          <div className={cn(rtl ? "text-right" : "text-left")}>
            <div className="text-xs font-medium text-(--muted-foreground)">{t.preview}</div>
            <div className="mt-2">
              <LoyaltyPointsIcons points={12} iconUrl={effectiveIconUrl} className={cn(rtl ? "justify-end" : "justify-start")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
