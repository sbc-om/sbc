"use client";

import { useState } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";
import type { LoyaltyCardTemplate, LoyaltyProfile } from "@/lib/db/types";

interface Props {
  locale: Locale;
  profile?: LoyaltyProfile | null;
  template?: LoyaltyCardTemplate | null;
  onSave?: (template: Partial<LoyaltyCardTemplate>) => Promise<void>;
  isNew?: boolean;
}

const defaultTemplate: Omit<LoyaltyCardTemplate, "id" | "userId" | "createdAt" | "updatedAt"> = {
  name: "Default Card",
  isDefault: true,
  design: {
    primaryColor: "#1E40AF",
    secondaryColor: "#3B82F6",
    textColor: "#FFFFFF",
    backgroundColor: "#1E40AF",
    backgroundStyle: "solid",
    logoPosition: "corner",
    showBusinessName: true,
    showCustomerName: true,
    cornerRadius: 12,
  },
  passContent: {
    programName: "Loyalty Program",
    pointsLabel: "Points",
    headerLabel: "MEMBER",
    headerValue: "2024",
    secondaryLabel: "Status",
    secondaryValue: "Active",
    auxFields: [],
    backFields: [],
  },
  barcode: {
    format: "qr",
    messageTemplate: "{{memberId}}",
    altTextTemplate: "{{memberId}}",
  },
  images: {},
  support: {},
  terms: "Points are non-transferable and subject to change.",
  description: "Show this card at checkout to earn and redeem points.",
  notificationTitle: "Points Updated",
  notificationBody: "Your loyalty points balance has been updated.",
};

const PRESETS = {
  airline: {
    name: { en: "Airline Blue", ar: "أزرق طيران" },
    design: {
      primaryColor: "#1E40AF",
      secondaryColor: "#3B82F6",
      backgroundColor: "#1E40AF",
      textColor: "#FFFFFF",
      backgroundStyle: "solid" as const,
      logoPosition: "corner" as const,
      cornerRadius: 12,
      showBusinessName: true,
      showCustomerName: true,
    },
  },
  coffee: {
    name: { en: "Coffee Shop", ar: "مقهى" },
    design: {
      primaryColor: "#166534",
      secondaryColor: "#22C55E",
      backgroundColor: "#166534",
      textColor: "#FFFFFF",
      backgroundStyle: "solid" as const,
      logoPosition: "corner" as const,
      cornerRadius: 12,
      showBusinessName: true,
      showCustomerName: true,
    },
  },
  luxury: {
    name: { en: "Luxury Gold", ar: "ذهبي فاخر" },
    design: {
      primaryColor: "#1C1917",
      secondaryColor: "#D4AF37",
      backgroundColor: "#1C1917",
      textColor: "#D4AF37",
      backgroundStyle: "solid" as const,
      logoPosition: "corner" as const,
      cornerRadius: 12,
      showBusinessName: true,
      showCustomerName: true,
    },
  },
  modern: {
    name: { en: "Modern Purple", ar: "بنفسجي عصري" },
    design: {
      primaryColor: "#7C3AED",
      secondaryColor: "#A78BFA",
      backgroundColor: "#7C3AED",
      textColor: "#FFFFFF",
      backgroundStyle: "gradient" as const,
      logoPosition: "corner" as const,
      cornerRadius: 12,
      showBusinessName: true,
      showCustomerName: true,
    },
  },
  sunset: {
    name: { en: "Sunset Orange", ar: "برتقالي غروب" },
    design: {
      primaryColor: "#EA580C",
      secondaryColor: "#F59E0B",
      backgroundColor: "#EA580C",
      textColor: "#FFFFFF",
      backgroundStyle: "gradient" as const,
      logoPosition: "corner" as const,
      cornerRadius: 12,
      showBusinessName: true,
      showCustomerName: true,
    },
  },
  ocean: {
    name: { en: "Ocean Teal", ar: "أزرق محيطي" },
    design: {
      primaryColor: "#0D9488",
      secondaryColor: "#2DD4BF",
      backgroundColor: "#0D9488",
      textColor: "#FFFFFF",
      backgroundStyle: "gradient" as const,
      logoPosition: "corner" as const,
      cornerRadius: 12,
      showBusinessName: true,
      showCustomerName: true,
    },
  },
  rose: {
    name: { en: "Rose Pink", ar: "وردي" },
    design: {
      primaryColor: "#BE185D",
      secondaryColor: "#F472B6",
      backgroundColor: "#BE185D",
      textColor: "#FFFFFF",
      backgroundStyle: "gradient" as const,
      logoPosition: "corner" as const,
      cornerRadius: 12,
      showBusinessName: true,
      showCustomerName: true,
    },
  },
  minimal: {
    name: { en: "Minimal Light", ar: "فاتح بسيط" },
    design: {
      primaryColor: "#F8FAFC",
      secondaryColor: "#E2E8F0",
      backgroundColor: "#F8FAFC",
      textColor: "#1E293B",
      backgroundStyle: "solid" as const,
      logoPosition: "corner" as const,
      cornerRadius: 12,
      showBusinessName: true,
      showCustomerName: true,
    },
  },
};

