"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Barcode from "react-barcode";
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

type WalletBarcodeFormat = "qr" | "code128";

type WalletContent = {
  walletPassDescription: string;
  walletPassTerms: string;
  walletWebsiteUrl: string;
  walletSupportEmail: string;
  walletSupportPhone: string;
  walletAddress: string;
  walletBarcodeFormat: WalletBarcodeFormat;
  walletBarcodeMessage: string;
  walletNotificationTitle: string;
  walletNotificationBody: string;
};

const defaultDesign: CardDesign = {
  primaryColor: "#1E40AF",
  secondaryColor: "#3B82F6",
  textColor: "#ffffff",
  backgroundColor: "#1E40AF",
  backgroundStyle: "solid",
  logoPosition: "corner",
  showBusinessName: true,
  showCustomerName: true,
  cornerRadius: 12,
};

const defaultWalletContent: WalletContent = {
  walletPassDescription: "Show this card at checkout to earn points.",
  walletPassTerms: "Terms: Points are non-transferable. Subject to change without notice.",
  walletWebsiteUrl: "",
  walletSupportEmail: "",
  walletSupportPhone: "",
  walletAddress: "",
  walletBarcodeFormat: "qr",
  walletBarcodeMessage: "SBC-LOYALTY-000123",
  walletNotificationTitle: "Loyalty update",
  walletNotificationBody: "Your loyalty points balance has been updated.",
};

// Professional presets inspired by real wallet passes
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
    },
  },
};

interface Props {
  locale: Locale;
  businessName: string;
  logoUrl?: string | null;
  onSave?: (design: CardDesign) => Promise<void>;
  initialDesign?: Partial<CardDesign>;
  initialWallet?: Partial<WalletContent>;
}

