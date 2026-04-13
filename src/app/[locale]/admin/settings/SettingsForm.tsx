"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";

interface SettingsFormProps {
  locale: Locale;
  initialSettings: Record<string, unknown>;
  wahaConfigured: boolean;
}

const texts = {
  en: {
    tabs: {
      general: "General",
      moderation: "Moderation",
      whatsapp: "WhatsApp",
      preview: "Login Preview",
    },
    generalSection: "General Settings",
    generalDescription: "Configure general authentication options",
    requireApproval: "Require Admin Approval",
    requireApprovalDesc: "New user registrations must be approved by an admin before they can login",
    moderationSection: "Business Auto Approval",
    moderationDescription: "Control which business actions bypass admin review and go live immediately.",
    autoApproveBusinessRequests: "Auto-approve new business requests",
    autoApproveBusinessRequestsDesc: "Automatically create and approve businesses when users submit a new business request.",
    autoApproveBusinessUpdates: "Auto-approve business profile changes",
    autoApproveBusinessUpdatesDesc: "Business edit changes are applied immediately without hiding the listing for admin review.",
    autoApproveBusinessStories: "Auto-approve stories",
    autoApproveBusinessStoriesDesc: "New stories become visible immediately without admin moderation.",
    autoApproveBusinessNews: "Auto-approve news posts",
    autoApproveBusinessNewsDesc: "Business news goes live immediately without entering the moderation queue.",
    autoApproveBusinessProducts: "Auto-approve products",
    autoApproveBusinessProductsDesc: "New and edited products become available immediately without admin review.",
    autoApproveBusinessCards: "Auto-approve business cards",
    autoApproveBusinessCardsDesc: "New business cards become public immediately when owners create them.",
    autoApproveBusinessInstagram: "Auto-approve Instagram changes",
    autoApproveBusinessInstagramDesc: "Instagram username updates are approved immediately without admin moderation.",
    whatsappSection: "WhatsApp Authentication",
    whatsappDescription: "Configure WhatsApp-based authentication options",
    notConfigured: "WhatsApp is not configured. Add WAHA_API_URL, WAHA_API_KEY, and WAHA_ENABLED=true to your .env file.",
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
    previewSection: "Login Page Preview",
    previewDescription: "Preview how the login page looks to users",
    openLoginPage: "Open Login Page",
  },
  ar: {
    tabs: {
      general: "عام",
      moderation: "المراجعة",
      whatsapp: "واتساب",
      preview: "معاينة الدخول",
    },
    generalSection: "الإعدادات العامة",
    generalDescription: "إعداد خيارات المصادقة العامة",
    requireApproval: "طلب موافقة المدير",
    requireApprovalDesc: "يجب موافقة المدير على تسجيلات المستخدمين الجدد قبل أن يتمكنوا من تسجيل الدخول",
    moderationSection: "الموافقة التلقائية للأعمال",
    moderationDescription: "تحكم في الإجراءات التي تتجاوز مراجعة الإدارة وتُعتمد مباشرة.",
    autoApproveBusinessRequests: "الموافقة التلقائية على طلبات الأعمال الجديدة",
    autoApproveBusinessRequestsDesc: "إنشاء واعتماد النشاط تلقائياً عند إرسال طلب نشاط جديد.",
    autoApproveBusinessUpdates: "الموافقة التلقائية على تغييرات بيانات النشاط",
    autoApproveBusinessUpdatesDesc: "تُطبق تعديلات النشاط مباشرة دون إخفائه بانتظار مراجعة الإدارة.",
    autoApproveBusinessStories: "الموافقة التلقائية على الستوري",
    autoApproveBusinessStoriesDesc: "تظهر الستوري الجديدة مباشرة دون انتظار مراجعة الإدارة.",
    autoApproveBusinessNews: "الموافقة التلقائية على الأخبار",
    autoApproveBusinessNewsDesc: "تُنشر أخبار النشاط مباشرة دون دخول قائمة المراجعة.",
    autoApproveBusinessProducts: "الموافقة التلقائية على المنتجات",
    autoApproveBusinessProductsDesc: "تصبح المنتجات الجديدة والمعدلة متاحة مباشرة دون مراجعة الإدارة.",
    autoApproveBusinessCards: "الموافقة التلقائية على بطاقات الأعمال",
    autoApproveBusinessCardsDesc: "تصبح بطاقات الأعمال الجديدة عامة مباشرة عند إنشائها.",
    autoApproveBusinessInstagram: "الموافقة التلقائية على تغييرات إنستاغرام",
    autoApproveBusinessInstagramDesc: "يتم اعتماد تعديل اسم مستخدم إنستاغرام مباشرة دون مراجعة الإدارة.",
    whatsappSection: "المصادقة عبر واتساب",
    whatsappDescription: "إعداد خيارات المصادقة عبر واتساب",
    notConfigured: "واتساب غير مُعد. أضف WAHA_API_URL و WAHA_API_KEY و WAHA_ENABLED=true إلى ملف .env",
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
    previewSection: "معاينة صفحة الدخول",
    previewDescription: "معاينة كيف تبدو صفحة الدخول للمستخدمين",
    openLoginPage: "فتح صفحة الدخول",
  },
};