export function CardTemplateDesigner({ locale, profile, template, onSave, isNew = false }: Props) {
  const ar = locale === "ar";
  const businessName = profile?.businessName ?? "Your Business";
  const logoUrl = profile?.logoUrl;

  // Initialize state from template or defaults
  const [name, setName] = useState(template?.name ?? defaultTemplate.name);
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? defaultTemplate.isDefault);
  const [design, setDesign] = useState(template?.design ?? defaultTemplate.design);
  const [passContent, setPassContent] = useState(template?.passContent ?? defaultTemplate.passContent);
  const [barcode, setBarcode] = useState(template?.barcode ?? defaultTemplate.barcode);
  const [images, setImages] = useState(template?.images ?? defaultTemplate.images);
  const [support, setSupport] = useState(template?.support ?? defaultTemplate.support);
  const [terms, setTerms] = useState(template?.terms ?? defaultTemplate.terms);
  const [description, setDescription] = useState(template?.description ?? defaultTemplate.description);
  const [notificationTitle, setNotificationTitle] = useState(template?.notificationTitle ?? defaultTemplate.notificationTitle);
  const [notificationBody, setNotificationBody] = useState(template?.notificationBody ?? defaultTemplate.notificationBody);

  const [activePreview, setActivePreview] = useState<"ios" | "android">("ios");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Aux fields and back fields management
  const [auxFields, setAuxFields] = useState<Array<{ label: string; value: string }>>(
    passContent.auxFields ?? []
  );
  const [backFields, setBackFields] = useState<Array<{ label: string; value: string }>>(
    passContent.backFields ?? []
  );

  const updateDesign = (updates: Partial<typeof design>) => {
    setDesign((prev) => ({ ...prev, ...updates }));
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setDesign((prev) => ({
      ...prev,
      ...preset.design,
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setSaving(true);
    setMessage(null);

    try {
      await onSave({
        name,
        isDefault,
        design,
        passContent: {
          ...passContent,
          auxFields,
          backFields,
        },
        barcode,
        images,
        support,
        terms,
        description,
        notificationTitle,
        notificationBody,
      });

      setMessage({
        type: "success",
        text: ar ? "تم حفظ القالب بنجاح!" : "Template saved successfully!",
      });
    } catch (error) {
      console.error("Error saving template:", error);
      setMessage({
        type: "error",
        text: ar ? "فشل حفظ القالب. حاول مرة أخرى." : "Failed to save template. Please try again.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Sample data for preview
  const samplePoints = 125;
  const sampleCustomerName = ar ? "محمد أحمد" : "John Smith";
  const sampleMemberId = "SBC-ABC-12345";

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Controls Panel */}
        <div className="space-y-6">
          {/* Template Name */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">
              {ar ? "معلومات القالب" : "Template Info"}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "اسم القالب" : "Template Name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  placeholder={ar ? "مثال: بطاقة VIP" : "e.g., VIP Card"}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-sm">
                  {ar ? "القالب الافتراضي للعملاء الجدد" : "Default template for new customers"}
                </span>
              </label>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">
              {ar ? "قوالب جاهزة" : "Quick Presets"}
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(PRESETS) as [keyof typeof PRESETS, (typeof PRESETS)[keyof typeof PRESETS]][]).map(([key, preset]) => {
                const isActive =
                  design.primaryColor === preset.design.primaryColor &&
                  design.backgroundColor === preset.design.backgroundColor;

                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      isActive
                        ? "border-accent ring-2 ring-accent/30 scale-105"
                        : "border-transparent hover:border-accent/50 hover:scale-102"
                    }`}
                    style={{
                      background:
                        preset.design.backgroundStyle === "gradient"
                          ? `linear-gradient(135deg, ${preset.design.primaryColor}, ${preset.design.secondaryColor})`
                          : preset.design.backgroundColor,
                    }}
                    title={preset.name[ar ? "ar" : "en"]}
                  >
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold px-1 text-center leading-tight"
                      style={{ color: preset.design.textColor }}
                    >
                      {preset.name[ar ? "ar" : "en"]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">{ar ? "الألوان" : "Colors"}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "اللون الأساسي" : "Primary"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.primaryColor}
                    onChange={(e) => updateDesign({ primaryColor: e.target.value })}
                    className="h-10 w-12 rounded border border-(--surface-border) cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.primaryColor}
                    onChange={(e) => updateDesign({ primaryColor: e.target.value })}
                    className="flex-1 h-10 px-2 rounded-lg border border-(--surface-border) bg-(--surface) text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "اللون الثانوي" : "Secondary"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.secondaryColor}
                    onChange={(e) => updateDesign({ secondaryColor: e.target.value })}
                    className="h-10 w-12 rounded border border-(--surface-border) cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.secondaryColor}
                    onChange={(e) => updateDesign({ secondaryColor: e.target.value })}
                    className="flex-1 h-10 px-2 rounded-lg border border-(--surface-border) bg-(--surface) text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "لون الخلفية" : "Background"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.backgroundColor}
                    onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                    className="h-10 w-12 rounded border border-(--surface-border) cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.backgroundColor}
                    onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                    className="flex-1 h-10 px-2 rounded-lg border border-(--surface-border) bg-(--surface) text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "لون النص" : "Text"}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.textColor}
                    onChange={(e) => updateDesign({ textColor: e.target.value })}
                    className="h-10 w-12 rounded border border-(--surface-border) cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.textColor}
                    onChange={(e) => updateDesign({ textColor: e.target.value })}
                    className="flex-1 h-10 px-2 rounded-lg border border-(--surface-border) bg-(--surface) text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Style Settings */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">{ar ? "الأسلوب" : "Style"}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "نمط الخلفية" : "Background Style"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["solid", "gradient", "pattern"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => updateDesign({ backgroundStyle: style })}
                      className={`h-9 rounded-lg border text-xs font-medium transition ${
                        design.backgroundStyle === style
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-(--surface-border) hover:border-accent/50"
                      }`}
                    >
                      {style === "solid" && (ar ? "سادة" : "Solid")}
                      {style === "gradient" && (ar ? "متدرج" : "Gradient")}
                      {style === "pattern" && (ar ? "نمط" : "Pattern")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={design.showBusinessName}
                    onChange={(e) => updateDesign({ showBusinessName: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs">{ar ? "إظهار اسم النشاط" : "Show business name"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={design.showCustomerName}
                    onChange={(e) => updateDesign({ showCustomerName: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs">{ar ? "إظهار اسم العميل" : "Show customer name"}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Pass Content */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">{ar ? "محتوى البطاقة" : "Pass Content"}</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "اسم البرنامج" : "Program Name"}
                  </label>
                  <input
                    type="text"
                    value={passContent.programName}
                    onChange={(e) =>
                      setPassContent((p) => ({ ...p, programName: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "تسمية النقاط" : "Points Label"}
                  </label>
                  <input
                    type="text"
                    value={passContent.pointsLabel}
                    onChange={(e) =>
                      setPassContent((p) => ({ ...p, pointsLabel: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "عنوان الرأس" : "Header Label"}
                  </label>
                  <input
                    type="text"
                    value={passContent.headerLabel ?? ""}
                    onChange={(e) =>
                      setPassContent((p) => ({ ...p, headerLabel: e.target.value }))
                    }
                    placeholder="MEMBER"
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "قيمة الرأس" : "Header Value"}
                  </label>
                  <input
                    type="text"
                    value={passContent.headerValue ?? ""}
                    onChange={(e) =>
                      setPassContent((p) => ({ ...p, headerValue: e.target.value }))
                    }
                    placeholder="2024"
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "الحقل الثانوي" : "Secondary Label"}
                  </label>
                  <input
                    type="text"
                    value={passContent.secondaryLabel ?? ""}
                    onChange={(e) =>
                      setPassContent((p) => ({ ...p, secondaryLabel: e.target.value }))
                    }
                    placeholder="Level"
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "قيمة الحقل الثانوي" : "Secondary Value"}
                  </label>
                  <input
                    type="text"
                    value={passContent.secondaryValue ?? ""}
                    onChange={(e) =>
                      setPassContent((p) => ({ ...p, secondaryValue: e.target.value }))
                    }
                    placeholder="Gold"
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Barcode Settings */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">{ar ? "الباركود" : "Barcode"}</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {(["qr", "code128", "pdf417", "aztec"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setBarcode((b) => ({ ...b, format: fmt }))}
                    className={`h-9 rounded-lg border text-xs font-medium uppercase transition ${
                      barcode.format === fmt
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-(--surface-border) hover:border-accent/50"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "قالب الرسالة" : "Message Template"}
                </label>
                <input
                  type="text"
                  value={barcode.messageTemplate ?? ""}
                  onChange={(e) => setBarcode((b) => ({ ...b, messageTemplate: e.target.value }))}
                  placeholder="{{memberId}}"
                  className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm font-mono"
                />
                <p className="text-xs text-(--muted-foreground) mt-1">
                  {ar
                    ? "متغيرات: {{memberId}}, {{customerId}}, {{cardId}}, {{phone}}"
                    : "Variables: {{memberId}}, {{customerId}}, {{cardId}}, {{phone}}"}
                </p>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">{ar ? "معلومات الدعم" : "Support Info"}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "الموقع" : "Website"}
                </label>
                <input
                  type="url"
                  value={support.websiteUrl ?? ""}
                  onChange={(e) => setSupport((s) => ({ ...s, websiteUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  type="email"
                  value={support.email ?? ""}
                  onChange={(e) => setSupport((s) => ({ ...s, email: e.target.value }))}
                  placeholder="support@..."
                  className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "الهاتف" : "Phone"}
                </label>
                <input
                  type="tel"
                  value={support.phone ?? ""}
                  onChange={(e) => setSupport((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="+968..."
                  className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "العنوان" : "Address"}
                </label>
                <input
                  type="text"
                  value={support.address ?? ""}
                  onChange={(e) => setSupport((s) => ({ ...s, address: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                />
              </div>
            </div>
          </div>

          {/* Terms & Description */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">{ar ? "الوصف والشروط" : "Description & Terms"}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "الوصف" : "Description"}
                </label>
                <textarea
                  value={description ?? ""}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "الشروط" : "Terms"}
                </label>
                <textarea
                  value={terms ?? ""}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 rounded-xl bg-accent text-accent-foreground font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition"
          >
            {saving
              ? ar
                ? "جاري الحفظ..."
                : "Saving..."
              : isNew
              ? ar
                ? "إنشاء القالب"
                : "Create Template"
              : ar
              ? "حفظ التغييرات"
              : "Save Changes"}
          </button>

          {/* Test Apple Pass Button (only for existing templates) */}
          {template?.id && (
            <a
              href={`/api/loyalty/templates/${template.id}/preview/apple`}
              download
              className="w-full h-12 rounded-xl bg-(--surface) border border-(--surface-border) text-foreground font-semibold text-sm hover:bg-(--surface-border) transition flex items-center justify-center gap-2"
            >
              <AppleIcon className="w-5 h-5" />
              {ar ? "تحميل معاينة iOS" : "Download iOS Preview Pass"}
            </a>
          )}

          {message && (
            <div
              className={`rounded-xl p-4 text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* Platform Switcher */}
          <div className="flex items-center justify-center gap-2 p-1 bg-(--surface) rounded-xl border border-(--surface-border)">
            <button
              onClick={() => setActivePreview("ios")}
              className={`flex-1 h-10 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                activePreview === "ios"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-(--muted-foreground) hover:text-foreground"
              }`}
            >
              <AppleIcon className="w-4 h-4" />
              {ar ? "آيفون" : "iOS"}
            </button>
            <button
              onClick={() => setActivePreview("android")}
              className={`flex-1 h-10 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${
                activePreview === "android"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-(--muted-foreground) hover:text-foreground"
              }`}
            >
              <AndroidIcon className="w-4 h-4" />
              {ar ? "أندرويد" : "Android"}
            </button>
          </div>

          {/* Preview Container */}
          <div className="relative rounded-2xl border border-(--surface-border) bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 min-h-[640px] flex items-center justify-center overflow-hidden">
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(120,120,120,0.1) 0%, transparent 50%), 
                                  radial-gradient(circle at 75% 75%, rgba(120,120,120,0.1) 0%, transparent 50%)`,
              }}
            />

            {activePreview === "ios" ? (
              <IOSPassPreview
                design={design}
                passContent={passContent}
                businessName={businessName}
                logoUrl={logoUrl}
                points={samplePoints}
                customerName={design.showCustomerName ? sampleCustomerName : undefined}
                memberId={sampleMemberId}
                barcode={barcode}
              />
            ) : (
              <AndroidPassPreview
                design={design}
                passContent={passContent}
                businessName={businessName}
                logoUrl={logoUrl}
                points={samplePoints}
                customerName={design.showCustomerName ? sampleCustomerName : undefined}
                memberId={sampleMemberId}
                barcode={barcode}
              />
            )}
          </div>

          <p className="text-xs text-center text-(--muted-foreground)">
            {ar
              ? "المعاينة تقريبية. قد يختلف المظهر الفعلي حسب إعدادات الجهاز."
              : "Preview is approximate. Actual appearance may vary by device settings."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Preview Components
// ============================================================================

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.5 11.5 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C4.53 11.1 3.01 13.42 3 16h18c-.01-2.58-1.53-4.9-3.4-6.52zM7 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

interface PreviewProps {
  design: LoyaltyCardTemplate["design"];
  passContent: LoyaltyCardTemplate["passContent"];
  businessName: string;
  logoUrl?: string | null;
  points: number;
  customerName?: string;
  memberId: string;
  barcode: LoyaltyCardTemplate["barcode"];
}

function IOSPassPreview({
  design,
  passContent,
  businessName,
  logoUrl,
  points,
  customerName,
  memberId,
  barcode,
}: PreviewProps) {
  const getBackground = () => {
    if (design.backgroundStyle === "gradient") {
      return `linear-gradient(180deg, ${design.primaryColor}, ${design.secondaryColor})`;
    }
    if (design.backgroundStyle === "pattern") {
      return `${design.backgroundColor} url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodeURIComponent(design.textColor)}' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`;
    }
    return design.backgroundColor;
  };

  return (
    <div className="w-full max-w-[340px] mx-auto relative z-10">
      {/* iPhone Status Bar Mock */}
      <div className="bg-black rounded-t-[40px] pt-2 px-6 pb-1">
        <div className="flex items-center justify-between text-white text-xs">
          <span>9:41</span>
          <div className="w-28 h-7 bg-black rounded-full" />
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 border border-white rounded-sm">
              <div className="w-2/3 h-full bg-white rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Header */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
        <button className="text-blue-400 text-sm">Done</button>
        <span className="text-white text-sm font-medium">Wallet</span>
        <button className="text-blue-400 text-sm">···</button>
      </div>

      {/* Pass Card */}
      <div
        className="mx-2 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: getBackground(),
          borderRadius: `${design.cornerRadius}px`,
        }}
      >
        {/* Header */}
        <div className="p-4 flex justify-between items-start">
          <div>
            {design.showBusinessName && (
              <div className="text-sm font-semibold" style={{ color: design.textColor }}>
                {businessName}
              </div>
            )}
            <div className="text-xs mt-0.5 opacity-70" style={{ color: design.textColor }}>
              {passContent.programName}
            </div>
          </div>
          {logoUrl && (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
              <Image
                src={logoUrl}
                alt="Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="px-4 pb-4">
          {/* Points Display */}
          <div className="text-center py-6">
            <div className="text-5xl font-bold" style={{ color: design.textColor }}>
              {points}
            </div>
            <div className="text-sm mt-1 opacity-70" style={{ color: design.textColor }}>
              {passContent.pointsLabel}
            </div>
          </div>

          {/* Customer Info */}
          {customerName && (
            <div className="flex justify-between items-center py-3 border-t border-white/10">
              <div>
                <div className="text-xs opacity-60" style={{ color: design.textColor }}>
                  {passContent.secondaryLabel || "Member"}
                </div>
                <div className="text-sm font-medium" style={{ color: design.textColor }}>
                  {customerName}
                </div>
              </div>
              {passContent.secondaryValue && (
                <div className="text-right">
                  <div className="text-xs opacity-60" style={{ color: design.textColor }}>
                    Status
                  </div>
                  <div className="text-sm font-medium" style={{ color: design.textColor }}>
                    {passContent.secondaryValue}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barcode */}
        <div className="bg-white p-4 flex flex-col items-center">
          {barcode.format === "qr" ? (
            <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 ${Math.random() > 0.5 ? "bg-black" : "bg-white"}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-16 w-48 bg-gray-100 flex items-center justify-center">
              <div className="flex gap-px h-12">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-full ${Math.random() > 0.5 ? "bg-black w-0.5" : "bg-black w-1"}`}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-600 font-mono">{memberId}</div>
        </div>
      </div>

      {/* iPhone Home Indicator */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-b-[40px] pt-4 pb-2">
        <div className="w-32 h-1 mx-auto bg-gray-400 rounded-full" />
      </div>
    </div>
  );
}

function AndroidPassPreview({
  design,
  passContent,
  businessName,
  logoUrl,
  points,
  customerName,
  memberId,
  barcode,
}: PreviewProps) {
  const getBackground = () => {
    if (design.backgroundStyle === "gradient") {
      return `linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor})`;
    }
    if (design.backgroundStyle === "pattern") {
      return `${design.backgroundColor} url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodeURIComponent(design.textColor)}' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`;
    }
    return design.backgroundColor;
  };

  return (
    <div className="w-full max-w-[360px] mx-auto relative z-10">
      {/* Android Status Bar */}
      <div className="bg-gray-900 rounded-t-3xl pt-2 px-4 pb-2">
        <div className="flex items-center justify-between text-white text-xs">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21c-4.97 0-9-4.03-9-9s4.03-9 9-9 9 4.03 9 9-4.03 9-9 9zm0-16c-3.86 0-7 3.14-7 7s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7z" />
            </svg>
            <div className="w-4 h-2 border border-white rounded-sm">
              <div className="w-2/3 h-full bg-white rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Google Wallet Header */}
      <div className="bg-white dark:bg-gray-900 px-4 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        <span className="font-medium text-sm">Google Wallet</span>
      </div>

      {/* Pass Card */}
      <div className="px-3 pb-4 bg-white dark:bg-gray-900">
        <div
          className="rounded-2xl overflow-hidden shadow-lg"
          style={{
            background: getBackground(),
            borderRadius: `${design.cornerRadius}px`,
          }}
        >
          {/* Header Row */}
          <div className="p-4 flex items-center gap-3">
            {logoUrl && (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center">
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              {design.showBusinessName && (
                <div className="text-sm font-medium" style={{ color: design.textColor }}>
                  {businessName}
                </div>
              )}
              <div className="text-xs opacity-70" style={{ color: design.textColor }}>
                {passContent.programName}
              </div>
            </div>
          </div>

          {/* Points Section */}
          <div className="px-4 py-6 flex justify-between items-center">
            <div>
              <div className="text-xs opacity-60" style={{ color: design.textColor }}>
                {passContent.pointsLabel}
              </div>
              <div className="text-4xl font-bold" style={{ color: design.textColor }}>
                {points}
              </div>
            </div>
            {customerName && (
              <div className="text-right">
                <div className="text-xs opacity-60" style={{ color: design.textColor }}>
                  {passContent.secondaryLabel || "Member"}
                </div>
                <div className="text-sm font-medium" style={{ color: design.textColor }}>
                  {customerName}
                </div>
              </div>
            )}
          </div>

          {/* Barcode Section */}
          <div className="bg-white p-4">
            <div className="flex flex-col items-center">
              {barcode.format === "qr" ? (
                <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-0.5">
                    {[...Array(25)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 ${Math.random() > 0.5 ? "bg-black" : "bg-white"}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-14 w-44 bg-gray-100 flex items-center justify-center">
                  <div className="flex gap-px h-10">
                    {[...Array(35)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-full ${Math.random() > 0.5 ? "bg-black w-0.5" : "bg-black w-1"}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-600 font-mono">{memberId}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Android Navigation */}
      <div className="bg-white dark:bg-gray-900 rounded-b-3xl pt-2 pb-1">
        <div className="flex justify-center gap-8 py-2">
          <div className="w-5 h-5 border-2 border-gray-400 rounded" />
          <div className="w-5 h-5 bg-gray-400 rounded-full" />
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-gray-400" />
        </div>
      </div>
    </div>
  );
}
