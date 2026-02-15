"use client";

import { useEffect, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { UserPushOptIn } from "@/components/push/UserPushOptIn";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
  NOTIFICATION_PREFERENCES_EVENT,
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
  parseNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications/preferences";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-(--surface-border) bg-(--surface) px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-(--muted-foreground)">{description}</span>
        ) : null}
      </span>

      <input
        type="checkbox"
        className="mt-0.5 h-5 w-5 accent-accent"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function SettingsClient({
  locale,
  dict,
  initialNotificationSettings,
}: {
  locale: Locale;
  dict: Dictionary;
  initialNotificationSettings: NotificationPreferences;
}) {
  const [settings, setSettings] = useState<NotificationPreferences>(
    normalizeNotificationPreferences(initialNotificationSettings),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [testNotificationMessage, setTestNotificationMessage] = useState<string | null>(null);

  const persistLocal = (value: NotificationPreferences) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(NOTIFICATION_PREFERENCES_STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFERENCES_EVENT, { detail: value }));
  };

  useEffect(() => {
    persistLocal(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const local = parseNotificationPreferences(
      window.localStorage.getItem(NOTIFICATION_PREFERENCES_STORAGE_KEY),
    );
    if (local) setSettings(local);

    const controller = new AbortController();
    const sync = async () => {
      try {
        const res = await fetch("/api/settings/notifications", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => null)) as
          | { ok: true; settings: NotificationPreferences }
          | { ok: false; error?: string }
          | null;

        if (!res.ok || !data || !data.ok) return;
        const normalized = normalizeNotificationPreferences(data.settings);
        setSettings(normalized);
        persistLocal(normalized);
      } catch {
        // keep local/initial state
      }
    };

    void sync();
    return () => controller.abort();
  }, []);

  const saveSettings = async (next: NotificationPreferences, prev: NotificationPreferences) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    setSettings(next);
    persistLocal(next);

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; settings: NotificationPreferences }
        | { ok: false; error?: string }
        | null;

      if (!res.ok || !data || !data.ok) {
        setSettings(prev);
        persistLocal(prev);
        setSaveError(locale === "ar" ? "تعذر حفظ الإعدادات." : "Could not save notification settings.");
        return;
      }

      const normalized = normalizeNotificationPreferences(data.settings);
      setSettings(normalized);
      persistLocal(normalized);
      setSaveSuccess(locale === "ar" ? "تم حفظ الإعدادات." : "Saved.");
      window.setTimeout(() => setSaveSuccess(null), 1500);
    } catch {
      setSettings(prev);
      persistLocal(prev);
      setSaveError(locale === "ar" ? "تعذر حفظ الإعدادات." : "Could not save notification settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (patch: Partial<NotificationPreferences>) => {
    const prev = settings;
    const next = normalizeNotificationPreferences({ ...settings, ...patch });
    void saveSettings(next, prev);
  };

  const sendTestNotification = async () => {
    setIsTestingNotification(true);
    setTestNotificationMessage(null);
    try {
      const res = await fetch("/api/settings/notifications/test", { method: "POST" });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; pushSent?: number }
        | { ok: false; error?: string }
        | null;

      if (!res.ok || !data || !data.ok) {
        setTestNotificationMessage(
          locale === "ar"
            ? "فشل إرسال إشعار الاختبار. تأكد من تفعيل الإشعارات."
            : "Failed to send test notification. Make sure notifications are enabled.",
        );
        return;
      }

      setTestNotificationMessage(
        locale === "ar"
          ? `تم إرسال إشعار اختبار بنجاح${(data.pushSent ?? 0) > 0 ? ` (${data.pushSent} Push)` : ""}.`
          : `Test notification sent successfully${(data.pushSent ?? 0) > 0 ? ` (${data.pushSent} push)` : ""}.`,
      );
    } catch {
      setTestNotificationMessage(
        locale === "ar" ? "تعذر إرسال إشعار الاختبار." : "Could not send test notification.",
      );
    } finally {
      setIsTestingNotification(false);
    }
  };

  const sectionHint = useMemo(() => {
    // Keep the client component robust if dictionaries are missing keys.
    return {
      language: dict.settings?.language ?? (locale === "ar" ? "اللغة" : "Language"),
      theme: dict.settings?.theme ?? (locale === "ar" ? "المظهر" : "Theme"),
      notifications: dict.settings?.notifications ?? (locale === "ar" ? "الإشعارات" : "Notifications"),
      enableNotifications:
        dict.settings?.enableNotifications ??
        (locale === "ar" ? "تفعيل الإشعارات" : "Enable notifications"),
      enableMarketing:
        dict.settings?.enableMarketing ??
        (locale === "ar" ? "تحديثات ونصائح" : "Product updates & tips"),
      enableSounds:
        dict.settings?.enableSounds ?? (locale === "ar" ? "الأصوات" : "Sounds"),
      reset: dict.settings?.reset ?? (locale === "ar" ? "إعادة الضبط" : "Reset"),
    };
  }, [dict, locale]);

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className="mt-6 grid gap-6">
      <div className="sbc-card rounded-2xl p-6">
        <h2 className="text-base font-semibold">{sectionHint.language}</h2>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {locale === "ar"
            ? "اختر لغة واجهة الموقع."
            : "Choose your interface language."}
        </p>
        <div className="mt-4">
          <LanguageSwitcher locale={locale} />
        </div>
      </div>

      <div className="sbc-card rounded-2xl p-6">
        <h2 className="text-base font-semibold">{sectionHint.theme}</h2>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {locale === "ar" ? "تبديل الوضع الفاتح/الداكن." : "Toggle light/dark mode."}
        </p>
        <div className="mt-4">
          <ThemeToggle locale={locale} />
        </div>
      </div>

      <div className="sbc-card rounded-2xl p-6">
        <h2 className="text-base font-semibold">{sectionHint.notifications}</h2>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {locale === "ar"
            ? "تتم مزامنة هذه التفضيلات مع حسابك وتطبيقها عبر التطبيق بالكامل."
            : "These preferences are synced to your account and applied across the app."}
        </p>

        <div className="mt-4 grid gap-3">
          <ToggleRow
            label={sectionHint.enableNotifications}
            checked={settings.notificationsEnabled}
            description={
              locale === "ar"
                ? "تشمل تنبيهات التفاعلات الفورية داخل التطبيق."
                : "Includes real-time in-app activity alerts."
            }
            disabled={isSaving}
            onChange={(v) => updateSetting({ notificationsEnabled: v })}
          />
          <ToggleRow
            label={sectionHint.enableMarketing}
            checked={settings.marketingUpdates}
            description={
              locale === "ar"
                ? "الرسائل العامة والعروض من المنصة عبر Push."
                : "Platform-wide updates and announcements via push."
            }
            disabled={isSaving}
            onChange={(v) => updateSetting({ marketingUpdates: v })}
          />
          <ToggleRow
            label={sectionHint.enableSounds}
            checked={settings.soundsEnabled}
            description={
              locale === "ar"
                ? "تشغيل صوت عند وصول إشعار جديد."
                : "Play a sound when a new notification arrives."
            }
            disabled={isSaving}
            onChange={(v) => updateSetting({ soundsEnabled: v })}
          />

          {saveError ? (
            <p className="text-xs text-red-500">{saveError}</p>
          ) : saveSuccess ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{saveSuccess}</p>
          ) : null}

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={() => {
                void saveSettings(DEFAULT_NOTIFICATION_PREFERENCES, settings);
              }}
            >
              {sectionHint.reset}
            </Button>
          </div>

          <div className="pt-1">
            <Button
              variant="primary"
              size="sm"
              disabled={isTestingNotification || !settings.notificationsEnabled}
              onClick={() => {
                void sendTestNotification();
              }}
            >
              {isTestingNotification
                ? locale === "ar"
                  ? "جاري الإرسال..."
                  : "Sending..."
                : locale === "ar"
                ? "إرسال إشعار تجريبي"
                : "Send test notification"}
            </Button>
            {testNotificationMessage ? (
              <p className="mt-2 text-xs text-(--muted-foreground)">{testNotificationMessage}</p>
            ) : null}
          </div>

          <div className="pt-2">
            <UserPushOptIn dir={dir} />
          </div>
        </div>
      </div>
    </div>
  );
}
