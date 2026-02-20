"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import type { Locale } from "@/lib/i18n/locales";
import type { Category } from "@/lib/db/types";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/Button";
import { CategorySelectField } from "@/components/CategorySelectField";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { useToast } from "@/components/ui/Toast";

const OsmLocationPicker = dynamic(
  () =>
    import("@/components/maps/OsmLocationPicker").then(
      (m) => m.OsmLocationPicker
    ),
  { ssr: false }
);

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface FormData {
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  categoryId: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  tags: string;
}

interface LocationData {
  lat: number;
  lng: number;
}

type StepId = "info" | "contact" | "location" | "media" | "review";

interface StepDef {
  id: StepId;
  label: string;
  icon: ReactNode;
}

/* ================================================================== */
/*  Icons (heroicon outlines, inline for zero-dep)                     */
/* ================================================================== */

const IconInfo = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);
const IconPhone = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);
const IconMap = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
  </svg>
);
const IconCamera = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
);
const IconCheck = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconChevronRight = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);
const IconChevronLeft = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function BusinessRequestForm({
  locale,
  categories,
}: {
  locale: Locale;
  categories: Category[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const ar = locale === "ar";

  /* ── Wizard state ────────────────────────────────────────────────── */
  const steps: StepDef[] = useMemo(
    () => [
      { id: "info", label: ar ? "المعلومات" : "Info", icon: IconInfo },
      { id: "contact", label: ar ? "التواصل" : "Contact", icon: IconPhone },
      { id: "location", label: ar ? "الموقع" : "Location", icon: IconMap },
      { id: "media", label: ar ? "الصور" : "Media", icon: IconCamera },
      { id: "review", label: ar ? "المراجعة" : "Review", icon: IconCheck },
    ],
    [ar]
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [animDir, setAnimDir] = useState<"next" | "prev">("next");

  // Media previews
  const [coverPreview, setCoverPreview] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string[]>([]);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name_en: "",
    name_ar: "",
    desc_en: "",
    desc_ar: "",
    categoryId: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    tags: "",
  });

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setFormData((prev) => ({ ...prev, [key]: value })),
    []
  );

  /* ── File helpers ────────────────────────────────────────────────── */
  const handleFileSelect = (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    multiple = false
  ) => {
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setter(multiple ? (prev) => [...prev, ...urls] : [urls[0]]);
  };

  const handleRemovePreview = (
    url: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    URL.revokeObjectURL(url);
    setter((prev) => prev.filter((u) => u !== url));
  };

  /* ── Validation per step ─────────────────────────────────────────── */
  const validateStep = useCallback(
    (step: number): string | null => {
      switch (steps[step].id) {
        case "info":
          if (!formData.name_en.trim())
            return ar ? "الاسم بالإنجليزية مطلوب" : "English name is required";
          if (!formData.name_ar.trim())
            return ar ? "الاسم بالعربية مطلوب" : "Arabic name is required";
          if (!formData.categoryId)
            return ar ? "يرجى اختيار التصنيف" : "Please select a category";
          return null;
        case "contact":
          if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
          )
            return ar
              ? "البريد الإلكتروني غير صالح"
              : "Invalid email format";
          return null;
        case "location":
          return null; // optional
        case "media":
          return null; // optional
        case "review":
          return null;
        default:
          return null;
      }
    },
    [formData, ar, steps]
  );

  /* ── Step navigation ─────────────────────────────────────────────── */
  const goNext = useCallback(() => {
    const err = validateStep(currentStep);
    if (err) {
      toast({ message: err, variant: "error" });
      return;
    }
    setAnimDir("next");
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }, [currentStep, validateStep, toast, steps.length]);

  const goPrev = useCallback(() => {
    setAnimDir("prev");
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      // Only allow going to completed/current steps
      if (idx > currentStep) return;
      setAnimDir(idx > currentStep ? "next" : "prev");
      setCurrentStep(idx);
    },
    [currentStep]
  );

  /* ── Submit ──────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: location?.lat,
        longitude: location?.lng,
      };
      const res = await fetch("/api/business-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit request");
      }
      router.push(`/${locale}/business-request?success=1`);
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to submit request";
      toast({
        message: ar ? `خطأ: ${message}` : `Error: ${message}`,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ── Step completion check (for stepper dots) ────────────────────── */
  const isStepComplete = useCallback(
    (idx: number): boolean => {
      switch (steps[idx].id) {
        case "info":
          return !!(
            formData.name_en.trim() &&
            formData.name_ar.trim() &&
            formData.categoryId
          );
        case "contact":
          return !!(formData.city || formData.phone || formData.email);
        case "location":
          return !!location;
        case "media":
          return coverPreview.length > 0 || logoPreview.length > 0;
        case "review":
          return false;
        default:
          return false;
      }
    },
    [formData, location, coverPreview, logoPreview, steps]
  );

  /* ── Helpers for the category label ──────────────────────────────── */
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === formData.categoryId),
    [categories, formData.categoryId]
  );

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="mt-6">
      {/* ── Stepper ─────────────────────────────────────────────── */}
      <nav className="mb-8">
        {/* Desktop stepper */}
        <ol className="hidden sm:flex items-center justify-between gap-2">
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isDone = idx < currentStep || isStepComplete(idx);
            return (
              <li key={step.id} className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goTo(idx)}
                  disabled={idx > currentStep}
                  className={`
                    flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium w-full
                    transition-all duration-200
                    ${isActive
                      ? "bg-accent text-(--accent-foreground) shadow-sm"
                      : isDone
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                        : "bg-(--chip-bg) text-(--muted-foreground)"
                    }
                    ${idx > currentStep ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}
                  `}
                >
                  <span className={`shrink-0 ${isDone && !isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                    {isDone && !isActive ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </span>
                  <span className="truncate">{step.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={`hidden lg:block h-0.5 w-6 shrink-0 rounded transition-colors ${
                      idx < currentStep
                        ? "bg-emerald-400 dark:bg-emerald-500"
                        : "bg-(--border)"
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>

        {/* Mobile stepper */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">
              {ar ? `الخطوة ${currentStep + 1} من ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
            </span>
            <span className="text-sm font-medium text-accent">
              {steps[currentStep].label}
            </span>
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                disabled={idx > currentStep}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? "bg-accent"
                    : idx < currentStep
                      ? "bg-emerald-400 dark:bg-emerald-500"
                      : "bg-(--border)"
                }`}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* ── Step Content ────────────────────────────────────────── */}
      <div
        key={currentStep}
        className={`animate-in fade-in duration-300 ${
          animDir === "next" ? "slide-in-from-end-4" : "slide-in-from-start-4"
        }`}
      >
        {steps[currentStep].id === "info" && (
          <StepInfo ar={ar} formData={formData} set={set} categories={categories} locale={locale} />
        )}
        {steps[currentStep].id === "contact" && (
          <StepContact ar={ar} formData={formData} set={set} locale={locale} />
        )}
        {steps[currentStep].id === "location" && (
          <StepLocation
            ar={ar}
            formData={formData}
            set={set}
            locale={locale}
            location={location}
            setLocation={setLocation}
            logoPreview={logoPreview}
          />
        )}
        {steps[currentStep].id === "media" && (
          <StepMedia
            ar={ar}
            coverPreview={coverPreview}
            setCoverPreview={setCoverPreview}
            logoPreview={logoPreview}
            setLogoPreview={setLogoPreview}
            bannerPreview={bannerPreview}
            setBannerPreview={setBannerPreview}
            galleryPreview={galleryPreview}
            setGalleryPreview={setGalleryPreview}
            handleFileSelect={handleFileSelect}
            handleRemovePreview={handleRemovePreview}
          />
        )}
        {steps[currentStep].id === "review" && (
          <StepReview
            ar={ar}
            formData={formData}
            location={location}
            selectedCategory={selectedCategory}
            coverPreview={coverPreview}
            logoPreview={logoPreview}
            bannerPreview={bannerPreview}
            galleryPreview={galleryPreview}
            goTo={goTo}
          />
        )}
      </div>

      {/* ── Navigation buttons ──────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={currentStep === 0 ? () => router.push(`/${locale}/dashboard`) : goPrev}
          disabled={loading}
        >
          <span className="flex items-center gap-1.5">
            {ar ? IconChevronRight : IconChevronLeft}
            {currentStep === 0
              ? ar ? "إلغاء" : "Cancel"
              : ar ? "السابق" : "Previous"
            }
          </span>
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button type="button" variant="primary" onClick={goNext}>
            <span className="flex items-center gap-1.5">
              {ar ? "التالي" : "Next"}
              {ar ? IconChevronLeft : IconChevronRight}
            </span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? ar ? "جاري الإرسال..." : "Submitting..."
              : ar ? "إرسال الطلب" : "Submit Request"
            }
          </Button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 1 — Basic Information                                         */
/* ================================================================== */

function StepInfo({
  ar,
  formData,
  set,
  categories,
  locale,
}: {
  ar: boolean;
  formData: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  categories: Category[];
  locale: Locale;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon={IconInfo}
        title={ar ? "المعلومات الأساسية" : "Basic Information"}
        desc={ar ? "أدخل اسم وتصنيف ووصف نشاطك التجاري" : "Enter your business name, category, and description"}
      />

      <div className="sbc-card p-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label={ar ? "اسم النشاط (English) *" : "Business Name (English) *"} hint={ar ? "الاسم كما يظهر بالإنجليزية" : "Name as it appears in English"}>
            <Input
              value={formData.name_en}
              onChange={(e) => set("name_en", e.target.value)}
              placeholder="e.g. Coffee Paradise"
              required
            />
          </Field>

          <Field label={ar ? "اسم النشاط (العربية) *" : "Business Name (Arabic) *"} hint={ar ? "الاسم كما يظهر بالعربية" : "Name as it appears in Arabic"}>
            <Input
              value={formData.name_ar}
              onChange={(e) => set("name_ar", e.target.value)}
              placeholder="مثال: جنة القهوة"
              dir="rtl"
              required
            />
          </Field>
        </div>

        <Field label={ar ? "التصنيف *" : "Category *"} hint={ar ? "اختر التصنيف الأنسب لنشاطك" : "Pick the most relevant category for your business"}>
          <CategorySelectField
            categories={categories}
            locale={locale}
            value={formData.categoryId}
            onChange={(v: string) => set("categoryId", v)}
            placeholder={ar ? "اختر تصنيفاً" : "Choose a category"}
            searchPlaceholder={ar ? "ابحث عن تصنيف..." : "Search categories..."}
            required
          />
        </Field>

        <Field label={ar ? "الوصف (English)" : "Description (English)"} hint={ar ? "صف نشاطك بالإنجليزية — يظهر في صفحة النشاط" : "Describe your business in English — shown on your listing page"}>
          <MarkdownEditor
            value={formData.desc_en}
            onChange={(v) => set("desc_en", v)}
            placeholder="What makes your business special?"
            dir="ltr"
            height={160}
          />
        </Field>

        <Field label={ar ? "الوصف (العربية)" : "Description (Arabic)"} hint={ar ? "صف نشاطك بالعربية" : "Describe your business in Arabic"}>
          <MarkdownEditor
            value={formData.desc_ar}
            onChange={(v) => set("desc_ar", v)}
            placeholder="ما الذي يميّز نشاطك التجاري؟"
            dir="rtl"
            height={160}
          />
        </Field>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 2 — Contact Information                                       */
/* ================================================================== */

function StepContact({
  ar,
  formData,
  set,
  locale,
}: {
  ar: boolean;
  formData: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  locale: Locale;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon={IconPhone}
        title={ar ? "معلومات التواصل" : "Contact Information"}
        desc={ar ? "أضف طرق التواصل مع نشاطك — تساعد العملاء على الوصول إليك" : "Add contact details — helps customers reach you easily"}
      />

      <div className="sbc-card p-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label={ar ? "المدينة" : "City"} hint={ar ? "المدينة التي يقع فيها نشاطك" : "City where your business is located"}>
            <Input
              value={formData.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder={ar ? "مسقط" : "Muscat"}
            />
          </Field>

          <Field label={ar ? "رقم الهاتف" : "Phone Number"} hint={ar ? "رقم هاتف العمل" : "Business phone number"}>
            <PhoneInput
              value={formData.phone}
              onChange={(val) => set("phone", val)}
              placeholder="91234567"
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label={ar ? "البريد الإلكتروني" : "Email"} hint={ar ? "البريد الرسمي للنشاط" : "Official business email"}>
            <Input
              value={formData.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="info@mybusiness.com"
              type="email"
            />
          </Field>

          <Field label={ar ? "الموقع الإلكتروني" : "Website"} hint={ar ? "رابط الموقع إن وجد" : "Website URL if available"}>
            <Input
              value={formData.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://mybusiness.com"
              type="url"
            />
          </Field>
        </div>

        <Field
          label={ar ? "الوسوم" : "Tags"}
          hint={ar ? "كلمات مفتاحية تساعد في البحث (مفصولة بفواصل)" : "Keywords for search (comma-separated)"}
        >
          <Input
            value={formData.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder={ar ? "قهوة، واي فاي، إفطار" : "coffee, wifi, breakfast"}
          />
        </Field>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 3 — Location                                                  */
/* ================================================================== */

function StepLocation({
  ar,
  formData,
  set,
  locale,
  location,
  setLocation,
  logoPreview,
}: {
  ar: boolean;
  formData: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  locale: Locale;
  location: LocationData | null;
  setLocation: (l: LocationData | null) => void;
  logoPreview: string[];
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon={IconMap}
        title={ar ? "الموقع الجغرافي" : "Geographic Location"}
        desc={ar ? "حدد عنوان وموقع نشاطك على الخريطة ليسهل على العملاء إيجادك" : "Mark your address and pin on the map so customers can find you"}
      />

      <div className="sbc-card p-6 space-y-5">
        <Field label={ar ? "العنوان التفصيلي" : "Detailed Address"} hint={ar ? "العنوان كما تريده أن يظهر للعملاء" : "Address as you want it displayed to customers"}>
          <MarkdownEditor
            value={formData.address}
            onChange={(v) => set("address", v)}
            placeholder={ar ? "مثال: شارع السلطان قابوس، بناية رقم 5" : "e.g. Sultan Qaboos St, Building 5"}
            dir={ar ? "rtl" : "ltr"}
            height={80}
          />
        </Field>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            {ar ? "حدد موقعك على الخريطة" : "Pin your location on the map"}
          </label>
          <p className="text-xs text-(--muted-foreground) mb-3">
            {ar
              ? "انقر على الخريطة لتحديد الموقع الدقيق لنشاطك التجاري"
              : "Click on the map to mark your exact business location"}
          </p>
          <div className="rounded-xl overflow-hidden border border-(--border)">
            <OsmLocationPicker
              value={
                location
                  ? { lat: location.lat, lng: location.lng, radiusMeters: 250 }
                  : null
              }
              onChange={(next) =>
                setLocation(next ? { lat: next.lat, lng: next.lng } : null)
              }
              locale={locale}
              hideRadius
              markerImageUrl={logoPreview[0]}
            />
          </div>
          {location && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {ar ? "تم تحديد الموقع" : "Location selected"}
              </span>
              <span className="text-xs text-(--muted-foreground) font-mono">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 4 — Media                                                     */
/* ================================================================== */

function StepMedia({
  ar,
  coverPreview,
  setCoverPreview,
  logoPreview,
  setLogoPreview,
  bannerPreview,
  setBannerPreview,
  galleryPreview,
  setGalleryPreview,
  handleFileSelect,
  handleRemovePreview,
}: {
  ar: boolean;
  coverPreview: string[];
  setCoverPreview: React.Dispatch<React.SetStateAction<string[]>>;
  logoPreview: string[];
  setLogoPreview: React.Dispatch<React.SetStateAction<string[]>>;
  bannerPreview: string[];
  setBannerPreview: React.Dispatch<React.SetStateAction<string[]>>;
  galleryPreview: string[];
  setGalleryPreview: React.Dispatch<React.SetStateAction<string[]>>;
  handleFileSelect: (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    multiple?: boolean
  ) => void;
  handleRemovePreview: (
    url: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <StepHeader
        icon={IconCamera}
        title={ar ? "الصور والوسائط" : "Images & Media"}
        desc={ar ? "أضف صوراً احترافية لنشاطك — تجعل صفحتك أكثر جاذبية" : "Add professional images — makes your listing more attractive"}
      />

      <div className="sbc-card p-6 space-y-8">
        {/* Logo */}
        <MediaUploadField
          ar={ar}
          label={ar ? "الشعار" : "Logo"}
          hint={ar ? "شعار مربع للعلامة التجارية (400×400)" : "Square brand logo (400×400)"}
          previews={logoPreview}
          setter={setLogoPreview}
          onSelect={handleFileSelect}
          onRemove={handleRemovePreview}
          aspect="square"
        />

        {/* Cover */}
        <MediaUploadField
          ar={ar}
          label={ar ? "صورة الغلاف" : "Cover Image"}
          hint={ar ? "صورة عريضة تظهر أعلى صفحة النشاط (1200×400)" : "Wide image at the top of your listing (1200×400)"}
          previews={coverPreview}
          setter={setCoverPreview}
          onSelect={handleFileSelect}
          onRemove={handleRemovePreview}
          aspect="wide"
        />

        {/* Banner */}
        <MediaUploadField
          ar={ar}
          label={ar ? "صورة البانر" : "Banner Image"}
          hint={ar ? "صورة ترويجية (1200×600)" : "Promotional banner (1200×600)"}
          previews={bannerPreview}
          setter={setBannerPreview}
          onSelect={handleFileSelect}
          onRemove={handleRemovePreview}
          aspect="banner"
        />

        {/* Gallery */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            {ar ? "معرض الصور" : "Image Gallery"}
          </label>
          <p className="text-xs text-(--muted-foreground) mb-3">
            {ar ? "صور إضافية لنشاطك (يمكن اختيار عدة صور)" : "Additional photos (multiple allowed)"}
          </p>
          {galleryPreview.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {galleryPreview.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden">
                  <Image src={url} alt={`Gallery ${i + 1}`} width={300} height={300} className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePreview(url, setGalleryPreview)}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-white text-sm font-medium">{ar ? "حذف" : "Remove"}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-(--border) rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
            <svg className="h-6 w-6 text-(--muted-foreground) mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-xs text-(--muted-foreground)">
              {ar ? "أضف صور المعرض" : "Add gallery images"}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e.target.files, setGalleryPreview, true)} />
          </label>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Step 5 — Review                                                    */
/* ================================================================== */

function StepReview({
  ar,
  formData,
  location,
  selectedCategory,
  coverPreview,
  logoPreview,
  bannerPreview,
  galleryPreview,
  goTo,
}: {
  ar: boolean;
  formData: FormData;
  location: LocationData | null;
  selectedCategory: Category | undefined;
  coverPreview: string[];
  logoPreview: string[];
  bannerPreview: string[];
  galleryPreview: string[];
  goTo: (idx: number) => void;
}) {
  const sections = [
    {
      step: 0,
      title: ar ? "المعلومات الأساسية" : "Basic Information",
      icon: IconInfo,
      items: [
        { label: ar ? "الاسم (EN)" : "Name (EN)", value: formData.name_en },
        { label: ar ? "الاسم (AR)" : "Name (AR)", value: formData.name_ar },
        {
          label: ar ? "التصنيف" : "Category",
          value: selectedCategory
            ? ar
              ? selectedCategory.name.ar || selectedCategory.name.en
              : selectedCategory.name.en
            : "—",
        },
        { label: ar ? "الوصف (EN)" : "Desc (EN)", value: formData.desc_en ? "✓" : "—" },
        { label: ar ? "الوصف (AR)" : "Desc (AR)", value: formData.desc_ar ? "✓" : "—" },
      ],
    },
    {
      step: 1,
      title: ar ? "معلومات التواصل" : "Contact",
      icon: IconPhone,
      items: [
        { label: ar ? "المدينة" : "City", value: formData.city || "—" },
        { label: ar ? "الهاتف" : "Phone", value: formData.phone || "—" },
        { label: ar ? "البريد" : "Email", value: formData.email || "—" },
        { label: ar ? "الموقع" : "Website", value: formData.website || "—" },
        { label: ar ? "الوسوم" : "Tags", value: formData.tags || "—" },
      ],
    },
    {
      step: 2,
      title: ar ? "الموقع الجغرافي" : "Location",
      icon: IconMap,
      items: [
        { label: ar ? "العنوان" : "Address", value: formData.address ? "✓" : "—" },
        {
          label: ar ? "الإحداثيات" : "Coordinates",
          value: location
            ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
            : "—",
        },
      ],
    },
    {
      step: 3,
      title: ar ? "الصور" : "Media",
      icon: IconCamera,
      items: [
        { label: ar ? "الشعار" : "Logo", value: logoPreview.length > 0 ? "✓" : "—" },
        { label: ar ? "الغلاف" : "Cover", value: coverPreview.length > 0 ? "✓" : "—" },
        { label: ar ? "البانر" : "Banner", value: bannerPreview.length > 0 ? "✓" : "—" },
        {
          label: ar ? "المعرض" : "Gallery",
          value:
            galleryPreview.length > 0
              ? `${galleryPreview.length} ${ar ? "صورة" : "images"}`
              : "—",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <StepHeader
        icon={IconCheck}
        title={ar ? "مراجعة وإرسال" : "Review & Submit"}
        desc={ar ? "راجع جميع المعلومات قبل إرسال الطلب — يمكنك الرجوع لتعديل أي قسم" : "Review all details before submitting — click any section to edit"}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((sec) => (
          <div key={sec.step} className="sbc-card p-5 group relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-(--muted-foreground)">{sec.icon}</span>
                <h4 className="text-sm font-semibold">{sec.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => goTo(sec.step)}
                className="text-xs font-medium text-accent hover:underline"
              >
                {ar ? "تعديل" : "Edit"}
              </button>
            </div>
            <dl className="space-y-1.5">
              {sec.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <dt className="text-(--muted-foreground)">{item.label}</dt>
                  <dd
                    className={`font-medium truncate max-w-[55%] text-end ${
                      item.value === "—"
                        ? "text-(--muted-foreground)/50"
                        : item.value === "✓"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : ""
                    }`}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* Preview images if any */}
      {(logoPreview.length > 0 || coverPreview.length > 0) && (
        <div className="sbc-card p-5">
          <h4 className="text-sm font-semibold mb-3">
            {ar ? "معاينة الصور" : "Image Preview"}
          </h4>
          <div className="flex flex-wrap gap-4 items-end">
            {logoPreview[0] && (
              <div>
                <p className="text-xs text-(--muted-foreground) mb-1">{ar ? "الشعار" : "Logo"}</p>
                <Image src={logoPreview[0]} alt="Logo" width={80} height={80} className="h-20 w-20 rounded-xl object-cover ring-2 ring-(--border)" />
              </div>
            )}
            {coverPreview[0] && (
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs text-(--muted-foreground) mb-1">{ar ? "الغلاف" : "Cover"}</p>
                <Image src={coverPreview[0]} alt="Cover" width={400} height={150} className="w-full h-28 rounded-xl object-cover ring-2 ring-(--border)" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Shared sub-components                                              */
/* ================================================================== */

function StepHeader({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-(--muted-foreground)">{desc}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      {hint && (
        <p className="text-xs text-(--muted-foreground) mb-2">{hint}</p>
      )}
      {children}
    </div>
  );
}

function MediaUploadField({
  ar,
  label,
  hint,
  previews,
  setter,
  onSelect,
  onRemove,
  aspect,
}: {
  ar: boolean;
  label: string;
  hint: string;
  previews: string[];
  setter: React.Dispatch<React.SetStateAction<string[]>>;
  onSelect: (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    multiple?: boolean
  ) => void;
  onRemove: (
    url: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => void;
  aspect: "square" | "wide" | "banner";
}) {
  const sizeClass =
    aspect === "square"
      ? "w-32 h-32"
      : aspect === "wide"
        ? "w-full h-40"
        : "w-full h-52";

  const previewClass =
    aspect === "square"
      ? "w-32 h-32 rounded-xl"
      : aspect === "wide"
        ? "w-full h-40 rounded-xl"
        : "w-full h-52 rounded-xl";

  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <p className="text-xs text-(--muted-foreground) mb-3">{hint}</p>

      {previews.length > 0 ? (
        <div className={`relative group ${aspect === "square" ? "inline-block" : ""}`}>
          <Image
            src={previews[0]}
            alt={label}
            width={aspect === "square" ? 200 : 1200}
            height={aspect === "square" ? 200 : aspect === "wide" ? 400 : 600}
            className={`${previewClass} object-cover`}
          />
          <button
            type="button"
            onClick={() => onRemove(previews[0], setter)}
            className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="text-white text-sm font-medium">{ar ? "حذف" : "Remove"}</span>
          </button>
        </div>
      ) : (
        <label
          className={`${sizeClass} flex flex-col items-center justify-center border-2 border-dashed border-(--border) rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors`}
        >
          <svg className="h-6 w-6 text-(--muted-foreground) mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-xs text-(--muted-foreground)">
            {ar ? "اختر صورة" : "Choose image"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onSelect(e.target.files, setter, false)}
          />
        </label>
      )}
    </div>
  );
}
