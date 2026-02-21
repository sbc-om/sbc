"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Barcode from "react-barcode";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";
import type { LoyaltyCardTemplate, LoyaltyProfile } from "@/lib/db/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Design = LoyaltyCardTemplate["design"];
type PassContent = LoyaltyCardTemplate["passContent"];
type BarcodeConfig = LoyaltyCardTemplate["barcode"];
type Support = NonNullable<LoyaltyCardTemplate["support"]>;

interface Props {
  locale: Locale;
  profile: LoyaltyProfile | null;
  /** Existing default template to edit (null = create new) */
  template: LoyaltyCardTemplate | null;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_DESIGN: Design = {
  primaryColor: "#1E40AF",
  secondaryColor: "#3B82F6",
  textColor: "#FFFFFF",
  backgroundColor: "#1E40AF",
  backgroundStyle: "solid",
  logoPosition: "corner",
  showBusinessName: true,
  showCustomerName: true,
  cornerRadius: 12,
};

const DEFAULT_PASS: PassContent = {
  programName: "Loyalty Program",
  pointsLabel: "Points",
  headerLabel: "MEMBER",
  headerValue: "",
  secondaryLabel: "Status",
  secondaryValue: "Active",
  auxFields: [],
  backFields: [],
};

const DEFAULT_BARCODE: BarcodeConfig = {
  format: "qr",
  messageTemplate: "{{memberId}}",
  altTextTemplate: "{{memberId}}",
};

const DEFAULT_SUPPORT: Support = {};

/* ------------------------------------------------------------------ */
/*  Presets                                                            */
/* ------------------------------------------------------------------ */

const PRESETS = {
  airline: {
    name: { en: "Airline Blue", ar: "أزرق طيران" },
    design: { primaryColor: "#1E40AF", secondaryColor: "#3B82F6", backgroundColor: "#1E40AF", textColor: "#FFFFFF", backgroundStyle: "solid" as const },
  },
  coffee: {
    name: { en: "Coffee Shop", ar: "مقهى" },
    design: { primaryColor: "#166534", secondaryColor: "#22C55E", backgroundColor: "#166534", textColor: "#FFFFFF", backgroundStyle: "solid" as const },
  },
  luxury: {
    name: { en: "Luxury Gold", ar: "ذهبي فاخر" },
    design: { primaryColor: "#1C1917", secondaryColor: "#D4AF37", backgroundColor: "#1C1917", textColor: "#D4AF37", backgroundStyle: "solid" as const },
  },
  modern: {
    name: { en: "Modern Purple", ar: "بنفسجي عصري" },
    design: { primaryColor: "#7C3AED", secondaryColor: "#A78BFA", backgroundColor: "#7C3AED", textColor: "#FFFFFF", backgroundStyle: "gradient" as const },
  },
  sunset: {
    name: { en: "Sunset", ar: "غروب" },
    design: { primaryColor: "#EA580C", secondaryColor: "#F59E0B", backgroundColor: "#EA580C", textColor: "#FFFFFF", backgroundStyle: "gradient" as const },
  },
  ocean: {
    name: { en: "Ocean Teal", ar: "محيطي" },
    design: { primaryColor: "#0D9488", secondaryColor: "#2DD4BF", backgroundColor: "#0D9488", textColor: "#FFFFFF", backgroundStyle: "gradient" as const },
  },
  rose: {
    name: { en: "Rose Pink", ar: "وردي" },
    design: { primaryColor: "#BE185D", secondaryColor: "#F472B6", backgroundColor: "#BE185D", textColor: "#FFFFFF", backgroundStyle: "gradient" as const },
  },
  minimal: {
    name: { en: "Minimal", ar: "بسيط" },
    design: { primaryColor: "#F8FAFC", secondaryColor: "#E2E8F0", backgroundColor: "#F8FAFC", textColor: "#1E293B", backgroundStyle: "solid" as const },
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LoyaltyCardStudio({ locale, profile, template }: Props) {
  const ar = locale === "ar";
  const isNew = !template;
  const businessName = profile?.businessName ?? (ar ? "نشاطك التجاري" : "Your Business");
  const logoUrl = profile?.logoUrl;

  /* ---- state ---- */
  const [design, setDesign] = useState<Design>(template?.design ?? DEFAULT_DESIGN);
  const [passContent, setPassContent] = useState<PassContent>(template?.passContent ?? DEFAULT_PASS);
  const [barcode, setBarcode] = useState<BarcodeConfig>(template?.barcode ?? DEFAULT_BARCODE);
  const [support, setSupport] = useState<Support>(template?.support ?? DEFAULT_SUPPORT);
  const [terms, setTerms] = useState(template?.terms ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [notifTitle, setNotifTitle] = useState(template?.notificationTitle ?? (ar ? "تحديث النقاط" : "Points Updated"));
  const [notifBody, setNotifBody] = useState(template?.notificationBody ?? (ar ? "تم تحديث رصيد نقاط الولاء الخاصة بك." : "Your loyalty points balance has been updated."));

  const [activePreview, setActivePreview] = useState<"ios" | "android" | "notification">("ios");
  const [expandedSection, setExpandedSection] = useState<string | null>("presets");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; text: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  /* ---- QR generation ---- */
  useEffect(() => {
    if (barcode.format !== "qr") { setQrDataUrl(null); return; }
    let canceled = false;
    (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const url = await QRCode.toDataURL(barcode.messageTemplate || "SBC-LOYALTY", { width: 200, margin: 1 });
        if (!canceled) setQrDataUrl(url);
      } catch { if (!canceled) setQrDataUrl(null); }
    })();
    return () => { canceled = true; };
  }, [barcode.format, barcode.messageTemplate]);

  /* ---- helpers ---- */
  const ud = useCallback((u: Partial<Design>) => setDesign((p) => ({ ...p, ...u })), []);

  const applyPreset = (key: keyof typeof PRESETS) => {
    const p = PRESETS[key].design;
    ud({ primaryColor: p.primaryColor, secondaryColor: p.secondaryColor, backgroundColor: p.backgroundColor, textColor: p.textColor, backgroundStyle: p.backgroundStyle });
  };

  const toggle = (s: string) => setExpandedSection((prev) => (prev === s ? null : s));

  /* ---- save ---- */
  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload: Partial<LoyaltyCardTemplate> = {
        name: ar ? "بطاقة الولاء" : "Loyalty Card",
        isDefault: true,
        design,
        passContent,
        barcode,
        images: {},
        support,
        terms: terms || undefined,
        description: description || undefined,
        notificationTitle: notifTitle || undefined,
        notificationBody: notifBody || undefined,
      };

      // Save / update template
      const url = isNew ? "/api/loyalty/templates" : `/api/loyalty/templates/${template.id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");

      // Also sync to legacy card-design + settings for backward compat
      const legacyDesign = { ...design };
      const walletPatch: Record<string, unknown> = {
        walletBarcodeFormat: barcode.format === "code128" ? "code128" : "qr",
        walletBarcodeMessage: barcode.messageTemplate || undefined,
        walletNotificationTitle: notifTitle || undefined,
        walletNotificationBody: notifBody || undefined,
      };
      if (description) walletPatch.walletPassDescription = description;
      if (terms) walletPatch.walletPassTerms = terms;
      if (support.websiteUrl) walletPatch.walletWebsiteUrl = support.websiteUrl;
      if (support.email) walletPatch.walletSupportEmail = support.email;
      if (support.phone) walletPatch.walletSupportPhone = support.phone;
      if (support.address) walletPatch.walletAddress = support.address;

      await Promise.all([
        fetch("/api/loyalty/card-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(legacyDesign) }),
        fetch("/api/loyalty/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(walletPatch) }),
      ]);

      setMsg({ t: "ok", text: ar ? "تم حفظ تصميم البطاقة بنجاح!" : "Card design saved successfully!" });

      // If was new, reload to get the template id
      if (isNew) {
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (e) {
      console.error(e);
      setMsg({ t: "err", text: ar ? "فشل حفظ التصميم. حاول مرة أخرى." : "Failed to save. Please try again." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  /* ---- sample data ---- */
  const samplePoints = 12;
  const sampleCustomer = ar ? "محمد أحمد" : "John Smith";
  const sampleMemberId = barcode.messageTemplate?.includes("{{") ? "SBC-XY7-48201" : (barcode.messageTemplate || "SBC-XY7-48201");

  /* ---- section renderer ---- */
  const Section = ({ id, icon, label, children }: { id: string; icon: React.ReactNode; label: string; children: React.ReactNode }) => {
    const open = expandedSection === id;
    return (
      <div className="rounded-xl border border-(--surface-border) bg-(--surface) overflow-hidden transition-shadow hover:shadow-sm">
        <button onClick={() => toggle(id)} className="w-full flex items-center gap-3 px-5 py-4 text-start">
          <span className="text-(--muted-foreground)">{icon}</span>
          <span className="flex-1 text-sm font-semibold">{label}</span>
          <svg className={`w-4 h-4 text-(--muted-foreground) transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && <div className="px-5 pb-5 space-y-4 border-t border-(--surface-border) pt-4">{children}</div>}
      </div>
    );
  };

  /* ---- Color input helper ---- */
  const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="block text-xs text-(--muted-foreground) mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-14 rounded-lg border border-(--surface-border) cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-(--surface-border) bg-(--surface) text-xs font-mono" />
      </div>
    </div>
  );

  /* ==================================================================
     RENDER
     ================================================================== */
  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      {/* ============================================================
          CONTROLS
          ============================================================ */}
      <div className="space-y-3 order-2 xl:order-1">
        {/* Quick Presets */}
        <Section id="presets" icon={<PaletteIcon />} label={ar ? "قوالب جاهزة" : "Quick Presets"}>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(PRESETS) as [keyof typeof PRESETS, (typeof PRESETS)[keyof typeof PRESETS]][]).map(([key, preset]) => {
              const active = design.primaryColor === preset.design.primaryColor && design.backgroundColor === preset.design.backgroundColor;
              return (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${active ? "border-accent ring-2 ring-accent/30 scale-105" : "border-transparent hover:border-accent/50 hover:scale-[1.02]"}`}
                  style={{
                    background: preset.design.backgroundStyle === "gradient"
                      ? `linear-gradient(135deg, ${preset.design.primaryColor}, ${preset.design.secondaryColor})`
                      : preset.design.backgroundColor,
                  }}
                  title={preset.name[ar ? "ar" : "en"]}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold px-1 text-center leading-tight" style={{ color: preset.design.textColor }}>
                    {preset.name[ar ? "ar" : "en"]}
                  </span>
                  {active && (
                    <div className="absolute top-1 end-1">
                      <svg className="w-3.5 h-3.5 drop-shadow-md" fill="currentColor" viewBox="0 0 20 20" style={{ color: preset.design.textColor }}>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Colors */}
        <Section id="colors" icon={<DropIcon />} label={ar ? "الألوان" : "Colors"}>
          <div className="grid grid-cols-2 gap-4">
            <ColorInput label={ar ? "اللون الأساسي" : "Primary"} value={design.primaryColor} onChange={(v) => ud({ primaryColor: v })} />
            <ColorInput label={ar ? "اللون الثانوي" : "Secondary"} value={design.secondaryColor} onChange={(v) => ud({ secondaryColor: v })} />
            <ColorInput label={ar ? "لون الخلفية" : "Background"} value={design.backgroundColor} onChange={(v) => ud({ backgroundColor: v })} />
            <ColorInput label={ar ? "لون النص" : "Text"} value={design.textColor} onChange={(v) => ud({ textColor: v })} />
          </div>
        </Section>

        {/* Style & Layout */}
        <Section id="style" icon={<LayoutIcon />} label={ar ? "الأسلوب والتصميم" : "Style & Layout"}>
          {/* Background Style */}
          <div>
            <label className="block text-xs text-(--muted-foreground) mb-2">{ar ? "نمط الخلفية" : "Background Style"}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["solid", "gradient", "pattern"] as const).map((s) => (
                <button key={s} onClick={() => ud({ backgroundStyle: s })} className={`h-9 rounded-lg border text-xs font-medium transition ${design.backgroundStyle === s ? "border-accent bg-accent/10 text-accent" : "border-(--surface-border) hover:border-accent/50"}`}>
                  {s === "solid" ? (ar ? "سادة" : "Solid") : s === "gradient" ? (ar ? "متدرج" : "Gradient") : (ar ? "نمط" : "Pattern")}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Position */}
          <div>
            <label className="block text-xs text-(--muted-foreground) mb-2">{ar ? "موضع الشعار" : "Logo Position"}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["top", "center", "corner"] as const).map((p) => (
                <button key={p} onClick={() => ud({ logoPosition: p })} className={`h-9 rounded-lg border text-xs font-medium transition ${design.logoPosition === p ? "border-accent bg-accent/10 text-accent" : "border-(--surface-border) hover:border-accent/50"}`}>
                  {p === "top" ? (ar ? "أعلى" : "Top") : p === "center" ? (ar ? "وسط" : "Center") : (ar ? "زاوية" : "Corner")}
                </button>
              ))}
            </div>
          </div>

          {/* Corner Radius */}
          <div>
            <label className="block text-xs text-(--muted-foreground) mb-2">{ar ? "استدارة الحواف" : "Corner Radius"} ({design.cornerRadius}px)</label>
            <input
              type="range" min="0" max="24" step="4" value={design.cornerRadius}
              onChange={(e) => ud({ cornerRadius: Number(e.target.value) })}
              className="w-full h-2 rounded-lg bg-(--surface-border) appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
            />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={design.showBusinessName} onChange={(e) => ud({ showBusinessName: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent" />
              <span className="text-xs">{ar ? "إظهار اسم النشاط" : "Show business name"}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={design.showCustomerName} onChange={(e) => ud({ showCustomerName: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent" />
              <span className="text-xs">{ar ? "إظهار اسم العميل" : "Show customer name"}</span>
            </label>
          </div>
        </Section>

        {/* Pass Content */}
        <Section id="content" icon={<CardIcon />} label={ar ? "محتوى البطاقة" : "Card Content"}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "اسم البرنامج" : "Program Name"}</label>
              <input type="text" value={passContent.programName} onChange={(e) => setPassContent((p) => ({ ...p, programName: e.target.value }))} className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm" />
            </div>
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "تسمية النقاط" : "Points Label"}</label>
              <input type="text" value={passContent.pointsLabel} onChange={(e) => setPassContent((p) => ({ ...p, pointsLabel: e.target.value }))} className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "الحقل الثانوي" : "Secondary Label"}</label>
              <input type="text" value={passContent.secondaryLabel ?? ""} onChange={(e) => setPassContent((p) => ({ ...p, secondaryLabel: e.target.value }))} placeholder={ar ? "مثال: المستوى" : "e.g., Level"} className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm" />
            </div>
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "قيمة الحقل الثانوي" : "Secondary Value"}</label>
              <input type="text" value={passContent.secondaryValue ?? ""} onChange={(e) => setPassContent((p) => ({ ...p, secondaryValue: e.target.value }))} placeholder={ar ? "مثال: ذهبي" : "e.g., Gold"} className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm" />
            </div>
          </div>
        </Section>

        {/* Barcode */}
        <Section id="barcode" icon={<BarcodeIcon />} label={ar ? "الباركود / QR" : "Barcode / QR"}>
          <div className="grid grid-cols-4 gap-2">
            {(["qr", "code128", "pdf417", "aztec"] as const).map((f) => (
              <button key={f} onClick={() => setBarcode((b) => ({ ...b, format: f }))} className={`h-9 rounded-lg border text-xs font-medium uppercase transition ${barcode.format === f ? "border-accent bg-accent/10 text-accent" : "border-(--surface-border) hover:border-accent/50"}`}>
                {f === "qr" ? "QR" : f === "code128" ? "CODE128" : f === "pdf417" ? "PDF417" : "AZTEC"}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "قالب الرسالة" : "Message Template"}</label>
            <input type="text" value={barcode.messageTemplate ?? ""} onChange={(e) => setBarcode((b) => ({ ...b, messageTemplate: e.target.value }))} placeholder="{{memberId}}" className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm font-mono" />
            <p className="text-xs text-(--muted-foreground) mt-1">{ar ? "متغيرات: {{memberId}}, {{customerId}}, {{cardId}}, {{phone}}" : "Variables: {{memberId}}, {{customerId}}, {{cardId}}, {{phone}}"}</p>
          </div>
          {/* Live barcode preview */}
          <div className="rounded-xl border border-(--surface-border) bg-white p-3 flex items-center justify-center overflow-hidden">
            {barcode.format === "qr" ? (
              qrDataUrl ? <Image src={qrDataUrl} alt="QR" width={140} height={140} unoptimized /> : <div className="w-[140px] h-[140px] bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">{ar ? "جارٍ إنشاء..." : "Generating..."}</div>
            ) : (
              <Barcode value={(sampleMemberId).slice(0, 80)} format="CODE128" width={2} height={60} displayValue margin={8} fontSize={11} />
            )}
          </div>
        </Section>

        {/* Support Info */}
        <Section id="support" icon={<SupportIcon />} label={ar ? "معلومات الدعم" : "Support Info"}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "الموقع" : "Website"}</label>
              <input type="url" value={support.websiteUrl ?? ""} onChange={(e) => setSupport((s) => ({ ...s, websiteUrl: e.target.value }))} placeholder="https://..." className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm" />
            </div>
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "البريد الإلكتروني" : "Email"}</label>
              <input type="email" value={support.email ?? ""} onChange={(e) => setSupport((s) => ({ ...s, email: e.target.value }))} placeholder="support@..." className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm" />
            </div>
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "الهاتف" : "Phone"}</label>
              <input type="tel" value={support.phone ?? ""} onChange={(e) => setSupport((s) => ({ ...s, phone: e.target.value }))} placeholder="+968..." className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm" />
            </div>
            <div>
              <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "العنوان" : "Address"}</label>
              <input type="text" value={support.address ?? ""} onChange={(e) => setSupport((s) => ({ ...s, address: e.target.value }))} className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm" />
            </div>
          </div>
        </Section>

        {/* Description & Terms */}
        <Section id="terms" icon={<DocIcon />} label={ar ? "الوصف والشروط" : "Description & Terms"}>
          <div>
            <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "الوصف" : "Description"}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder={ar ? "اعرض هذه البطاقة عند الدفع لكسب النقاط." : "Show this card at checkout to earn points."} className="w-full rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "الشروط والأحكام" : "Terms & Conditions"}</label>
            <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} placeholder={ar ? "النقاط غير قابلة للتحويل وقابلة للتغيير." : "Points are non-transferable and subject to change."} className="w-full rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm" />
          </div>
        </Section>

        {/* Notifications */}
        <Section id="notif" icon={<BellIcon />} label={ar ? "الإشعارات" : "Notifications"}>
          <div>
            <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "عنوان الإشعار" : "Notification Title"}</label>
            <input type="text" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-(--surface-border) bg-(--surface) text-sm" />
          </div>
          <div>
            <label className="block text-xs text-(--muted-foreground) mb-1.5">{ar ? "نص الإشعار" : "Notification Body"}</label>
            <textarea value={notifBody} onChange={(e) => setNotifBody(e.target.value)} rows={2} className="w-full rounded-lg border border-(--surface-border) bg-(--surface) px-3 py-2 text-sm" />
          </div>
          <p className="text-xs text-(--muted-foreground)">{ar ? "شاهد المعاينة في تبويب الإشعار ←" : "Preview it in the Notification tab →"}</p>
        </Section>

        {/* Save + Download */}
        <div className="space-y-3 pt-2">
          <Button onClick={handleSave} disabled={saving} variant="primary" size="md" className="w-full h-12 text-sm font-semibold">
            {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ تصميم البطاقة" : "Save Card Design")}
          </Button>

          {template?.id && (
            <a
              href={`/api/loyalty/templates/${template.id}/preview/apple`}
              download
              className="w-full h-11 rounded-xl bg-(--surface) border border-(--surface-border) text-foreground font-medium text-sm hover:bg-(--surface-border) transition flex items-center justify-center gap-2"
            >
              <AppleIcon className="w-4 h-4" />
              {ar ? "تحميل معاينة iOS Pass" : "Download iOS Preview Pass"}
            </a>
          )}

          {msg && (
            <div className={`rounded-xl p-4 text-sm font-medium ${msg.t === "ok" ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"}`}>
              {msg.text}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          PREVIEW PANEL
          ============================================================ */}
      <div className="space-y-4 order-1 xl:order-2 xl:sticky xl:top-20 xl:self-start">
        {/* Platform switcher */}
        <div className="flex items-center gap-1 p-1 bg-(--surface) rounded-xl border border-(--surface-border)">
          {([
            { key: "ios" as const, icon: <AppleIcon className="w-4 h-4" />, label: ar ? "آيفون" : "iOS" },
            { key: "android" as const, icon: <AndroidIcon className="w-4 h-4" />, label: ar ? "أندرويد" : "Android" },
            { key: "notification" as const, icon: <BellIcon2 className="w-4 h-4" />, label: ar ? "إشعار" : "Notification" },
          ]).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActivePreview(key)}
              className={`flex-1 h-10 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 ${activePreview === key ? "bg-accent text-accent-foreground shadow-sm" : "text-(--muted-foreground) hover:text-foreground"}`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Preview container */}
        <div className="relative rounded-2xl border border-(--surface-border) bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-4 min-h-[640px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, rgba(120,120,120,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(120,120,120,0.1) 0%, transparent 50%)` }} />
          {activePreview === "ios" ? (
            <IOSPreview design={design} passContent={passContent} businessName={businessName} logoUrl={logoUrl} points={samplePoints} customerName={design.showCustomerName ? sampleCustomer : undefined} memberId={sampleMemberId} barcode={barcode} qrDataUrl={qrDataUrl} ar={ar} />
          ) : activePreview === "android" ? (
            <AndroidPreview design={design} passContent={passContent} businessName={businessName} logoUrl={logoUrl} points={samplePoints} customerName={design.showCustomerName ? sampleCustomer : undefined} memberId={sampleMemberId} barcode={barcode} qrDataUrl={qrDataUrl} ar={ar} />
          ) : (
            <NotificationPreview businessName={businessName} logoUrl={logoUrl} notifTitle={notifTitle} notifBody={notifBody} />
          )}
        </div>

        <p className="text-xs text-center text-(--muted-foreground)">
          {ar ? "المعاينة تقريبية. قد يختلف المظهر الفعلي حسب إعدادات الجهاز." : "Preview is approximate. Actual appearance may vary by device."}
        </p>
      </div>
    </div>
  );
}

/* ====================================================================
   ICONS
   ==================================================================== */

function PaletteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
  );
}
function DropIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C12 2 5 10 5 14a7 7 0 0014 0c0-4-7-12-7-12z" /></svg>
  );
}
function LayoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
  );
}
function CardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
  );
}
function BarcodeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h2v16H3V4zm4 0h1v16H7V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zm3 0h1v16h-1V4zm3 0h1v16h-1V4z" /></svg>
  );
}
function SupportIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  );
}
function DocIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  );
}
function BellIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  );
}

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
function BellIcon2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2z" />
    </svg>
  );
}