type TabId = "general" | "moderation" | "whatsapp" | "preview";

export function SettingsForm({
  locale,
  initialSettings,
  wahaConfigured,
}: SettingsFormProps) {
  const t = texts[locale];

  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [settings, setSettings] = useState({
    require_approval: initialSettings.require_approval === true,
    whatsapp_login_enabled: initialSettings.whatsapp_login_enabled === true,
    whatsapp_registration_verification: initialSettings.whatsapp_registration_verification === true,
    whatsapp_login_notification: initialSettings.whatsapp_login_notification === true,
    auto_approve_business_requests: initialSettings.auto_approve_business_requests === true,
    auto_approve_business_updates: initialSettings.auto_approve_business_updates === true,
    auto_approve_business_stories: initialSettings.auto_approve_business_stories === true,
    auto_approve_business_news: initialSettings.auto_approve_business_news === true,
    auto_approve_business_products: initialSettings.auto_approve_business_products === true,
    auto_approve_business_cards: initialSettings.auto_approve_business_cards === true,
    auto_approve_business_instagram: initialSettings.auto_approve_business_instagram === true,
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
    } catch {
      setMessage({ type: "error", text: t.error });
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: "general",
      label: t.tabs.general,
      icon: <SettingsIcon className="h-4 w-4" />,
    },
    {
      id: "moderation",
      label: t.tabs.moderation,
      icon: <ShieldCheckIcon className="h-4 w-4" />,
    },
    {
      id: "whatsapp",
      label: t.tabs.whatsapp,
      icon: <WhatsAppIcon className="h-4 w-4 text-green-600" />,
    },
    {
      id: "preview",
      label: t.tabs.preview,
      icon: <EyeIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-(--surface-border)">
        <nav className="flex gap-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-(--muted-foreground) hover:border-(--surface-border) hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === "general" && (
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                {t.generalSection}
              </h2>
              <p className="text-sm text-(--muted-foreground)">{t.generalDescription}</p>
            </div>

            <div className="space-y-4">
              <ToggleSetting
                enabled={settings.require_approval}
                onToggle={() => handleToggle("require_approval")}
                label={t.requireApproval}
                description={t.requireApprovalDesc}
              />
            </div>
          </div>
        )}

        {activeTab === "moderation" && (
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                {t.moderationSection}
              </h2>
              <p className="text-sm text-(--muted-foreground)">{t.moderationDescription}</p>
            </div>

            <div className="space-y-4">
              <ToggleSetting
                enabled={settings.auto_approve_business_requests}
                onToggle={() => handleToggle("auto_approve_business_requests")}
                label={t.autoApproveBusinessRequests}
                description={t.autoApproveBusinessRequestsDesc}
              />
              <ToggleSetting
                enabled={settings.auto_approve_business_updates}
                onToggle={() => handleToggle("auto_approve_business_updates")}
                label={t.autoApproveBusinessUpdates}
                description={t.autoApproveBusinessUpdatesDesc}
              />
              <ToggleSetting
                enabled={settings.auto_approve_business_stories}
                onToggle={() => handleToggle("auto_approve_business_stories")}
                label={t.autoApproveBusinessStories}
                description={t.autoApproveBusinessStoriesDesc}
              />
              <ToggleSetting
                enabled={settings.auto_approve_business_news}
                onToggle={() => handleToggle("auto_approve_business_news")}
                label={t.autoApproveBusinessNews}
                description={t.autoApproveBusinessNewsDesc}
              />
              <ToggleSetting
                enabled={settings.auto_approve_business_products}
                onToggle={() => handleToggle("auto_approve_business_products")}
                label={t.autoApproveBusinessProducts}
                description={t.autoApproveBusinessProductsDesc}
              />
              <ToggleSetting
                enabled={settings.auto_approve_business_cards}
                onToggle={() => handleToggle("auto_approve_business_cards")}
                label={t.autoApproveBusinessCards}
                description={t.autoApproveBusinessCardsDesc}
              />
              <ToggleSetting
                enabled={settings.auto_approve_business_instagram}
                onToggle={() => handleToggle("auto_approve_business_instagram")}
                label={t.autoApproveBusinessInstagram}
                description={t.autoApproveBusinessInstagramDesc}
              />
            </div>
          </div>
        )}

        {activeTab === "whatsapp" && (
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
                <ToggleSetting
                  enabled={settings.whatsapp_login_enabled}
                  onToggle={() => handleToggle("whatsapp_login_enabled")}
                  label={t.loginEnabled}
                  description={t.loginEnabledDesc}
                />

                <ToggleSetting
                  enabled={settings.whatsapp_registration_verification}
                  onToggle={() => handleToggle("whatsapp_registration_verification")}
                  label={t.verificationRequired}
                  description={t.verificationRequiredDesc}
                />

                <ToggleSetting
                  enabled={settings.whatsapp_login_notification}
                  onToggle={() => handleToggle("whatsapp_login_notification")}
                  label={t.loginNotification}
                  description={t.loginNotificationDesc}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "preview" && (
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <EyeIcon className="h-5 w-5" />
                  {t.previewSection}
                </h2>
                <p className="text-sm text-(--muted-foreground)">{t.previewDescription}</p>
              </div>
              <a
                href={`/${locale}/login`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm font-medium hover:bg-(--surface-hover) transition-colors"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                {t.openLoginPage}
              </a>
            </div>

            {/* Login Preview Box */}
            <div className="rounded-xl border border-(--surface-border) bg-(--background) p-6 shadow-lg">
              <div className="mx-auto max-w-sm">
                <h3 className="mb-6 text-xl font-semibold">
                  {locale === "ar" ? "تسجيل الدخول" : "Login"}
                </h3>

                {/* Preview Tabs */}
                <div className="mb-6 border-b border-(--surface-border)">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-2 border-b-2 border-accent px-1 py-3 text-sm font-medium text-accent">
                      <MailIcon className="h-4 w-4" />
                      {locale === "ar" ? "البريد وكلمة المرور" : "Email & Password"}
                    </span>
                    <span className="flex items-center gap-2 border-b-2 border-transparent px-1 py-3 text-sm font-medium text-(--muted-foreground)">
                      <WhatsAppIcon className="h-4 w-4 text-green-600" />
                      {locale === "ar" ? "واتساب" : "WhatsApp"}
                    </span>
                  </div>
                </div>

                {/* Preview Form */}
                <div className="space-y-4">
                  <div className="grid gap-1">
                    <span className="text-sm font-medium text-(--muted-foreground)">
                      {locale === "ar" ? "البريد أو الهاتف" : "Email or mobile"}
                    </span>
                    <div className="rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm text-(--muted-foreground)">
                      user@example.com
                    </div>
                  </div>

                  <div className="grid gap-1">
                    <span className="text-sm font-medium text-(--muted-foreground)">
                      {locale === "ar" ? "كلمة المرور" : "Password"}
                    </span>
                    <div className="rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm text-(--muted-foreground)">
                      ••••••••
                    </div>
                  </div>

                  {/* Human Challenge Preview */}
                  <div className="rounded-2xl border border-(--surface-border) bg-(--surface) p-4">
                    <p className="text-sm font-semibold">
                      {locale === "ar" ? "تحقق سريع أنك إنسان" : "Quick human check"}
                    </p>
                    <p className="mt-1 text-sm text-(--muted-foreground)">
                      {locale === "ar" ? "اضغط الرموز بالترتيب" : "Tap the icons in order"}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {["☀️", "🌙", "🍃", "🌊", "✨", "⛰️"].map((emoji, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-3 text-sm"
                        >
                          <span className="text-xl">{emoji}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-medium text-(--accent-foreground)">
                    {locale === "ar" ? "تسجيل الدخول" : "Sign In"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {activeTab !== "preview" && (
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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