export function LoyaltyCardDesigner({
  locale,
  businessName,
  logoUrl,
  onSave,
  initialDesign,
  initialWallet,
}: Props) {
  const ar = locale === "ar";
  const [design, setDesign] = useState<CardDesign>(() => {
    const defined = Object.fromEntries(
      Object.entries(initialDesign ?? {}).filter(([, v]) => v !== undefined)
    ) as Partial<CardDesign>;
    return { ...defaultDesign, ...defined };
  });
  const [wallet, setWallet] = useState<WalletContent>(() => {
    const defined = Object.fromEntries(
      Object.entries(initialWallet ?? {}).filter(([, v]) => v !== undefined)
    ) as Partial<WalletContent>;
    return { ...defaultWalletContent, ...defined } as WalletContent;
  });
  const [activePreview, setActivePreview] = useState<"ios" | "android" | "notification">("ios");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const updateDesign = (updates: Partial<CardDesign>) => {
    setDesign((prev) => ({ ...prev, ...updates }));
  };

  const updateWallet = (updates: Partial<WalletContent>) => {
    setWallet((prev) => ({ ...prev, ...updates }));
  };

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setDesign((prev) => ({
      ...prev,
      ...preset.design,
      showBusinessName: prev.showBusinessName,
      showCustomerName: prev.showCustomerName,
    }));
  };

  useEffect(() => {
    let canceled = false;

    async function run() {
      if (wallet.walletBarcodeFormat !== "qr") {
        setQrDataUrl(null);
        return;
      }

      const message = (wallet.walletBarcodeMessage ?? "").trim();
      if (!message) {
        setQrDataUrl(null);
        return;
      }

      try {
        const qr = await import("qrcode");
        const dataUrl = await qr.toDataURL(message, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 260,
          color: { dark: "#111111", light: "#ffffff" },
        });
        if (!canceled) setQrDataUrl(dataUrl);
      } catch (e) {
        console.error("Failed to generate QR:", e);
        if (!canceled) setQrDataUrl(null);
      }
    }

    run();
    return () => {
      canceled = true;
    };
  }, [wallet.walletBarcodeFormat, wallet.walletBarcodeMessage]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const walletPatch: Record<string, unknown> = {};
      const setIfNonEmpty = (key: keyof WalletContent) => {
        const value = String(wallet[key] ?? "").trim();
        if (value) walletPatch[key] = value;
      };

      setIfNonEmpty("walletPassDescription");
      setIfNonEmpty("walletPassTerms");
      setIfNonEmpty("walletWebsiteUrl");
      setIfNonEmpty("walletSupportEmail");
      setIfNonEmpty("walletSupportPhone");
      setIfNonEmpty("walletAddress");
      setIfNonEmpty("walletBarcodeMessage");
      setIfNonEmpty("walletNotificationTitle");
      setIfNonEmpty("walletNotificationBody");
      walletPatch.walletBarcodeFormat = wallet.walletBarcodeFormat;

      const [designRes, settingsRes] = await Promise.all([
        fetch("/api/loyalty/card-design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(design),
        }),
        fetch("/api/loyalty/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(walletPatch),
        }),
      ]);

      const designJson = await designRes.json().catch(() => null);
      const settingsJson = await settingsRes.json().catch(() => null);

      if (!designRes.ok) {
        const msg = designJson?.error || "Failed to save design";
        throw new Error(msg);
      }
      if (!settingsRes.ok || settingsJson?.ok === false) {
        const msg = settingsJson?.error || "Failed to save wallet fields";
        throw new Error(msg);
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
      setTimeout(() => setMessage(null), 3000);
    }
  };

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
          {/* Quick Presets - Moved to top for better UX */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">
              {ar ? "قوالب جاهزة" : "Quick Presets"}
            </h4>
            
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(PRESETS) as [keyof typeof PRESETS, typeof PRESETS[keyof typeof PRESETS]][]).map(([key, preset]) => {
                const isActive = 
                  design.primaryColor === preset.design.primaryColor &&
                  design.backgroundColor === preset.design.backgroundColor;
                
                return (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      isActive 
                        ? "border-accent ring-2 ring-accent/30 scale-105" 
                        : "border-transparent hover:border-accent/50 hover:scale-102"
                    }`}
                    style={{
                      background: preset.design.backgroundStyle === "gradient"
                        ? `linear-gradient(135deg, ${preset.design.primaryColor}, ${preset.design.secondaryColor})`
                        : preset.design.backgroundColor,
                    }}
                    title={preset.name[ar ? "ar" : "en"]}
                  >
                    <span 
                      className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold px-1 text-center leading-tight"
                      style={{ color: preset.design.textColor }}
                    >
                      {preset.name[ar ? "ar" : "en"]}
                    </span>
                    {isActive && (
                      <div className="absolute top-1 right-1">
                        <svg className="w-3 h-3 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

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

          {/* Pass Details */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">{ar ? "معلومات البطاقة" : "Pass details"}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "الوصف" : "Description"}
                </label>
                <textarea
                  value={wallet.walletPassDescription ?? ""}
                  onChange={(e) => updateWallet({ walletPassDescription: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "الشروط" : "Terms"}
                </label>
                <textarea
                  value={wallet.walletPassTerms ?? ""}
                  onChange={(e) => updateWallet({ walletPassTerms: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "الموقع الإلكتروني" : "Website"}
                  </label>
                  <input
                    type="url"
                    value={wallet.walletWebsiteUrl ?? ""}
                    onChange={(e) => updateWallet({ walletWebsiteUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "هاتف الدعم" : "Support phone"}
                  </label>
                  <input
                    type="tel"
                    value={wallet.walletSupportPhone ?? ""}
                    onChange={(e) => updateWallet({ walletSupportPhone: e.target.value })}
                    placeholder={ar ? "+966..." : "+1..."}
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "بريد الدعم" : "Support email"}
                  </label>
                  <input
                    type="email"
                    value={wallet.walletSupportEmail ?? ""}
                    onChange={(e) => updateWallet({ walletSupportEmail: e.target.value })}
                    placeholder="support@..."
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-(--muted-foreground) mb-2">
                    {ar ? "العنوان" : "Address"}
                  </label>
                  <input
                    type="text"
                    value={wallet.walletAddress ?? ""}
                    onChange={(e) => updateWallet({ walletAddress: e.target.value })}
                    placeholder={ar ? "المدينة، الشارع..." : "City, street..."}
                    className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Barcode */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">{ar ? "الباركود / QR" : "Barcode / QR"}</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateWallet({ walletBarcodeFormat: "qr" })}
                  className={`h-10 rounded-lg border text-xs font-medium transition ${
                    wallet.walletBarcodeFormat === "qr"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-(--surface-border) hover:border-accent/50"
                  }`}
                >
                  QR
                </button>
                <button
                  onClick={() => updateWallet({ walletBarcodeFormat: "code128" })}
                  className={`h-10 rounded-lg border text-xs font-medium transition ${
                    wallet.walletBarcodeFormat === "code128"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-(--surface-border) hover:border-accent/50"
                  }`}
                >
                  CODE128
                </button>
              </div>

              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "محتوى الباركود" : "Barcode value"}
                </label>
                <input
                  type="text"
                  value={wallet.walletBarcodeMessage ?? ""}
                  onChange={(e) => updateWallet({ walletBarcodeMessage: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                />
              </div>

              <div className="rounded-xl border border-(--surface-border) bg-white p-3 flex items-center justify-center overflow-hidden">
                {wallet.walletBarcodeFormat === "qr" ? (
                  qrDataUrl ? (
                    <Image src={qrDataUrl} alt="QR" width={170} height={170} unoptimized />
                  ) : (
                    <div className="text-xs text-gray-600">{ar ? "جارٍ إنشاء QR..." : "Generating QR..."}</div>
                  )
                ) : (
                  <Barcode
                    value={(wallet.walletBarcodeMessage || "SBC-LOYALTY-000123").slice(0, 80)}
                    format="CODE128"
                    width={2}
                    height={70}
                    displayValue={true}
                    fontSize={12}
                    margin={10}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Notification Template */}
          <div className="rounded-xl border border-(--surface-border) bg-(--surface) p-5">
            <h4 className="text-sm font-semibold mb-4">{ar ? "نموذج الإشعار" : "Notification template"}</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "عنوان الإشعار" : "Title"}
                </label>
                <input
                  type="text"
                  value={wallet.walletNotificationTitle ?? ""}
                  onChange={(e) => updateWallet({ walletNotificationTitle: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-(--muted-foreground) mb-2">
                  {ar ? "نص الإشعار" : "Body"}
                </label>
                <textarea
                  value={wallet.walletNotificationBody ?? ""}
                  onChange={(e) => updateWallet({ walletNotificationBody: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm"
                />
              </div>
              <div className="text-xs text-(--muted-foreground)">
                {ar
                  ? "تظهر المعاينة في تب الإشعار."
                  : "Preview it in the Notification tab."}
              </div>
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

            <button
              onClick={() => setActivePreview("notification")}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition ${
                activePreview === "notification"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-(--muted-foreground) hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2z" />
                </svg>
                {ar ? "إشعار" : "Notification"}
              </span>
            </button>
          </div>

          {/* Card Preview */}
          <div className="relative rounded-2xl border border-(--surface-border) bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 min-h-[640px] flex items-center justify-center overflow-hidden">
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, rgba(120,120,120,0.1) 0%, transparent 50%), 
                                  radial-gradient(circle at 75% 75%, rgba(120,120,120,0.1) 0%, transparent 50%)`,
              }}
            />

            {activePreview === "ios" ? (
              <IOSWalletPreview
                design={design}
                businessName={businessName}
                logoUrl={logoUrl}
                points={samplePoints}
                customerName={sampleCustomerName}
                ar={ar}
                wallet={wallet}
                qrDataUrl={qrDataUrl}
              />
            ) : activePreview === "android" ? (
              <AndroidWalletPreview
                design={design}
                businessName={businessName}
                logoUrl={logoUrl}
                points={samplePoints}
                customerName={sampleCustomerName}
                ar={ar}
                wallet={wallet}
                qrDataUrl={qrDataUrl}
              />
            ) : (
              <NotificationPreview businessName={businessName} logoUrl={logoUrl} wallet={wallet} />
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

// iOS Wallet Pass Preview - Styled like real Apple Wallet passes
function IOSWalletPreview({
  design,
  businessName,
  logoUrl,
  points,
  customerName,
  ar,
  wallet,
  qrDataUrl,
}: {
  design: CardDesign;
  businessName: string;
  logoUrl?: string | null;
  points: number;
  customerName: string;
  ar: boolean;
  wallet: WalletContent;
  qrDataUrl: string | null;
}) {
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
      {/* iPhone Frame */}
      <div className="rounded-[48px] bg-gray-900 p-[10px] shadow-2xl ring-1 ring-gray-800">
        {/* Dynamic Island */}
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[100px] h-[32px] bg-black rounded-full z-20" />
        
        {/* Screen */}
        <div className="rounded-[38px] bg-gray-100 overflow-hidden">
          {/* Status Bar */}
          <div className="h-[52px] flex items-end justify-between px-8 pb-1 bg-gray-50">
            <span className="text-[15px] font-semibold text-gray-900">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-[18px] h-[18px] text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/>
              </svg>
              <svg className="w-[18px] h-[18px] text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 4h-3V2h-4v2H7v18h10V4zm-3 16h-4v-2h4v2zm0-4h-4V8h4v8z"/>
              </svg>
            </div>
          </div>

          {/* Wallet Header */}
          <div className="h-[44px] flex items-center justify-between px-4 bg-gray-50 border-b border-gray-200/60">
            <span className="text-[17px] text-blue-500 font-normal">Done</span>
            <button className="w-[30px] h-[30px] rounded-full bg-gray-200/80 flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>

          {/* Pass Card */}
          <div className="p-4 bg-white">
            <div
              className="relative overflow-hidden shadow-xl"
              style={{
                background: getBackground(),
                borderRadius: `${design.cornerRadius}px`,
                color: design.textColor,
              }}
            >
              {/* Header Strip */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between">
                  {/* Logo & Business Name */}
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <div 
                        className="relative w-[44px] h-[44px] rounded-[10px] overflow-hidden flex-shrink-0"
                        style={{ background: `${design.textColor}15` }}
                      >
                        <Image
                          src={logoUrl}
                          alt={businessName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {design.showBusinessName && (
                      <div>
                        <div className="text-[17px] font-semibold tracking-tight leading-tight">
                          {businessName}
                        </div>
                        <div className="text-[13px] opacity-70 mt-0.5">
                          {ar ? "بطاقة ولاء" : "Loyalty Card"}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Points Badge (Top Right) */}
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider opacity-60">
                      {ar ? "النقاط" : "POINTS"}
                    </div>
                    <div className="text-[28px] font-bold leading-none mt-0.5 tabular-nums">
                      {points}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content - Points Display */}
              <div className="px-5 py-6">
                <div className="text-center">
                  <div className="text-[11px] uppercase tracking-widest opacity-50 mb-2">
                    {ar ? "رصيد النقاط" : "POINTS BALANCE"}
                  </div>
                  <div className="text-[72px] font-black leading-none tabular-nums">
                    {points}
                  </div>
                  <div className="text-[13px] uppercase tracking-wider opacity-60 mt-2">
                    {ar ? "نقطة ولاء" : "LOYALTY POINTS"}
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider opacity-50 mb-2">
                    <span>{ar ? "التقدم" : "PROGRESS"}</span>
                    <span>{Math.min(points, 10)}/10</span>
                  </div>
                  <div 
                    className="h-[6px] rounded-full overflow-hidden"
                    style={{ background: `${design.textColor}20` }}
                  >
                    <div 
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${Math.min((points / 10) * 100, 100)}%`,
                        background: design.textColor,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-center opacity-50 mt-2">
                    {points >= 10 
                      ? (ar ? "🎉 حصلت على مكافأة!" : "🎉 You earned a reward!") 
                      : (ar ? `${10 - Math.min(points, 10)} نقاط للمكافأة` : `${10 - Math.min(points, 10)} points to reward`)}
                  </div>
                </div>
              </div>

              {/* Member Info Strip */}
              {design.showCustomerName && (
                <div 
                  className="mx-5 mb-4 px-4 py-3 rounded-xl"
                  style={{ background: `${design.textColor}10` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider opacity-50">
                        {ar ? "العضو" : "MEMBER"}
                      </div>
                      <div className="text-[15px] font-semibold mt-0.5">
                        {customerName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider opacity-50">
                        {ar ? "منذ" : "SINCE"}
                      </div>
                      <div className="text-[15px] font-semibold mt-0.5">
                        2024
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Barcode Section */}
              <div className="bg-white mx-4 mb-4 rounded-xl overflow-hidden">
                <div className="p-4 flex flex-col items-center">
                  {wallet.walletBarcodeFormat === "qr" ? (
                    qrDataUrl ? (
                      <Image src={qrDataUrl} alt="QR" width={140} height={140} unoptimized />
                    ) : (
                      <div className="w-[140px] h-[140px] bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-xs text-gray-400">QR Code</div>
                      </div>
                    )
                  ) : (
                    <Barcode
                      value={(wallet.walletBarcodeMessage || "SBC-LOYALTY-000123").slice(0, 80)}
                      format="CODE128"
                      width={2}
                      height={50}
                      displayValue={false}
                      margin={0}
                    />
                  )}
                  <div className="mt-2 text-[12px] text-gray-500 font-mono tracking-wide">
                    {wallet.walletBarcodeMessage || "SBC-LOYALTY-000123"}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Safe Area */}
          <div className="h-[34px] bg-white" />
        </div>
      </div>
    </div>
  );
}

// Android Google Wallet Preview
function AndroidWalletPreview({
  design,
  businessName,
  logoUrl,
  points,
  customerName,
  ar,
  wallet,
  qrDataUrl,
}: {
  design: CardDesign;
  businessName: string;
  logoUrl?: string | null;
  points: number;
  customerName: string;
  ar: boolean;
  wallet: WalletContent;
  qrDataUrl: string | null;
}) {
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
      {/* Android Phone Frame */}
      <div className="rounded-[36px] bg-gray-900 p-[6px] shadow-2xl ring-1 ring-gray-800">
        {/* Screen */}
        <div className="rounded-[30px] bg-white overflow-hidden">
          {/* Status Bar */}
          <div className="h-[28px] bg-gray-900 flex items-center justify-between px-6">
            <span className="text-[12px] font-medium text-white">9:41</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/>
              </svg>
              <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 4h-3V2h-4v2H7v18h10V4z"/>
              </svg>
            </div>
          </div>

          {/* Google Wallet Header */}
          <div className="h-[56px] flex items-center px-4 border-b border-gray-100 bg-white">
            <button className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <svg className="w-[24px] h-[24px] text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3 ml-4">
              <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-[18px] font-medium text-gray-800">Wallet</span>
            </div>
          </div>

          {/* Card Container */}
          <div className="p-4 bg-gray-100 min-h-[520px]">
            {/* Pass Card */}
            <div
              className="relative overflow-hidden shadow-lg"
              style={{
                background: getBackground(),
                borderRadius: `${design.cornerRadius}px`,
                color: design.textColor,
              }}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between">
                  {/* Logo & Name */}
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <div 
                        className="relative w-[48px] h-[48px] rounded-[12px] overflow-hidden flex-shrink-0"
                        style={{ background: `${design.textColor}15` }}
                      >
                        <Image
                          src={logoUrl}
                          alt={businessName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {design.showBusinessName && (
                      <div>
                        <div className="text-[16px] font-semibold">
                          {businessName}
                        </div>
                        <div className="text-[13px] opacity-60 mt-0.5">
                          {ar ? "بطاقة ولاء" : "Loyalty Card"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Menu */}
                  <button 
                    className="p-2 rounded-full"
                    style={{ background: `${design.textColor}15` }}
                  >
                    <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Points Display */}
              <div className="px-5 pb-5">
                <div className="py-8 text-center">
                  <div className="text-[64px] font-black leading-none tabular-nums">
                    {points}
                  </div>
                  <div className="text-[14px] uppercase tracking-wider opacity-60 mt-2">
                    {ar ? "نقطة ولاء" : "Loyalty Points"}
                  </div>
                </div>

                {/* Progress */}
                <div 
                  className="py-4 border-t border-b"
                  style={{ borderColor: `${design.textColor}20` }}
                >
                  <div className="flex items-center justify-between text-[12px] opacity-60 mb-3">
                    <span>{ar ? "التقدم نحو المكافأة" : "Progress to reward"}</span>
                    <span>{Math.min(points, 10)}/10</span>
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-[8px] rounded-full transition-all duration-300"
                        style={{
                          background: i < Math.min(points, 10) 
                            ? design.textColor 
                            : `${design.textColor}25`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Member Info */}
                {design.showCustomerName && (
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider opacity-50">
                        {ar ? "العضو" : "Member"}
                      </div>
                      <div className="text-[15px] font-semibold mt-1">
                        {customerName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-wider opacity-50">
                        {ar ? "المستوى" : "Tier"}
                      </div>
                      <div className="text-[15px] font-semibold mt-1">
                        {points >= 10 ? (ar ? "ذهبي" : "Gold") : ar ? "فضي" : "Silver"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Barcode */}
              <div className="bg-white p-4">
                <div className="flex flex-col items-center">
                  {wallet.walletBarcodeFormat === "qr" ? (
                    qrDataUrl ? (
                      <Image src={qrDataUrl} alt="QR" width={120} height={120} unoptimized />
                    ) : (
                      <div className="w-[120px] h-[120px] bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-xs text-gray-400">QR Code</div>
                      </div>
                    )
                  ) : (
                    <Barcode
                      value={(wallet.walletBarcodeMessage || "SBC-LOYALTY-000123").slice(0, 80)}
                      format="CODE128"
                      width={2}
                      height={45}
                      displayValue={false}
                      margin={0}
                    />
                  )}
                  <div className="mt-2 text-[12px] text-gray-500 font-mono">
                    {wallet.walletBarcodeMessage || "SBC-LOYALTY-000123"}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-3">
              <button className="flex-1 h-[44px] rounded-full bg-white border border-gray-200 text-gray-700 text-[14px] font-medium shadow-sm">
                {ar ? "التفاصيل" : "Details"}
              </button>
              <button className="flex-1 h-[44px] rounded-full bg-white border border-gray-200 text-gray-700 text-[14px] font-medium shadow-sm">
                {ar ? "مشاركة" : "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationPreview({
  businessName,
  logoUrl,
  wallet,
}: {
  businessName: string;
  logoUrl?: string | null;
  wallet: WalletContent;
}) {
  return (
    <div className="w-full max-w-[340px] mx-auto relative z-10">
      {/* iPhone Frame */}
      <div className="rounded-[48px] bg-gray-900 p-[10px] shadow-2xl ring-1 ring-gray-800">
        {/* Dynamic Island */}
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[100px] h-[32px] bg-black rounded-full z-20" />
        
        {/* Screen - Lock Screen Style */}
        <div 
          className="rounded-[38px] overflow-hidden min-h-[600px]"
          style={{
            background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        >
          {/* Status Bar */}
          <div className="h-[52px] flex items-end justify-between px-8 pb-1">
            <span className="text-[15px] font-semibold text-white">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/>
              </svg>
              <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 4h-3V2h-4v2H7v18h10V4zm-3 16h-4v-2h4v2zm0-4h-4V8h4v8z"/>
              </svg>
            </div>
          </div>

          {/* Lock Screen Content */}
          <div className="px-6 pt-10 pb-6">
            {/* Time */}
            <div className="text-center mb-2">
              <div className="text-[80px] font-light text-white tracking-tight leading-none">
                9:41
              </div>
              <div className="text-[20px] text-white/70 mt-2">
                Wednesday, February 5
              </div>
            </div>

            {/* Notification */}
            <div className="mt-10 rounded-[20px] bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* App Icon */}
                  <div className="relative w-[44px] h-[44px] rounded-[10px] overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                    {logoUrl ? (
                      <Image src={logoUrl} alt={businessName} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500 text-white text-[18px] font-bold">
                        {businessName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                        {businessName}
                      </div>
                      <div className="text-[12px] text-gray-400">now</div>
                    </div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-1">
                      {wallet.walletNotificationTitle?.trim() || "Loyalty Update"}
                    </div>
                    <div className="text-[15px] text-gray-600 mt-0.5 leading-snug">
                      {wallet.walletNotificationBody?.trim() || "Your points balance has been updated."}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Older notification placeholder */}
            <div className="mt-3 opacity-40">
              <div className="rounded-[16px] bg-white/20 backdrop-blur-sm p-3">
                <div className="flex items-center gap-3">
                  <div className="w-[36px] h-[36px] rounded-[8px] bg-white/30" />
                  <div className="flex-1">
                    <div className="h-[10px] w-[80px] rounded bg-white/30" />
                    <div className="h-[10px] w-[140px] rounded bg-white/20 mt-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2">
            <div className="w-[140px] h-[5px] rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