/* ====================================================================
   PREVIEW COMPONENTS
   ==================================================================== */

interface PreviewProps {
  design: Design;
  passContent: PassContent;
  businessName: string;
  logoUrl?: string | null;
  points: number;
  customerName?: string;
  memberId: string;
  barcode: BarcodeConfig;
  qrDataUrl: string | null;
  ar: boolean;
}

function getBackground(design: Design) {
  if (design.backgroundStyle === "gradient") return `linear-gradient(180deg, ${design.primaryColor}, ${design.secondaryColor})`;
  if (design.backgroundStyle === "pattern") return `${design.backgroundColor} url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${encodeURIComponent(design.textColor)}' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3Ccircle cx='13' cy='13' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`;
  return design.backgroundColor;
}

/* ----------------------------- iOS -------------------------------- */

function IOSPreview({ design, passContent, businessName, logoUrl, points, customerName, memberId, barcode, qrDataUrl, ar }: PreviewProps) {
  return (
    <div className="w-full max-w-[340px] mx-auto relative z-10">
      {/* iPhone Frame */}
      <div className="rounded-[48px] bg-gray-900 p-[10px] shadow-2xl ring-1 ring-gray-800">
        {/* Dynamic Island */}
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[100px] h-[32px] bg-black rounded-full z-20" />

        <div className="rounded-[38px] bg-gray-100 overflow-hidden">
          {/* Status Bar */}
          <div className="h-[52px] flex items-end justify-between px-8 pb-1 bg-gray-50">
            <span className="text-[15px] font-semibold text-gray-900">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-[18px] h-[18px] text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" /></svg>
              <svg className="w-[18px] h-[18px] text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M17 4h-3V2h-4v2H7v18h10V4zm-3 16h-4v-2h4v2zm0-4h-4V8h4v8z" /></svg>
            </div>
          </div>

          {/* Wallet header */}
          <div className="h-[44px] flex items-center justify-between px-4 bg-gray-50 border-b border-gray-200/60">
            <span className="text-[17px] text-blue-500 font-normal">Done</span>
            <button className="w-[30px] h-[30px] rounded-full bg-gray-200/80 flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
            </button>
          </div>

          {/* Pass Card */}
          <div className="p-4 bg-white">
            <div className="relative overflow-hidden shadow-xl" style={{ background: getBackground(design), borderRadius: `${design.cornerRadius}px`, color: design.textColor }}>
              {/* Header */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <div className="relative w-[44px] h-[44px] rounded-[10px] overflow-hidden flex-shrink-0" style={{ background: `${design.textColor}15` }}>
                        <Image src={logoUrl} alt={businessName} fill className="object-cover" />
                      </div>
                    )}
                    {design.showBusinessName && (
                      <div>
                        <div className="text-[17px] font-semibold tracking-tight leading-tight">{businessName}</div>
                        <div className="text-[13px] opacity-70 mt-0.5">{passContent.programName}</div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider opacity-60">{passContent.pointsLabel}</div>
                    <div className="text-[28px] font-bold leading-none mt-0.5 tabular-nums">{points}</div>
                  </div>
                </div>
              </div>

              {/* Main Points */}
              <div className="px-5 py-6 text-center">
                <div className="text-[11px] uppercase tracking-widest opacity-50 mb-2">{ar ? "رصيد النقاط" : "POINTS BALANCE"}</div>
                <div className="text-[72px] font-black leading-none tabular-nums">{points}</div>
                <div className="text-[13px] uppercase tracking-wider opacity-60 mt-2">{passContent.pointsLabel}</div>
              </div>

              {/* Progress */}
              <div className="mx-5 mb-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider opacity-50 mb-2">
                  <span>{ar ? "التقدم" : "PROGRESS"}</span>
                  <span>{Math.min(points, 10)}/10</span>
                </div>
                <div className="h-[6px] rounded-full overflow-hidden" style={{ background: `${design.textColor}20` }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((points / 10) * 100, 100)}%`, background: design.textColor }} />
                </div>
              </div>

              {/* Member Info */}
              {customerName && (
                <div className="mx-5 mb-4 px-4 py-3 rounded-xl" style={{ background: `${design.textColor}10` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider opacity-50">{passContent.secondaryLabel || (ar ? "العضو" : "MEMBER")}</div>
                      <div className="text-[15px] font-semibold mt-0.5">{customerName}</div>
                    </div>
                    {passContent.secondaryValue && (
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider opacity-50">{ar ? "الحالة" : "STATUS"}</div>
                        <div className="text-[15px] font-semibold mt-0.5">{passContent.secondaryValue}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Barcode */}
              <div className="bg-white mx-4 mb-4 rounded-xl overflow-hidden">
                <div className="p-4 flex flex-col items-center">
                  <BarcodePreview format={barcode.format} qrDataUrl={qrDataUrl} memberId={memberId} size="ios" />
                  <div className="mt-2 text-[12px] text-gray-500 font-mono tracking-wide">{memberId}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="h-[34px] bg-white flex items-end justify-center pb-2">
            <div className="w-32 h-1 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Android ------------------------------ */

function AndroidPreview({ design, passContent, businessName, logoUrl, points, customerName, memberId, barcode, qrDataUrl, ar }: PreviewProps) {
  return (
    <div className="w-full max-w-[340px] mx-auto relative z-10">
      <div className="rounded-[36px] bg-gray-900 p-[6px] shadow-2xl ring-1 ring-gray-800">
        <div className="rounded-[30px] bg-white overflow-hidden">
          {/* Status Bar */}
          <div className="h-[28px] bg-gray-900 flex items-center justify-between px-6">
            <span className="text-[12px] font-medium text-white">9:41</span>
            <div className="flex items-center gap-1.5">
              <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" /></svg>
              <svg className="w-[14px] h-[14px] text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17 4h-3V2h-4v2H7v18h10V4z" /></svg>
            </div>
          </div>

          {/* Google Wallet header */}
          <div className="h-[56px] flex items-center px-4 border-b border-gray-100">
            <button className="p-2 -ml-2 rounded-full">
              <svg className="w-[24px] h-[24px] text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-3 ml-4">
              <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              <span className="text-[18px] font-medium text-gray-800">Wallet</span>
            </div>
          </div>

          {/* Card container */}
          <div className="p-4 bg-gray-100 min-h-[480px]">
            <div className="relative overflow-hidden shadow-lg" style={{ background: getBackground(design), borderRadius: `${design.cornerRadius}px`, color: design.textColor }}>
              {/* Header */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <div className="relative w-[48px] h-[48px] rounded-[12px] overflow-hidden flex-shrink-0" style={{ background: `${design.textColor}15` }}>
                        <Image src={logoUrl} alt={businessName} fill className="object-cover" />
                      </div>
                    )}
                    {design.showBusinessName && (
                      <div>
                        <div className="text-[16px] font-semibold">{businessName}</div>
                        <div className="text-[13px] opacity-60 mt-0.5">{passContent.programName}</div>
                      </div>
                    )}
                  </div>
                  <button className="p-2 rounded-full" style={{ background: `${design.textColor}15` }}>
                    <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                  </button>
                </div>
              </div>

              {/* Points */}
              <div className="px-5 pb-5">
                <div className="py-8 text-center">
                  <div className="text-[64px] font-black leading-none tabular-nums">{points}</div>
                  <div className="text-[14px] uppercase tracking-wider opacity-60 mt-2">{passContent.pointsLabel}</div>
                </div>

                {/* Progress segments */}
                <div className="py-4 border-t border-b" style={{ borderColor: `${design.textColor}20` }}>
                  <div className="flex items-center justify-between text-[12px] opacity-60 mb-3">
                    <span>{ar ? "التقدم نحو المكافأة" : "Progress to reward"}</span>
                    <span>{Math.min(points, 10)}/10</span>
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex-1 h-[8px] rounded-full transition-all duration-300" style={{ background: i < Math.min(points, 10) ? design.textColor : `${design.textColor}25` }} />
                    ))}
                  </div>
                </div>

                {/* Member info */}
                {customerName && (
                  <div className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider opacity-50">{passContent.secondaryLabel || (ar ? "العضو" : "Member")}</div>
                      <div className="text-[15px] font-semibold mt-1">{customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-wider opacity-50">{ar ? "المستوى" : "Tier"}</div>
                      <div className="text-[15px] font-semibold mt-1">{passContent.secondaryValue || (points >= 10 ? (ar ? "ذهبي" : "Gold") : (ar ? "فضي" : "Silver"))}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Barcode */}
              <div className="bg-white p-4">
                <div className="flex flex-col items-center">
                  <BarcodePreview format={barcode.format} qrDataUrl={qrDataUrl} memberId={memberId} size="android" />
                  <div className="mt-2 text-[12px] text-gray-500 font-mono">{memberId}</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-3">
              <button className="flex-1 h-[44px] rounded-full bg-white border border-gray-200 text-gray-700 text-[14px] font-medium shadow-sm">{ar ? "التفاصيل" : "Details"}</button>
              <button className="flex-1 h-[44px] rounded-full bg-white border border-gray-200 text-gray-700 text-[14px] font-medium shadow-sm">{ar ? "مشاركة" : "Share"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Notification ------------------------- */

function NotificationPreview({ businessName, logoUrl, notifTitle, notifBody }: { businessName: string; logoUrl?: string | null; notifTitle: string; notifBody: string }) {
  return (
    <div className="w-full max-w-[340px] mx-auto relative z-10">
      <div className="rounded-[48px] bg-gray-900 p-[10px] shadow-2xl ring-1 ring-gray-800">
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[100px] h-[32px] bg-black rounded-full z-20" />
        <div className="rounded-[38px] overflow-hidden min-h-[600px]" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
          {/* Status Bar */}
          <div className="h-[52px] flex items-end justify-between px-8 pb-1">
            <span className="text-[15px] font-semibold text-white">9:41</span>
            <div className="flex items-center gap-1">
              <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" /></svg>
              <svg className="w-[18px] h-[18px] text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17 4h-3V2h-4v2H7v18h10V4zm-3 16h-4v-2h4v2zm0-4h-4V8h4v8z" /></svg>
            </div>
          </div>

          <div className="px-6 pt-10 pb-6">
            {/* Clock */}
            <div className="text-center mb-2">
              <div className="text-[80px] font-light text-white tracking-tight leading-none">9:41</div>
              <div className="text-[20px] text-white/70 mt-2">Wednesday, February 5</div>
            </div>

            {/* Notification card */}
            <div className="mt-10 rounded-[20px] bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative w-[44px] h-[44px] rounded-[10px] overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                    {logoUrl ? (
                      <Image src={logoUrl} alt={businessName} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500 text-white text-[18px] font-bold">
                        {businessName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">{businessName}</div>
                      <div className="text-[12px] text-gray-400">now</div>
                    </div>
                    <div className="text-[15px] font-semibold text-gray-900 mt-1">{notifTitle || "Loyalty Update"}</div>
                    <div className="text-[15px] text-gray-600 mt-0.5 leading-snug">{notifBody || "Your points balance has been updated."}</div>
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

          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2">
            <div className="w-[140px] h-[5px] rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Barcode Preview ---------------------- */

function BarcodePreview({ format, qrDataUrl, memberId, size }: { format: string; qrDataUrl: string | null; memberId: string; size: "ios" | "android" }) {
  const qrSize = size === "ios" ? 140 : 120;
  const barH = size === "ios" ? 50 : 45;

  if (format === "qr") {
    return qrDataUrl ? (
      <Image src={qrDataUrl} alt="QR" width={qrSize} height={qrSize} unoptimized />
    ) : (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ width: qrSize, height: qrSize }}>
        <div className="text-xs text-gray-400">QR Code</div>
      </div>
    );
  }

  return (
    <Barcode
      value={memberId.slice(0, 80)}
      format="CODE128"
      width={2}
      height={barH}
      displayValue={false}
      margin={0}
    />
  );
}
