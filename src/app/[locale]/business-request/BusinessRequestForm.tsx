"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

import type { Locale } from "@/lib/i18n/locales";
import type { Category } from "@/lib/db/types";
import type { OsmLocationValue } from "@/components/maps/OsmLocationPicker";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/Button";
import { CategorySelectField } from "@/components/CategorySelectField";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { useToast } from "@/components/ui/Toast";

const DynamicOsmLocationPicker = dynamic(
  () =>
    import("@/components/maps/OsmLocationPicker").then((m) => ({
      default: m.OsmLocationPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] rounded-2xl bg-(--chip-bg) animate-pulse" />
    ),
  },
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

type SlideId =
  | "name_en"
  | "name_ar"
  | "category"
  | "desc"
  | "contact"
  | "location"
  | "logo"
  | "cover"
  | "banner"
  | "gallery"
  | "review";

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function BusinessRequestForm({
  locale,
  categories,
  editRequestId,
  initialData,
}: {
  locale: Locale;
  categories: Category[];
  /** If provided, form is in edit mode for this request */
  editRequestId?: string;
  /** Pre-filled values when editing an existing request */
  initialData?: Partial<FormData> & { latitude?: number; longitude?: number; logoUrl?: string; coverUrl?: string; bannerUrl?: string; galleryUrls?: string[] };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const ar = locale === "ar";
  const isEdit = !!editRequestId;

  /* ── Slide icon components ──────────────────────────────── */
  const slideIcons: Record<SlideId, React.ReactNode> = useMemo(
    () => ({
      name_en: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      name_ar: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
      category: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      desc: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      contact: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
      location: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      logo: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      ),
      cover: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      banner: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M12 6V4" />
          <path d="M8 6V3" />
          <path d="M16 6V3" />
        </svg>
      ),
      gallery: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      ),
      review: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    }),
    [],
  );

  /* ── Slide definitions ───────────────────────────────────── */
  const slides = useMemo(
    () => [
      { id: "name_en" as SlideId, required: true },
      { id: "name_ar" as SlideId, required: true },
      { id: "category" as SlideId, required: true },
      { id: "desc" as SlideId, required: false },
      { id: "contact" as SlideId, required: false },
      { id: "location" as SlideId, required: false },
      { id: "logo" as SlideId, required: false },
      { id: "cover" as SlideId, required: false },
      { id: "banner" as SlideId, required: false },
      { id: "gallery" as SlideId, required: false },
      { id: "review" as SlideId, required: false },
    ],
    [],
  );

  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<OsmLocationValue | null>(
    initialData?.latitude && initialData?.longitude
      ? { lat: initialData.latitude, lng: initialData.longitude, radiusMeters: 0 }
      : null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Media state ──────────────────────────────────────────── */
  const [logoPreview, setLogoPreview] = useState<string[]>(
    initialData?.logoUrl ? [initialData.logoUrl] : [],
  );
  const [coverPreview, setCoverPreview] = useState<string[]>(
    initialData?.coverUrl ? [initialData.coverUrl] : [],
  );
  const [bannerPreview, setBannerPreview] = useState<string[]>(
    initialData?.bannerUrl ? [initialData.bannerUrl] : [],
  );
  const [galleryPreview, setGalleryPreview] = useState<string[]>(
    initialData?.galleryUrls ?? [],
  );
  const logoFileRef = useRef<File | null>(null);
  const coverFileRef = useRef<File | null>(null);
  const bannerFileRef = useRef<File | null>(null);
  const galleryFilesRef = useRef<File[]>([]);

  /* ── Form data ────────────────────────────────────────────── */
  const [formData, setFormData] = useState<FormData>({
    name_en: initialData?.name_en ?? "",
    name_ar: initialData?.name_ar ?? "",
    desc_en: initialData?.desc_en ?? "",
    desc_ar: initialData?.desc_ar ?? "",
    categoryId: initialData?.categoryId ?? "",
    city: initialData?.city ?? "",
    address: initialData?.address ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    website: initialData?.website ?? "",
    tags: initialData?.tags ?? "",
  });

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) =>
      setFormData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  /* ── Focus input on slide change ──────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [idx]);

  /* ── File helpers ─────────────────────────────────────────── */
  const handleFileSelect = (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    multiple = false,
    fileRef?: React.MutableRefObject<File | null>,
    filesRef?: React.MutableRefObject<File[]>,
  ) => {
    if (!files) return;
    const arr = Array.from(files);
    const urls = arr.map((f) => URL.createObjectURL(f));
    setter(multiple ? (prev) => [...prev, ...urls] : [urls[0]]);
    if (fileRef) fileRef.current = arr[0];
    if (filesRef) filesRef.current = [...filesRef.current, ...arr];
  };

  const handleRemovePreview = (
    url: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    fileRef?: React.MutableRefObject<File | null>,
    filesRef?: React.MutableRefObject<File[]>,
    index?: number,
  ) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    setter((prev) => prev.filter((u) => u !== url));
    if (fileRef) fileRef.current = null;
    if (filesRef && index != null) filesRef.current = filesRef.current.filter((_, i) => i !== index);
  };

  /* ── Validation for current slide ─────────────────────────── */
  const validate = useCallback((): string | null => {
    const s = slides[idx].id;
    if (s === "name_en" && !formData.name_en.trim())
      return ar ? "الاسم بالإنجليزية مطلوب" : "Please enter business name";
    if (s === "name_ar" && !formData.name_ar.trim())
      return ar ? "الاسم بالعربية مطلوب" : "Please enter Arabic name";
    if (s === "category" && !formData.categoryId)
      return ar ? "يرجى اختيار التصنيف" : "Please select a category";
    if (
      s === "contact" &&
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    )
      return ar ? "البريد الإلكتروني غير صالح" : "Invalid email format";
    return null;
  }, [idx, slides, formData, ar]);

  /* ── Navigation ───────────────────────────────────────────── */
  const goNext = useCallback(() => {
    const err = validate();
    if (err) {
      toast({ message: err, variant: "error" });
      return;
    }
    setDir("next");
    setIdx((i) => Math.min(i + 1, slides.length - 1));
  }, [validate, toast, slides.length]);

  const goPrev = useCallback(() => {
    setDir("prev");
    setIdx((i) => Math.max(i - 1, 0));
  }, []);

  const goTo = useCallback(
    (target: number) => {
      if (target > idx) return;
      setDir(target > idx ? "next" : "prev");
      setIdx(target);
    },
    [idx],
  );

  /* ── Keyboard shortcut: Enter to advance ──────────────────── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "TEXTAREA") return;
        e.preventDefault();
        goNext();
      }
    },
    [goNext],
  );

  /* ── Submit ───────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      // Text fields
      Object.entries(formData).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (location?.lat != null) fd.append("latitude", String(location.lat));
      if (location?.lng != null) fd.append("longitude", String(location.lng));
      // Files — new uploads
      if (logoFileRef.current) fd.append("logo", logoFileRef.current);
      if (coverFileRef.current) fd.append("cover", coverFileRef.current);
      if (bannerFileRef.current) fd.append("banner", bannerFileRef.current);
      for (const gf of galleryFilesRef.current) {
        fd.append("gallery", gf);
      }
      // Existing server URLs (kept when editing)
      const existingLogo = logoPreview.find((u) => u.startsWith("/media/"));
      if (existingLogo && !logoFileRef.current) fd.append("existingLogoUrl", existingLogo);
      const existingCover = coverPreview.find((u) => u.startsWith("/media/"));
      if (existingCover && !coverFileRef.current) fd.append("existingCoverUrl", existingCover);
      const existingBanner = bannerPreview.find((u) => u.startsWith("/media/"));
      if (existingBanner && !bannerFileRef.current) fd.append("existingBannerUrl", existingBanner);
      const existingGallery = galleryPreview.filter((u) => u.startsWith("/media/"));
      for (const gu of existingGallery) {
        fd.append("existingGalleryUrls", gu);
      }

      const url = isEdit
        ? `/api/business-request/${editRequestId}`
        : "/api/business-request";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, { method, body: fd });
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

  /* ── Category label helper ────────────────────────────────── */
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === formData.categoryId),
    [categories, formData.categoryId],
  );

  /* ── Progress ─────────────────────────────────────────────── */
  const progress = ((idx + 1) / slides.length) * 100;
  const currentSlide = slides[idx];
  const isLast = idx === slides.length - 1;

  /* ── Slide titles & subtitles ─────────────────────────────── */
  const slideContent: Record<SlideId, { title: string; sub: string }> = useMemo(
    () => ({
      name_en: {
        title: ar ? "ما اسم نشاطك التجاري؟" : "What's your business name?",
        sub: ar
          ? "الاسم بالإنجليزية كما تريده أن يظهر"
          : "The English name as you want it displayed",
      },
      name_ar: {
        title: ar ? "ما اسم نشاطك بالعربية؟" : "What's the Arabic name?",
        sub: ar
          ? "الاسم بالعربية كما تريده أن يظهر"
          : "Arabic name as it appears to Arabic speakers",
      },
      category: {
        title: ar ? "ما نوع نشاطك التجاري؟" : "What type of business is it?",
        sub: ar
          ? "اختر التصنيف الأقرب لنشاطك"
          : "Pick the category that best describes your business",
      },
      desc: {
        title: ar ? "صف نشاطك التجاري" : "Describe your business",
        sub: ar
          ? "اختياري — ساعد العملاء على فهم ما تقدمه"
          : "Optional — Help customers understand what you offer",
      },
      contact: {
        title: ar
          ? "كيف يمكن للعملاء التواصل معك؟"
          : "How can customers reach you?",
        sub: ar
          ? "أضف طرق التواصل المتاحة"
          : "Add your available contact methods",
      },
      location: {
        title: ar
          ? "أين يقع نشاطك التجاري؟"
          : "Where is your business located?",
        sub: ar
          ? "حدد الموقع على الخريطة أو استخدم موقعك الحالي"
          : "Pin the location on the map or use your current location",
      },
      logo: {
        title: ar ? "أضف شعار نشاطك" : "Add your business logo",
        sub: ar
          ? "اختياري — شعار مربع يمثل علامتك التجارية"
          : "Optional — A square logo representing your brand",
      },
      cover: {
        title: ar
          ? "أضف صورة غلاف لصفحتك"
          : "Add a cover photo for your page",
        sub: ar
          ? "اختياري — صورة عريضة تظهر أعلى الصفحة"
          : "Optional — A wide image shown at the top of your listing",
      },
      banner: {
        title: ar ? "أضف بانر لنشاطك" : "Add a banner image",
        sub: ar
          ? "اختياري — صورة بانر عريضة للعرض الترويجي"
          : "Optional — A wide promotional banner for your business",
      },
      gallery: {
        title: ar ? "أضف صور لنشاطك" : "Show off your business",
        sub: ar
          ? "اختياري — صور إضافية تعرض أعمالك ومنتجاتك"
          : "Optional — Extra photos showcasing your work and products",
      },
      review: {
        title: ar ? "كل شيء جاهز!" : "All set!",
        sub: ar
          ? "راجع بياناتك ثم أرسل الطلب"
          : "Review your details and submit your request",
      },
    }),
    [ar],
  );

  const { title, sub } = slideContent[currentSlide.id];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="mx-auto max-w-xl" onKeyDown={handleKeyDown}>
      {/* ── Progress bar ─────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {slideIcons[currentSlide.id]}
            <span className="text-xs font-medium text-(--muted-foreground)">
              {idx + 1} / {slides.length}
            </span>
          </div>
          {currentSlide.required ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              {ar ? "مطلوب" : "Required"}
            </span>
          ) : !isLast ? (
            <button
              type="button"
              onClick={goNext}
              className="text-xs font-medium text-(--muted-foreground) hover:text-accent transition-colors"
            >
              {ar ? "تخطي ←" : "Skip →"}
            </button>
          ) : null}
        </div>
        <div className="h-1.5 w-full rounded-full bg-(--chip-bg) overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, var(--accent), var(--accent-2, var(--accent)))",
            }}
          />
        </div>
      </div>

      {/* ── Slide header ─────────────────────────────────────── */}
      <div
        key={`header-${idx}`}
        className={`mb-6 animate-in fade-in duration-300 ${
          dir === "next" ? "slide-in-from-end-3" : "slide-in-from-start-3"
        }`}
      >
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-sm text-(--muted-foreground)">{sub}</p>
      </div>

      {/* ── Slide body ───────────────────────────────────────── */}
      <div
        key={`body-${idx}`}
        className={`animate-in fade-in duration-300 ${
          dir === "next" ? "slide-in-from-end-4" : "slide-in-from-start-4"
        }`}
      >
        {currentSlide.id === "name_en" && (
          <Input
            ref={inputRef}
            value={formData.name_en}
            onChange={(e) => set("name_en", e.target.value)}
            placeholder="e.g. Coffee Paradise"
            className="!text-lg !py-4"
            autoFocus
          />
        )}

        {currentSlide.id === "name_ar" && (
          <Input
            ref={inputRef}
            value={formData.name_ar}
            onChange={(e) => set("name_ar", e.target.value)}
            placeholder="مثال: جنة القهوة"
            dir="rtl"
            className="!text-lg !py-4"
          />
        )}

        {currentSlide.id === "category" && (
          <CategorySelectField
            categories={categories}
            locale={locale}
            value={formData.categoryId}
            onChange={(v: string) => set("categoryId", v)}
            placeholder={ar ? "اختر تصنيفاً..." : "Choose a category..."}
            searchPlaceholder={
              ar ? "ابحث عن تصنيف..." : "Search categories..."
            }
            required
          />
        )}

        {currentSlide.id === "desc" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-(--muted-foreground)">
                {ar ? "الوصف بالإنجليزية" : "English description"}
              </label>
              <MarkdownEditor
                value={formData.desc_en}
                onChange={(v) => set("desc_en", v)}
                placeholder="What makes your business special?"
                dir="ltr"
                height={120}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-(--muted-foreground)">
                {ar ? "الوصف بالعربية" : "Arabic description"}
              </label>
              <MarkdownEditor
                value={formData.desc_ar}
                onChange={(v) => set("desc_ar", v)}
                placeholder="ما الذي يميّز نشاطك التجاري؟"
                dir="rtl"
                height={120}
              />
            </div>
          </div>
        )}

        {currentSlide.id === "contact" && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-(--muted-foreground)">
                  {ar ? "رقم الهاتف" : "Phone"}
                </label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(val) => set("phone", val)}
                  placeholder="91234567"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-(--muted-foreground)">
                  {ar ? "البريد الإلكتروني" : "Email"}
                </label>
                <Input
                  ref={inputRef}
                  value={formData.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="info@mybusiness.com"
                  type="email"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-(--muted-foreground)">
                  {ar ? "المدينة" : "City"}
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder={ar ? "مسقط" : "Muscat"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-(--muted-foreground)">
                  {ar ? "الموقع الإلكتروني" : "Website"}
                </label>
                <Input
                  value={formData.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://mybusiness.com"
                  type="url"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-(--muted-foreground)">
                {ar ? "العنوان" : "Address"}
              </label>
              <Input
                value={formData.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder={
                  ar
                    ? "مثال: شارع السلطان قابوس، بناية رقم 5"
                    : "e.g. Sultan Qaboos St, Building 5"
                }
                dir={ar ? "rtl" : "ltr"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-(--muted-foreground)">
                {ar ? "الوسوم" : "Tags"}
              </label>
              <Input
                value={formData.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder={
                  ar ? "قهوة، واي فاي، إفطار" : "coffee, wifi, breakfast"
                }
              />
            </div>
          </div>
        )}

        {currentSlide.id === "location" && (
          <div className="sbc-card overflow-hidden rounded-2xl">
            <DynamicOsmLocationPicker
              value={location}
              onChange={setLocation}
              locale={locale}
              hideRadius
            />
          </div>
        )}

        {currentSlide.id === "logo" && (
          <MediaSlide
            ar={ar}
            previews={logoPreview}
            setter={setLogoPreview}
            onSelect={(files, setter) => handleFileSelect(files, setter, false, logoFileRef)}
            onRemove={(url, setter) => handleRemovePreview(url, setter, logoFileRef)}
            aspect="square"
            emptyLabel={ar ? "اضغط لاختيار الشعار" : "Tap to choose a logo"}
            emptyHint={ar ? "400×400 مربع" : "400×400 square"}
          />
        )}

        {currentSlide.id === "cover" && (
          <MediaSlide
            ar={ar}
            previews={coverPreview}
            setter={setCoverPreview}
            onSelect={(files, setter) => handleFileSelect(files, setter, false, coverFileRef)}
            onRemove={(url, setter) => handleRemovePreview(url, setter, coverFileRef)}
            aspect="wide"
            emptyLabel={
              ar ? "اضغط لاختيار صورة الغلاف" : "Tap to choose a cover image"
            }
            emptyHint={ar ? "1200×400 عريضة" : "1200×400 wide"}
          />
        )}

        {currentSlide.id === "banner" && (
          <MediaSlide
            ar={ar}
            previews={bannerPreview}
            setter={setBannerPreview}
            onSelect={(files, setter) => handleFileSelect(files, setter, false, bannerFileRef)}
            onRemove={(url, setter) => handleRemovePreview(url, setter, bannerFileRef)}
            aspect="wide"
            emptyLabel={
              ar ? "اضغط لاختيار صورة البانر" : "Tap to choose a banner image"
            }
            emptyHint={ar ? "1200×400 عريضة" : "1200×400 wide"}
          />
        )}

        {currentSlide.id === "gallery" && (
          <div className="space-y-3">
            {galleryPreview.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {galleryPreview.map((url, i) => (
                  <div
                    key={i}
                    className="relative group rounded-xl overflow-hidden aspect-square"
                  >
                    <Image
                      src={url}
                      alt={`Gallery ${i + 1}`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleRemovePreview(url, setGalleryPreview, undefined, galleryFilesRef, i)
                      }
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="text-white text-xs font-medium">
                        {ar ? "حذف" : "Remove"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-(--border) rounded-2xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
              <svg
                className="h-8 w-8 text-(--muted-foreground) mb-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <span className="text-sm font-medium text-(--muted-foreground)">
                {ar ? "أضف صوراً" : "Add photos"}
              </span>
              <span className="text-[10px] text-(--muted-foreground)/60 mt-0.5">
                {ar ? "يمكنك اختيار عدة صور" : "You can select multiple"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) =>
                  handleFileSelect(e.target.files, setGalleryPreview, true, undefined, galleryFilesRef)
                }
              />
            </label>
          </div>
        )}

        {currentSlide.id === "review" && (
          <ReviewSlide
            ar={ar}
            formData={formData}
            location={location}
            selectedCategory={selectedCategory}
            logoPreview={logoPreview}
            coverPreview={coverPreview}
            bannerPreview={bannerPreview}
            galleryPreview={galleryPreview}
            goTo={goTo}
          />
        )}
      </div>

      {/* ── Completion hint (live preview of value) ───────────── */}
      {!isLast && formData.name_en && currentSlide.id === "name_ar" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-(--muted-foreground)">
          <span className="text-emerald-500">✓</span>
          <span>EN: {formData.name_en}</span>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────── */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={idx === 0 ? () => router.push(`/${locale}/dashboard`) : goPrev}
          disabled={loading}
        >
          <span className="flex items-center gap-1.5">
            {ar ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            )}
            {idx === 0 ? (ar ? "إلغاء" : "Cancel") : (ar ? "رجوع" : "Back")}
          </span>
        </Button>

        {!isLast ? (
          <Button type="button" variant="primary" onClick={goNext}>
            <span className="flex items-center gap-1.5">
              {ar ? "التالي" : "Continue"}
              {ar ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
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
              ? (ar ? "جاري الإرسال..." : "Submitting...")
              : isEdit
                ? (ar ? "حفظ التعديلات" : "Save Changes")
                : (ar ? "إرسال الطلب" : "Submit Request")}
          </Button>
        )}
      </div>

      {/* ── Dots navigator ───────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-center gap-1">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            disabled={i > idx}
            className={`rounded-full transition-all duration-300 ${
              i === idx
                ? "h-2 w-6 bg-accent"
                : i < idx
                  ? "h-2 w-2 bg-emerald-400 dark:bg-emerald-500"
                  : "h-2 w-2 bg-(--border)"
            }`}
            aria-label={`Step ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Media upload slide                                                 */
/* ================================================================== */

function MediaSlide({
  ar,
  previews,
  setter,
  onSelect,
  onRemove,
  aspect,
  emptyLabel,
  emptyHint,
}: {
  ar: boolean;
  previews: string[];
  setter: React.Dispatch<React.SetStateAction<string[]>>;
  onSelect: (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => void;
  onRemove: (
    url: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => void;
  aspect: "square" | "wide";
  emptyLabel: string;
  emptyHint: string;
}) {
  const sizeClass = aspect === "square" ? "h-48 w-48 mx-auto" : "h-44 w-full";
  const previewClass =
    aspect === "square"
      ? "h-48 w-48 rounded-2xl mx-auto"
      : "h-44 w-full rounded-2xl";

  return previews.length > 0 ? (
    <div
      className={`relative group ${aspect === "square" ? "flex justify-center" : ""}`}
    >
      <Image
        src={previews[0]}
        alt=""
        width={aspect === "square" ? 200 : 1200}
        height={aspect === "square" ? 200 : 400}
        className={`${previewClass} object-cover`}
      />
      <button
        type="button"
        onClick={() => onRemove(previews[0], setter)}
        className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span className="text-white text-sm font-medium">
          {ar ? "حذف" : "Remove"}
        </span>
      </button>
    </div>
  ) : (
    <label
      className={`${sizeClass} flex flex-col items-center justify-center border-2 border-dashed border-(--border) rounded-2xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors`}
    >
      <svg
        className="h-8 w-8 text-(--muted-foreground) mb-2"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      <span className="text-sm font-medium text-(--muted-foreground)">
        {emptyLabel}
      </span>
      <span className="text-[10px] text-(--muted-foreground)/60 mt-0.5">
        {emptyHint}
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files, setter)}
      />
    </label>
  );
}

/* ================================================================== */
/*  Review slide                                                       */
/* ================================================================== */

function ReviewSlide({
  ar,
  formData,
  location,
  selectedCategory,
  logoPreview,
  coverPreview,
  bannerPreview,
  galleryPreview,
  goTo,
}: {
  ar: boolean;
  formData: FormData;
  location: OsmLocationValue | null;
  selectedCategory: Category | undefined;
  logoPreview: string[];
  coverPreview: string[];
  bannerPreview: string[];
  galleryPreview: string[];
  goTo: (idx: number) => void;
}) {
  const rows: { label: string; value: string; step: number }[] = [
    {
      label: ar ? "الاسم (EN)" : "Name (EN)",
      value: formData.name_en || "—",
      step: 0,
    },
    {
      label: ar ? "الاسم (AR)" : "Name (AR)",
      value: formData.name_ar || "—",
      step: 1,
    },
    {
      label: ar ? "التصنيف" : "Category",
      value: selectedCategory
        ? ar
          ? selectedCategory.name.ar || selectedCategory.name.en
          : selectedCategory.name.en
        : "—",
      step: 2,
    },
    {
      label: ar ? "الوصف" : "Description",
      value: formData.desc_en || formData.desc_ar ? "✓" : "—",
      step: 3,
    },
    {
      label: ar ? "الهاتف" : "Phone",
      value: formData.phone || "—",
      step: 4,
    },
    {
      label: ar ? "البريد" : "Email",
      value: formData.email || "—",
      step: 4,
    },
    {
      label: ar ? "المدينة" : "City",
      value: formData.city || "—",
      step: 4,
    },
    {
      label: ar ? "الموقع" : "Location",
      value: location
        ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
        : "—",
      step: 5,
    },
    {
      label: ar ? "الشعار" : "Logo",
      value: logoPreview.length > 0 ? "✓" : "—",
      step: 6,
    },
    {
      label: ar ? "الغلاف" : "Cover",
      value: coverPreview.length > 0 ? "✓" : "—",
      step: 7,
    },
    {
      label: ar ? "البانر" : "Banner",
      value: bannerPreview.length > 0 ? "✓" : "—",
      step: 8,
    },
    {
      label: ar ? "المعرض" : "Gallery",
      value:
        galleryPreview.length > 0
          ? `${galleryPreview.length} ${ar ? "صورة" : "images"}`
          : "—",
      step: 9,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Image previews */}
      {(logoPreview.length > 0 || coverPreview.length > 0) && (
        <div className="flex flex-wrap gap-4 items-end">
          {logoPreview[0] && (
            <Image
              src={logoPreview[0]}
              alt="Logo"
              width={80}
              height={80}
              className="h-20 w-20 rounded-xl object-cover ring-2 ring-(--border)"
            />
          )}
          {coverPreview[0] && (
            <Image
              src={coverPreview[0]}
              alt="Cover"
              width={400}
              height={150}
              className="flex-1 min-w-[180px] h-20 rounded-xl object-cover ring-2 ring-(--border)"
            />
          )}
        </div>
      )}

      {/* Data rows */}
      <div className="sbc-card rounded-2xl divide-y divide-(--border)">
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            onClick={() => goTo(row.step)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-accent/5 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
          >
            <span className="text-(--muted-foreground)">{row.label}</span>
            <span
              className={`font-medium truncate max-w-[55%] text-end ${
                row.value === "—"
                  ? "text-(--muted-foreground)/40"
                  : row.value === "✓"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : ""
              }`}
            >
              {row.value}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
