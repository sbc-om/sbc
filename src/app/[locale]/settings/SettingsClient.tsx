"use client";

import { useEffect, useMemo, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";

type LocalSettings = {
  notificationsEnabled: boolean;
  marketingUpdates: boolean;
  soundsEnabled: boolean;
};

const STORAGE_KEY = "sbc_settings_v1";

const DEFAULT_SETTINGS: LocalSettings = {
  notificationsEnabled: true,
  marketingUpdates: true,
  soundsEnabled: false,
};

function safeParseSettings(raw: string | null): LocalSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalSettings>;
    return {
      notificationsEnabled: Boolean(parsed.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled),
      marketingUpdates: Boolean(parsed.marketingUpdates ?? DEFAULT_SETTINGS.marketingUpdates),
      soundsEnabled: Boolean(parsed.soundsEnabled ?? DEFAULT_SETTINGS.soundsEnabled),
    };
  } catch {
    return null;
  }
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
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
        className="mt-0.5 h-5 w-5 accent-[color:var(--accent)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function SettingsClient({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restored = safeParseSettings(window.localStorage.getItem(STORAGE_KEY));
    if (restored) setSettings(restored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, hydrated]);

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
            ? "هذه الإعدادات محفوظة على هذا الجهاز."
            : "These preferences are saved on this device."}
        </p>

        <div className="mt-4 grid gap-3">
          <ToggleRow
            label={sectionHint.enableNotifications}
            checked={settings.notificationsEnabled}
            onChange={(v) => setSettings((s) => ({ ...s, notificationsEnabled: v }))}
          />
          <ToggleRow
            label={sectionHint.enableMarketing}
            checked={settings.marketingUpdates}
            onChange={(v) => setSettings((s) => ({ ...s, marketingUpdates: v }))}
          />
          <ToggleRow
            label={sectionHint.enableSounds}
            checked={settings.soundsEnabled}
            onChange={(v) => setSettings((s) => ({ ...s, soundsEnabled: v }))}
          />

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSettings(DEFAULT_SETTINGS);
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
              }}
            >
              {sectionHint.reset}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
