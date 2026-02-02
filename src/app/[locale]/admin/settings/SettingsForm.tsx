"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";

interface SettingsFormProps {
  locale: Locale;
  initialSettings: Record<string, any>;
  wahaConfigured: boolean;
}

const texts = {
  en: {
    whatsappSection: "WhatsApp Authentication",
    whatsappDescription: "Configure WhatsApp-based authentication options",
    notConfigured: "WhatsApp (WAHA) is not configured. Add WAHA_API_URL, WAHA_API_KEY, and WAHA_ENABLED=true to your .env file.",
    loginEnabled: "Enable WhatsApp Login",
    loginEnabledDesc: "Allow users to login with OTP sent via WhatsApp",
    verificationRequired: "Require Phone Verification on Registration",
    verificationRequiredDesc: "New users must verify their phone number via WhatsApp OTP before completing registration",
    loginNotification: "Send Login Notifications",
    loginNotificationDesc: "Send WhatsApp message when user logs in via OTP",
    save: "Save Settings",
    saving: "Saving...",
    saved: "Settings saved successfully",
    error: "Failed to save settings",
  },
  ar: {
    whatsappSection: "المصادقة عبر واتساب",
    whatsappDescription: "إعداد خيارات المصادقة عبر واتساب",
    notConfigured: "واتساب (WAHA) غير مُعد. أضف WAHA_API_URL و WAHA_API_KEY و WAHA_ENABLED=true إلى ملف .env",
    loginEnabled: "تفعيل تسجيل الدخول بواتساب",
    loginEnabledDesc: "السماح للمستخدمين بتسجيل الدخول برمز OTP عبر واتساب",
    verificationRequired: "طلب التحقق من الهاتف عند التسجيل",
    verificationRequiredDesc: "يجب على المستخدمين الجدد التحقق من رقم هاتفهم عبر واتساب قبل إتمام التسجيل",
    loginNotification: "إرسال إشعارات تسجيل الدخول",
    loginNotificationDesc: "إرسال رسالة واتساب عند تسجيل دخول المستخدم",
    save: "حفظ الإعدادات",
    saving: "جاري الحفظ...",
    saved: "تم حفظ الإعدادات بنجاح",
    error: "فشل في حفظ الإعدادات",
  },
};

export function SettingsForm({
  locale,
  initialSettings,
  wahaConfigured,
}: SettingsFormProps) {
  const t = texts[locale];

  const [settings, setSettings] = useState({
    whatsapp_login_enabled: initialSettings.whatsapp_login_enabled === true,
    whatsapp_registration_verification: initialSettings.whatsapp_registration_verification === true,
    whatsapp_login_notification: initialSettings.whatsapp_login_notification === true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setMessage(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (data.ok) {
        setMessage({ type: "success", text: t.saved });
      } else {
        setMessage({ type: "error", text: data.error || t.error });
      }
    } catch (err) {
      setMessage({ type: "error", text: t.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* WhatsApp Section */}
      <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <WhatsAppIcon className="h-5 w-5 text-green-600" />
            {t.whatsappSection}
          </h2>
          <p className="text-sm text-(--muted-foreground)">{t.whatsappDescription}</p>
        </div>

        {!wahaConfigured ? (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
            {t.notConfigured}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Login Enabled */}
            <ToggleSetting
              enabled={settings.whatsapp_login_enabled}
              onToggle={() => handleToggle("whatsapp_login_enabled")}
              label={t.loginEnabled}
              description={t.loginEnabledDesc}
            />

            {/* Verification Required */}
            <ToggleSetting
              enabled={settings.whatsapp_registration_verification}
              onToggle={() => handleToggle("whatsapp_registration_verification")}
              label={t.verificationRequired}
              description={t.verificationRequiredDesc}
            />

            {/* Login Notification */}
            <ToggleSetting
              enabled={settings.whatsapp_login_notification}
              onToggle={() => handleToggle("whatsapp_login_notification")}
              label={t.loginNotification}
              description={t.loginNotificationDesc}
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      {wahaConfigured && (
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? t.saving : t.save}
          </Button>
          {message && (
            <span
              className={`text-sm ${
                message.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ToggleSetting({
  enabled,
  onToggle,
  label,
  description,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-(--surface-border) last:border-0">
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-(--muted-foreground)">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
          enabled ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
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
