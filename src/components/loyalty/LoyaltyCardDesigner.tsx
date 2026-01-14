"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";

interface CardDesign {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  backgroundStyle: "solid" | "gradient" | "pattern";
  logoPosition: "top" | "center" | "corner";
  showBusinessName: boolean;
  showCustomerName: boolean;
  cornerRadius: number;
}

const defaultDesign: CardDesign = {
  primaryColor: "#7c3aed",
  secondaryColor: "#0ea5e9",
  textColor: "#ffffff",
  backgroundColor: "#1e1e2e",
  backgroundStyle: "gradient",
  logoPosition: "top",
  showBusinessName: true,
  showCustomerName: true,
  cornerRadius: 16,
};

interface Props {
  locale: Locale;
  businessName: string;
  logoUrl?: string | null;
  onSave?: (design: CardDesign) => Promise<void>;
  initialDesign?: Partial<CardDesign>;
}

export function LoyaltyCardDesigner({
  locale,
  businessName,
  logoUrl,
  onSave,
  initialDesign,
}: Props) {
  const ar = locale === "ar";
  const [design, setDesign] = useState<CardDesign>({
    ...defaultDesign,
    ...initialDesign,
  });
  const [activePreview, setActivePreview] = useState<"ios" | "android">("ios");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updateDesign = (updates: Partial<CardDesign>) => {
    setDesign((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch("/api/loyalty/card-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(design),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }

      setMessage({
        type: "success",
        text: ar ? "تم حفظ التصميم بنجاح!" : "Design saved successfully!",
      });

      if (onSave) {
        await onSave(design);
      }
    } catch (error) {
      console.error("Error saving design:", error);
      setMessage({
        type: "error",
        text: ar ? "فشل حفظ التصميم. حاول مرة أخرى." : "Failed to save design. Please try again.",
      });
    } finally {
      setSaving(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Sample data for preview
  const samplePoints = 12;
  const sampleCustomerName = ar ? "محمد أحمد" : "John Smith";

  return (
    <div className="mt-8 sbc-card rounded-2xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {ar ? "تصميم بطاقة الولاء" : "Loyalty Card Design"}
          </h3>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {ar
              ? "قم بتخصيص مظهر بطاقة الولاء التي سيراها العملاء في Apple Wallet و Google Wallet"
              : "Customize how your loyalty card appears in Apple Wallet and Google Wallet"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-6">
          {/* Color Settings */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">
              {ar ? "الألوان" : "Colors"}
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "اللون الأساسي" : "Primary Color"}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={design.primaryColor}
                    onChange={(e) => updateDesign({ primaryColor: e.target.value })}
                    className="h-10 w-20 rounded-lg border border-(--surface-border) cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.primaryColor}
                    onChange={(e) => updateDesign({ primaryColor: e.target.value })}
                    className="flex-1 h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "اللون الثانوي" : "Secondary Color"}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={design.secondaryColor}
                    onChange={(e) => updateDesign({ secondaryColor: e.target.value })}
                    className="h-10 w-20 rounded-lg border border-(--surface-border) cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.secondaryColor}
                    onChange={(e) => updateDesign({ secondaryColor: e.target.value })}
                    className="flex-1 h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "لون الخلفية" : "Background Color"}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={design.backgroundColor}
                    onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                    className="h-10 w-20 rounded-lg border border-(--surface-border) cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.backgroundColor}
                    onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                    className="flex-1 h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "لون النص" : "Text Color"}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={design.textColor}
                    onChange={(e) => updateDesign({ textColor: e.target.value })}
                    className="h-10 w-20 rounded-lg border border-(--surface-border) cursor-pointer"
                  />
                  <input
                    type="text"
                    value={design.textColor}
                    onChange={(e) => updateDesign({ textColor: e.target.value })}
                    className="flex-1 h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Layout Settings */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">
              {ar ? "التصميم والترتيب" : "Layout & Style"}
            </h4>
            
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
                      className={`h-10 rounded-lg border text-xs font-medium transition ${
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

              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "موضع الشعار" : "Logo Position"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["top", "center", "corner"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateDesign({ logoPosition: pos })}
                      className={`h-10 rounded-lg border text-xs font-medium transition ${
                        design.logoPosition === pos
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-(--surface-border) hover:border-accent/50"
                      }`}
                    >
                      {pos === "top" && (ar ? "أعلى" : "Top")}
                      {pos === "center" && (ar ? "وسط" : "Center")}
                      {pos === "corner" && (ar ? "زاوية" : "Corner")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "استدارة الحواف" : "Corner Radius"} ({design.cornerRadius}px)
                </label>
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="4"
                  value={design.cornerRadius}
                  onChange={(e) => updateDesign({ cornerRadius: Number(e.target.value) })}
                  className="w-full h-2 rounded-lg bg-(--surface-border) appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={design.showBusinessName}
                    onChange={(e) => updateDesign({ showBusinessName: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-sm">
                    {ar ? "إظهار اسم النشاط" : "Show Business Name"}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={design.showCustomerName}
                    onChange={(e) => updateDesign({ showCustomerName: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-sm">
                    {ar ? "إظهار اسم العميل" : "Show Customer Name"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">
              {ar ? "تصاميم جاهزة" : "Quick Presets"}
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateDesign({
                  primaryColor: "#7c3aed",
                  secondaryColor: "#0ea5e9",
                  backgroundColor: "#1e1e2e",
                  textColor: "#ffffff",
                  backgroundStyle: "gradient",
                })}
                className="h-20 rounded-xl border border-(--surface-border) hover:border-accent transition"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #0ea5e9)",
                }}
              >
                <span className="text-white text-xs font-medium">
                  {ar ? "بنفسجي وأزرق" : "Purple & Blue"}
                </span>
              </button>

              <button
                onClick={() => updateDesign({
                  primaryColor: "#dc2626",
                  secondaryColor: "#f59e0b",
                  backgroundColor: "#1a1a1a",
                  textColor: "#ffffff",
                  backgroundStyle: "gradient",
                })}
                className="h-20 rounded-xl border border-(--surface-border) hover:border-accent transition"
                style={{
                  background: "linear-gradient(135deg, #dc2626, #f59e0b)",
                }}
              >
                <span className="text-white text-xs font-medium">
                  {ar ? "أحمر وذهبي" : "Red & Gold"}
                </span>
              </button>

              <button
                onClick={() => updateDesign({
                  primaryColor: "#059669",
                  secondaryColor: "#10b981",
                  backgroundColor: "#f0fdf4",
                  textColor: "#064e3b",
                  backgroundStyle: "solid",
                })}
                className="h-20 rounded-xl border border-(--surface-border) hover:border-accent transition"
                style={{
                  background: "linear-gradient(135deg, #059669, #10b981)",
                }}
              >
                <span className="text-white text-xs font-medium">
                  {ar ? "أخضر طبيعي" : "Fresh Green"}
                </span>
              </button>

              <button
                onClick={() => updateDesign({
                  primaryColor: "#1e293b",
                  secondaryColor: "#475569",
                  backgroundColor: "#0f172a",
                  textColor: "#f1f5f9",
                  backgroundStyle: "solid",
                })}
                className="h-20 rounded-xl border border-(--surface-border) hover:border-accent transition"
                style={{
                  background: "linear-gradient(135deg, #1e293b, #475569)",
                }}
              >
                <span className="text-white text-xs font-medium">
                  {ar ? "أسود راقي" : "Elegant Dark"}
                </span>
              </button>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            variant="primary"
            size="md"
            className="w-full"
          >
            {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التصميم" : "Save Design")}
          </Button>

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

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 p-1 bg-(--surface) rounded-xl border border-(--surface-border)">
            <button
              onClick={() => setActivePreview("ios")}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition ${
                activePreview === "ios"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-(--muted-foreground) hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                {ar ? "آيفون" : "iOS"}
              </span>
            </button>
            <button
              onClick={() => setActivePreview("android")}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition ${
                activePreview === "android"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-(--muted-foreground) hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.5 11.5 0 0 0-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C4.53 11.1 3.01 13.42 3 16h18c-.01-2.58-1.53-4.9-3.4-6.52zM7 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                </svg>
                {ar ? "أندرويد" : "Android"}
              </span>
            </button>
          </div>

          {/* Card Preview */}
          <div className="relative rounded-2xl border border-(--surface-border) bg-(--surface) p-8 min-h-150 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-2xl opacity-5"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            />

            {activePreview === "ios" ? (
              <IOSCardPreview
                design={design}
                businessName={businessName}
                logoUrl={logoUrl}
                points={samplePoints}
                customerName={sampleCustomerName}
                ar={ar}
              />
            ) : (
              <AndroidCardPreview
                design={design}
                businessName={businessName}
                logoUrl={logoUrl}
                points={samplePoints}
                customerName={sampleCustomerName}
                ar={ar}
              />
            )}
          </div>

          <div className="text-xs text-center text-(--muted-foreground)">
            {ar
              ? "المعاينة تقريبية. قد يختلف المظهر الفعلي حسب إعدادات الجهاز."
              : "Preview is approximate. Actual appearance may vary by device settings."}
          </div>
        </div>
      </div>
    </div>
  );
}

// iOS Wallet Card Preview Component
function IOSCardPreview({
  design,
  businessName,
  logoUrl,
  points,
  customerName,
  ar,
}: {
  design: CardDesign;
  businessName: string;
  logoUrl?: string | null;
  points: number;
  customerName: string;
  ar: boolean;
}) {
  const getBackground = () => {
    if (design.backgroundStyle === "gradient") {
      return `linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor})`;
    }
    if (design.backgroundStyle === "pattern") {
      return `${design.backgroundColor} url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodeURIComponent(design.primaryColor)}' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`;
    }
    return design.backgroundColor;
  };

  return (
    <div className="w-full max-w-85">
      {/* iOS Device Frame */}
      <div className="relative mx-auto" style={{ width: "340px", height: "560px" }}>
        {/* Device */}
        <div className="absolute inset-0 rounded-[40px] bg-black shadow-2xl border-8 border-gray-900">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />
          
          {/* Screen */}
          <div className="absolute inset-2 rounded-4xl bg-gray-100 overflow-hidden">
            {/* Status Bar */}
            <div className="h-12 bg-white/95 backdrop-blur flex items-center justify-between px-6 pt-2">
              <span className="text-xs font-semibold">9:41</span>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 20h-2v-1h2v1zm3.33-3H7.67V6h8.67v11z"/>
                </svg>
              </div>
            </div>

            {/* Wallet Card */}
            <div className="p-4 pt-2">
              <div
                className="relative overflow-hidden shadow-xl"
                style={{
                  background: getBackground(),
                  borderRadius: `${design.cornerRadius}px`,
                  color: design.textColor,
                  height: "420px",
                }}
              >
                {/* Card Content */}
                <div className="relative h-full p-6 flex flex-col">
                  {/* Logo */}
                  {logoUrl && (
                    <div
                      className={`${
                        design.logoPosition === "top"
                          ? "flex justify-center mb-4"
                          : design.logoPosition === "corner"
                          ? "absolute top-4 right-4"
                          : "flex-1 flex items-center justify-center"
                      }`}
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/10 backdrop-blur border border-white/20">
                        <Image
                          src={logoUrl}
                          alt={businessName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Business Name */}
                  {design.showBusinessName && design.logoPosition !== "center" && (
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold opacity-90">{businessName}</h3>
                    </div>
                  )}

                  {/* Points Section */}
                  <div className={`${design.logoPosition === "center" ? "mt-auto" : "flex-1 flex flex-col justify-center"}`}>
                    <div className="text-center">
                      <div className="text-sm opacity-70 mb-2">
                        {ar ? "نقاط الولاء" : "Loyalty Points"}
                      </div>
                      <div className="text-6xl font-bold mb-4" style={{ 
                        background: `linear-gradient(to right, ${design.textColor}, ${design.textColor}99)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>
                        {points}
                      </div>
                      
                      {/* Visual Points */}
                      <div className="flex justify-center gap-2 flex-wrap max-w-50 mx-auto">
                        {Array.from({ length: Math.min(points, 12) }).map((_, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full opacity-80"
                            style={{
                              background: `linear-gradient(135deg, ${design.textColor}44, ${design.textColor}22)`,
                              border: `1.5px solid ${design.textColor}66`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customer Name */}
                  {design.showCustomerName && (
                    <div className="mt-auto pt-4 border-t border-white/20">
                      <div className="text-xs opacity-60 mb-1">
                        {ar ? "العميل" : "Member"}
                      </div>
                      <div className="text-base font-semibold opacity-90">
                        {customerName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Android Wallet Card Preview Component
function AndroidCardPreview({
  design,
  businessName,
  logoUrl,
  points,
  customerName,
  ar,
}: {
  design: CardDesign;
  businessName: string;
  logoUrl?: string | null;
  points: number;
  customerName: string;
  ar: boolean;
}) {
  const getBackground = () => {
    if (design.backgroundStyle === "gradient") {
      return `linear-gradient(135deg, ${design.primaryColor}, ${design.secondaryColor})`;
    }
    if (design.backgroundStyle === "pattern") {
      return `${design.backgroundColor} url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodeURIComponent(design.primaryColor)}' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`;
    }
    return design.backgroundColor;
  };

  return (
    <div className="w-full max-w-85">
      {/* Android Device Frame */}
      <div className="relative mx-auto" style={{ width: "340px", height: "560px" }}>
        {/* Device */}
        <div className="absolute inset-0 rounded-4xl bg-black shadow-2xl border-4 border-gray-800">
          {/* Screen */}
          <div className="absolute inset-1 rounded-[28px] bg-white overflow-hidden">
            {/* Status Bar */}
            <div className="h-8 bg-black text-white flex items-center justify-between px-4">
              <span className="text-xs font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                </svg>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
                </svg>
              </div>
            </div>

            {/* Google Wallet Header */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.8 12.03c0-.73-.07-1.42-.2-2.1H12v3.98h5.5c-.24 1.27-.96 2.34-2.03 3.06v2.56h3.28c1.92-1.77 3.05-4.38 3.05-7.5z"/>
                <path d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.28-2.56c-.9.6-2.06.96-3.36.96-2.58 0-4.77-1.74-5.55-4.08H3.05v2.64C4.7 19.78 8.1 22 12 22z"/>
                <path d="M6.45 13.89c-.2-.6-.32-1.23-.32-1.89s.11-1.29.32-1.89V7.47H3.05C2.38 8.8 2 10.35 2 12s.38 3.2 1.05 4.53l3.4-2.64z"/>
                <path d="M12 6.03c1.46 0 2.76.5 3.78 1.48l2.84-2.84C17.01 3.03 14.73 2 12 2 8.1 2 4.7 4.22 3.05 7.47l3.4 2.64C7.23 7.77 9.42 6.03 12 6.03z"/>
              </svg>
              <span className="ml-2 text-sm font-medium text-gray-800">Google Wallet</span>
            </div>

            {/* Card Container */}
            <div className="p-4 bg-gray-50" style={{ height: "calc(100% - 88px)", overflowY: "auto" }}>
              {/* Wallet Card */}
              <div
                className="relative overflow-hidden shadow-lg"
                style={{
                  background: getBackground(),
                  borderRadius: `${design.cornerRadius}px`,
                  color: design.textColor,
                  minHeight: "400px",
                }}
              >
                {/* Card Content */}
                <div className="relative p-5 flex flex-col min-h-100">
                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-6">
                    {logoUrl && design.logoPosition === "corner" && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/10 backdrop-blur border border-white/20">
                        <Image
                          src={logoUrl}
                          alt={businessName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {design.showBusinessName && (
                      <div className={`${design.logoPosition === "corner" ? "text-right" : "text-center w-full"}`}>
                        <h3 className="text-base font-bold opacity-90">{businessName}</h3>
                      </div>
                    )}
                  </div>

                  {/* Logo (center or top) */}
                  {logoUrl && (design.logoPosition === "top" || design.logoPosition === "center") && (
                    <div className={`${design.logoPosition === "center" ? "flex-1 flex items-center justify-center" : "flex justify-center mb-4"}`}>
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/10 backdrop-blur border border-white/20">
                        <Image
                          src={logoUrl}
                          alt={businessName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Points Section */}
                  <div className={`${design.logoPosition === "center" ? "" : "flex-1 flex flex-col justify-center"}`}>
                    <div className="text-center mb-6">
                      <div className="text-xs opacity-70 uppercase tracking-wider mb-3">
                        {ar ? "نقاط الولاء" : "Loyalty Points"}
                      </div>
                      <div className="text-7xl font-black mb-4" style={{
                        background: `linear-gradient(to bottom, ${design.textColor}, ${design.textColor}cc)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                      }}>
                        {points}
                      </div>

                      {/* Points Visualization - Android style */}
                      <div className="grid grid-cols-6 gap-2 max-w-45 mx-auto">
                        {Array.from({ length: Math.min(points, 12) }).map((_, i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-md"
                            style={{
                              background: `linear-gradient(135deg, ${design.textColor}55, ${design.textColor}33)`,
                              border: `1px solid ${design.textColor}66`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {design.showCustomerName && (
                    <div className="mt-auto pt-4 border-t" style={{ borderColor: `${design.textColor}33` }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] opacity-60 uppercase tracking-wider mb-1">
                            {ar ? "العضو" : "Member"}
                          </div>
                          <div className="text-sm font-bold opacity-90">
                            {customerName}
                          </div>
                        </div>
                        <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions (Android style) */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="h-10 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition">
                  {ar ? "التفاصيل" : "Details"}
                </button>
                <button className="h-10 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 transition">
                  {ar ? "مشاركة" : "Share"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
