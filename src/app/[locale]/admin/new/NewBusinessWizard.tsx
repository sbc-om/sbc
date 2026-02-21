"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { createBusinessAction } from "@/app/[locale]/admin/actions";
import { CategorySelectField } from "@/components/CategorySelectField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { UserSelect } from "@/components/ui/UserSelect";
import { useToast } from "@/components/ui/Toast";
import type { Category } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";

const OsmLocationPicker = dynamic(
  () => import("@/components/maps/OsmLocationPicker").then((m) => m.OsmLocationPicker),
  { ssr: false },
);

type StepId = "info" | "contact" | "location" | "media" | "settings" | "review";

interface FormDataState {
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  slug: string;
  username: string;
  categoryId: string;
  ownerId: string;
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

function slugifyEnglish(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDomainInput(input: string) {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.split("/")[0] || "";
  value = value.replace(/\.$/, "");
  return value;
}

function normalizeUsernameInput(input: string) {
  return input.trim().replace(/^@/, "").toLowerCase();
}

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
const IconSettings = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9m-9 6h9m-9 6h9M4.5 6h.008v.008H4.5V6zm0 6h.008v.008H4.5V12zm0 6h.008v.008H4.5V18z" />
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

function StepHeader({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
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

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      {hint ? <p className="text-xs text-(--muted-foreground) mb-2">{hint}</p> : null}
      {children}
    </div>
  );
}

export function NewBusinessWizard({
  locale,
  emailLabel,
  categories,
  users,
}: {
  locale: Locale;
  emailLabel: string;
  categories: Category[];
  users: Array<{ id: string; email: string; fullName?: string; phone?: string; role: "admin" | "agent" | "user" }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const ar = locale === "ar";

  const steps = useMemo(
    () => [
      { id: "info" as StepId, label: ar ? "المعلومات" : "Info", icon: IconInfo },
      { id: "contact" as StepId, label: ar ? "التواصل" : "Contact", icon: IconPhone },
      { id: "location" as StepId, label: ar ? "الموقع" : "Location", icon: IconMap },
      { id: "media" as StepId, label: ar ? "الصور" : "Media", icon: IconCamera },
      { id: "settings" as StepId, label: ar ? "الإعدادات" : "Settings", icon: IconSettings },
      { id: "review" as StepId, label: ar ? "المراجعة" : "Review", icon: IconCheck },
    ],
    [ar],
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animDir, setAnimDir] = useState<"next" | "prev">("next");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const [isApproved, setIsApproved] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [homepageFeatured, setHomepageFeatured] = useState(false);
  const [homepageTop, setHomepageTop] = useState(false);
  const [avatarMode, setAvatarMode] = useState<"icon" | "logo">("icon");
  const [showSimilarBusinesses, setShowSimilarBusinesses] = useState(true);
  const [domainValue, setDomainValue] = useState("");
  const [domainStatus, setDomainStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [domainMessage, setDomainMessage] = useState("");
  const domainCheckRef = useRef(0);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const usernameCheckRef = useRef(0);

  const [coverPreview, setCoverPreview] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string[]>([]);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);

  const coverFileRef = useRef<File | null>(null);
  const logoFileRef = useRef<File | null>(null);
  const bannerFileRef = useRef<File | null>(null);
  const galleryFilesRef = useRef<File[]>([]);

  const [formData, setFormData] = useState<FormDataState>({
    name_en: "",
    name_ar: "",
    desc_en: "",
    desc_ar: "",
    slug: "",
    username: "",
    categoryId: "",
    ownerId: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    tags: "",
  });

  const set = useCallback(
    <K extends keyof FormDataState>(key: K, value: FormDataState[K]) =>
      setFormData((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === formData.categoryId),
    [categories, formData.categoryId],
  );

  const selectedOwner = useMemo(
    () => users.find((u) => u.id === formData.ownerId),
    [users, formData.ownerId],
  );
  const domainPreview = domainValue ? `https://${domainValue}` : "";

  useEffect(() => {
    const normalized = domainValue.trim().toLowerCase();
    if (!normalized) {
      setDomainStatus("idle");
      setDomainMessage("");
      return;
    }

    if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(normalized)) {
      setDomainStatus("invalid");
      setDomainMessage(ar ? "صيغة الدومين غير صحيحة" : "Invalid domain format");
      return;
    }

    setDomainStatus("checking");
    setDomainMessage(ar ? "جارٍ التحقق..." : "Checking availability...");
    const requestId = ++domainCheckRef.current;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/businesses/domain?domain=${encodeURIComponent(normalized)}`);
        const data = await res.json();
        if (requestId !== domainCheckRef.current) return;

        if (data.ok && data.available) {
          setDomainStatus("available");
          setDomainMessage(ar ? "متاح" : "Available");
          return;
        }

        setDomainStatus(data.reason === "TAKEN" ? "taken" : "invalid");
        setDomainMessage(
          data.reason === "TAKEN"
            ? ar
              ? "الدومين مستخدم"
              : "Domain already in use"
            : ar
              ? "صيغة الدومين غير صحيحة"
              : "Invalid domain format"
        );
      } catch {
        if (requestId !== domainCheckRef.current) return;
        setDomainStatus("invalid");
        setDomainMessage(ar ? "تعذر التحقق الآن" : "Could not check right now");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [domainValue, ar]);

  useEffect(() => {
    const normalized = normalizeUsernameInput(formData.username);
    if (!normalized) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (normalized.length <= 5) {
      setUsernameStatus("invalid");
      setUsernameMessage(ar ? "اسم المستخدم يجب أن يكون أكثر من 5 أحرف" : "Username must be longer than 5 characters");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage(ar ? "جارٍ التحقق..." : "Checking availability...");
    const requestId = ++usernameCheckRef.current;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/businesses/username/${encodeURIComponent(normalized)}`);
        const data = await res.json();
        if (requestId !== usernameCheckRef.current) return;

        if (data.ok && data.available) {
          setUsernameStatus("available");
          setUsernameMessage(ar ? "متاح" : "Available");
          return;
        }

        setUsernameStatus("taken");
        setUsernameMessage(ar ? "اسم المستخدم مستخدم" : "Username is already in use");
      } catch {
        if (requestId !== usernameCheckRef.current) return;
        setUsernameStatus("invalid");
        setUsernameMessage(ar ? "تعذر التحقق الآن" : "Could not check right now");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.username, ar]);

  const handleFileSelect = (
    files: FileList | null,
    setter: Dispatch<SetStateAction<string[]>>,
    fileRef: MutableRefObject<File | null> | MutableRefObject<File[]>,
    multiple = false,
  ) => {
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    const urls = filesArray.map((file) => URL.createObjectURL(file));

    if (multiple) {
      const current = Array.isArray(fileRef.current) ? fileRef.current : [];
      (fileRef as MutableRefObject<File[]>).current = [...current, ...filesArray];
      setter((prev) => [...prev, ...urls]);
      return;
    }

    (fileRef as MutableRefObject<File | null>).current = filesArray[0] ?? null;
    setter(urls);
  };

  const handleRemovePreview = (
    url: string,
    setter: Dispatch<SetStateAction<string[]>>,
    fileRef: MutableRefObject<File | null> | MutableRefObject<File[]>,
  ) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);

    setter((prev) => {
      const idx = prev.indexOf(url);
      const next = prev.filter((u) => u !== url);

      if (Array.isArray(fileRef.current)) {
        (fileRef as MutableRefObject<File[]>).current = fileRef.current.filter((_, i) => i !== idx);
      } else if (idx === 0) {
        (fileRef as MutableRefObject<File | null>).current = null;
      }

      return next;
    });
  };

  const validateStep = useCallback(
    (step: number): string | null => {
      switch (steps[step].id) {
        case "info":
          if (!formData.name_en.trim()) return ar ? "الاسم الإنجليزي مطلوب" : "English name is required";
          if (!formData.name_ar.trim()) return ar ? "الاسم العربي مطلوب" : "Arabic name is required";
          if (!formData.slug.trim()) return ar ? "المسار مطلوب" : "Slug is required";
          if (!normalizeUsernameInput(formData.username)) {
            return ar ? "اسم المستخدم مطلوب" : "Username is required";
          }
          if (normalizeUsernameInput(formData.username).length <= 5) {
            return ar ? "اسم المستخدم يجب أن يكون أكثر من 5 أحرف" : "Username must be longer than 5 characters";
          }
          if (["checking", "taken", "invalid"].includes(usernameStatus)) {
            return ar ? "يرجى تصحيح اسم المستخدم قبل المتابعة" : "Please fix the username before continuing";
          }
          if (!formData.categoryId) return ar ? "يرجى اختيار التصنيف" : "Please select a category";
          return null;
        case "contact":
          if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            return ar ? "البريد الإلكتروني غير صالح" : "Invalid email format";
          }
          return null;
        case "settings":
          if (domainValue.trim() && (domainStatus === "invalid" || domainStatus === "taken" || domainStatus === "checking")) {
            return ar ? "يرجى تصحيح الدومين قبل المتابعة" : "Please fix the custom domain before continuing";
          }
          return null;
        default:
          return null;
      }
    },
    [ar, formData, steps, domainValue, domainStatus, usernameStatus],
  );

  const isStepComplete = useCallback(
    (idx: number) => {
      switch (steps[idx].id) {
        case "info":
          return !!(formData.name_en.trim() && formData.name_ar.trim() && formData.slug.trim() && formData.categoryId);
        case "contact":
          return !!(formData.city || formData.phone || formData.email);
        case "location":
          return !!location;
        case "media":
          return logoPreview.length > 0 || coverPreview.length > 0 || bannerPreview.length > 0 || galleryPreview.length > 0;
        case "settings":
          return isApproved || isVerified || isSpecial || homepageFeatured || homepageTop || avatarMode === "logo";
        default:
          return false;
      }
    },
    [steps, formData, location, logoPreview.length, coverPreview.length, bannerPreview.length, galleryPreview.length, isApproved, isVerified, isSpecial, homepageFeatured, homepageTop, avatarMode],
  );

  const goNext = useCallback(() => {
    const err = validateStep(currentStep);
    if (err) {
      toast({ message: err, variant: "error" });
      return;
    }
    setAnimDir("next");
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }, [currentStep, steps.length, toast, validateStep]);

  const goPrev = useCallback(() => {
    setAnimDir("prev");
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      if (idx > currentStep) return;
      setAnimDir(idx > currentStep ? "next" : "prev");
      setCurrentStep(idx);
    },
    [currentStep],
  );

  const handleSubmit = async () => {
    const username = normalizeUsernameInput(formData.username);
    if (!username || username.length <= 5 || usernameStatus !== "available") {
      toast({
        message: ar
          ? "يرجى إدخال اسم مستخدم صالح (أكثر من 5 أحرف) ومتاح قبل الإنشاء"
          : "Please enter an available username longer than 5 characters before creating",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("name_en", formData.name_en);
      payload.append("name_ar", formData.name_ar);
      payload.append("desc_en", formData.desc_en);
      payload.append("desc_ar", formData.desc_ar);
      payload.append("slug", formData.slug);
      payload.append("username", username);
      payload.append("categoryId", formData.categoryId);
      payload.append("ownerId", formData.ownerId);
      payload.append("city", formData.city);
      payload.append("address", formData.address);
      payload.append("phone", formData.phone);
      payload.append("email", formData.email);
      payload.append("website", formData.website);
      payload.append("tags", formData.tags);
      payload.append("isApproved", isApproved ? "true" : "false");
      payload.append("isVerified", isVerified ? "true" : "false");
      payload.append("isSpecial", isSpecial ? "true" : "false");
      payload.append("homepageFeatured", homepageFeatured ? "true" : "false");
      payload.append("homepageTop", homepageTop ? "true" : "false");
      payload.append("avatarMode", avatarMode);
      payload.append("showSimilarBusinesses", showSimilarBusinesses ? "true" : "false");
      payload.append("customDomain", domainValue.trim().toLowerCase());

      if (location) {
        payload.append("latitude", String(location.lat));
        payload.append("longitude", String(location.lng));
      }

      if (coverFileRef.current) payload.append("coverImage", coverFileRef.current);
      if (logoFileRef.current) payload.append("logoImage", logoFileRef.current);
      if (bannerFileRef.current) payload.append("bannerImage", bannerFileRef.current);
      if (galleryFilesRef.current.length > 0) {
        galleryFilesRef.current.forEach((file) => payload.append("galleryImages", file));
      }

      await createBusinessAction(locale, payload);
    } catch (error: unknown) {
      const errorCode = error instanceof Error ? error.message : "";
      const usernameErrorMessage =
        errorCode === "USERNAME_REQUIRED"
          ? ar
            ? "اسم المستخدم مطلوب"
            : "Username is required"
          : errorCode === "USERNAME_TOO_SHORT"
            ? ar
              ? "اسم المستخدم يجب أن يكون أكثر من 5 أحرف"
              : "Username must be longer than 5 characters"
            : errorCode === "USERNAME_TAKEN"
              ? ar
                ? "اسم المستخدم مستخدم بالفعل"
                : "Username is already in use"
              : errorCode === "USERNAME_INVALID"
                ? ar
                  ? "اسم المستخدم غير صالح"
                  : "Invalid username"
                : null;
      toast({
        message:
          usernameErrorMessage ??
          (ar
            ? `فشل إنشاء النشاط: ${error instanceof Error ? error.message : "خطأ غير معروف"}`
            : `Failed to create business: ${error instanceof Error ? error.message : "Unknown error"}`),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <nav className="mb-8">
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
                    ${
                      isActive
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
              </li>
            );
          })}
        </ol>

        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">
              {ar ? `الخطوة ${currentStep + 1} من ${steps.length}` : `Step ${currentStep + 1} of ${steps.length}`}
            </span>
            <span className="text-sm font-medium text-accent">{steps[currentStep].label}</span>
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                disabled={idx > currentStep}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "bg-accent" : idx < currentStep ? "bg-emerald-400 dark:bg-emerald-500" : "bg-(--border)"
                }`}
              />
            ))}
          </div>
        </div>
      </nav>

      <div
        key={currentStep}
        className={`animate-in fade-in duration-300 ${animDir === "next" ? "slide-in-from-end-4" : "slide-in-from-start-4"}`}
      >
        {steps[currentStep].id === "info" && (
          <div className="space-y-6">
            <StepHeader
              icon={IconInfo}
              title={ar ? "المعلومات الأساسية" : "Basic Information"}
              desc={ar ? "بيانات النشاط الأساسية" : "Core business information"}
            />
            <div className="sbc-card p-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={ar ? "اسم النشاط (EN) *" : "Business Name (EN) *"}>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => {
                      const value = e.target.value;
                      set("name_en", value);
                      if (!slugTouched) set("slug", slugifyEnglish(value));
                    }}
                    placeholder="Coffee Paradise"
                    required
                  />
                </Field>
                <Field label={ar ? "اسم النشاط (AR) *" : "Business Name (AR) *"}>
                  <Input value={formData.name_ar} onChange={(e) => set("name_ar", e.target.value)} dir="rtl" required />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label={ar ? "الرابط (Slug) *" : "Slug *"}>
                  <Input
                    value={formData.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value.toLowerCase());
                    }}
                    placeholder="coffee-paradise"
                    required
                    dir="ltr"
                  />
                </Field>
                <Field label={ar ? "اسم المستخدم" : "Username"}>
                  <Input
                    value={formData.username}
                    onChange={(e) => set("username", normalizeUsernameInput(e.target.value))}
                    dir="ltr"
                  />
                  <span
                    className={`mt-2 block min-h-4 text-xs ${
                      usernameStatus === "available"
                        ? "text-emerald-600"
                        : usernameStatus === "checking" || usernameStatus === "idle"
                          ? "text-(--muted-foreground)"
                          : "text-red-600"
                    }`}
                  >
                    {usernameMessage || (ar ? "يجب أن يكون أكثر من 5 أحرف" : "Must be longer than 5 characters")}
                  </span>
                </Field>
              </div>

              <Field label={ar ? "التصنيف *" : "Category *"}>
                <CategorySelectField
                  categories={categories}
                  locale={locale}
                  value={formData.categoryId}
                  onChange={(v) => set("categoryId", v)}
                  placeholder={ar ? "اختر تصنيفاً" : "Choose a category"}
                  searchPlaceholder={ar ? "ابحث عن تصنيف..." : "Search categories..."}
                  required
                />
              </Field>

              <Field label={ar ? "صاحب النشاط" : "Business Owner"}>
                <UserSelect
                  users={users}
                  value={formData.ownerId}
                  onChange={(v) => set("ownerId", v)}
                  placeholder={ar ? "اختر صاحب النشاط" : "Select business owner"}
                  locale={locale}
                  allowEmpty
                  emptyLabel={ar ? "بدون صاحب" : "No owner"}
                />
              </Field>

              <Field label={ar ? "الوصف (EN)" : "Description (EN)"}>
                <MarkdownEditor
                  value={formData.desc_en}
                  onChange={(v) => set("desc_en", v)}
                  placeholder="Describe the business"
                  dir="ltr"
                  height={150}
                />
              </Field>

              <Field label={ar ? "الوصف (AR)" : "Description (AR)"}>
                <MarkdownEditor
                  value={formData.desc_ar}
                  onChange={(v) => set("desc_ar", v)}
                  placeholder="اوصف النشاط التجاري"
                  dir="rtl"
                  height={150}
                />
              </Field>
            </div>
          </div>
        )}

        {steps[currentStep].id === "contact" && (
          <div className="space-y-6">
            <StepHeader
              icon={IconPhone}
              title={ar ? "معلومات التواصل" : "Contact Information"}
              desc={ar ? "طرق الوصول والتواصل" : "How customers can reach you"}
            />
            <div className="sbc-card p-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label={ar ? "المدينة" : "City"}>
                  <Input value={formData.city} onChange={(e) => set("city", e.target.value)} placeholder={ar ? "مسقط" : "Muscat"} />
                </Field>
                <Field label={ar ? "الهاتف" : "Phone"}>
                  <PhoneInput value={formData.phone} onChange={(v) => set("phone", v)} placeholder="91234567" />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label={emailLabel}>
                  <Input value={formData.email} onChange={(e) => set("email", e.target.value)} type="email" dir="ltr" />
                </Field>
                <Field label={ar ? "الموقع الإلكتروني" : "Website"}>
                  <Input value={formData.website} onChange={(e) => set("website", e.target.value)} type="url" dir="ltr" />
                </Field>
              </div>

              <Field label={ar ? "العنوان" : "Address"}>
                <Input
                  value={formData.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder={ar ? "الشارع، المبنى، المنطقة" : "Street, building, area"}
                />
              </Field>

              <Field label={ar ? "الوسوم" : "Tags"} hint={ar ? "مفصولة بفواصل" : "Comma-separated"}>
                <Input value={formData.tags} onChange={(e) => set("tags", e.target.value)} placeholder={ar ? "قهوة، إفطار" : "coffee, breakfast"} />
              </Field>
            </div>
          </div>
        )}

        {steps[currentStep].id === "location" && (
          <div className="space-y-6">
            <StepHeader
              icon={IconMap}
              title={ar ? "الموقع الجغرافي" : "Geographic Location"}
              desc={ar ? "حدد موقع النشاط على الخريطة" : "Pin your business location on the map"}
            />
            <div className="sbc-card p-6">
              <div className="rounded-xl overflow-hidden border border-(--surface-border)">
                <OsmLocationPicker
                  value={location ? { lat: location.lat, lng: location.lng, radiusMeters: 250 } : null}
                  onChange={(next) => setLocation(next ? { lat: next.lat, lng: next.lng } : null)}
                  locale={locale}
                  hideRadius
                  markerImageUrl={logoPreview[0]}
                />
              </div>
              {location ? (
                <p className="mt-3 text-xs text-(--muted-foreground)">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
              ) : null}
            </div>
          </div>
        )}

        {steps[currentStep].id === "media" && (
          <div className="space-y-6">
            <StepHeader
              icon={IconCamera}
              title={ar ? "الصور والوسائط" : "Images & Media"}
              desc={ar ? "أضف الشعار وصور النشاط" : "Add logo and business images"}
            />
            <div className="sbc-card p-6 space-y-8">
              <MediaUploadField
                ar={ar}
                label={ar ? "الشعار" : "Logo"}
                hint={ar ? "شعار مربع للعلامة التجارية (400×400)" : "Square brand logo (400×400)"}
                previews={logoPreview}
                setter={setLogoPreview}
                fileRef={logoFileRef}
                handleFileSelect={handleFileSelect}
                handleRemovePreview={handleRemovePreview}
                aspect="square"
              />

              <MediaUploadField
                ar={ar}
                label={ar ? "صورة الغلاف" : "Cover Image"}
                hint={ar ? "صورة عريضة أعلى الصفحة (1200×400)" : "Wide image at the top of your page (1200×400)"}
                previews={coverPreview}
                setter={setCoverPreview}
                fileRef={coverFileRef}
                handleFileSelect={handleFileSelect}
                handleRemovePreview={handleRemovePreview}
                aspect="wide"
              />

              <MediaUploadField
                ar={ar}
                label={ar ? "صورة البانر" : "Banner Image"}
                hint={
                  ar
                    ? "تظهر أولاً في رابط المعاينة. المقاس المثالي 1200×630 (نسبة 1.91:1) بصيغة JPG/WEBP واضحة."
                    : "Shown first in link preview. Best size: 1200×630 (1.91:1), clear JPG/WEBP."
                }
                previews={bannerPreview}
                setter={setBannerPreview}
                fileRef={bannerFileRef}
                handleFileSelect={handleFileSelect}
                handleRemovePreview={handleRemovePreview}
                aspect="banner"
              />

              <div>
                <label className="block text-sm font-semibold mb-1">{ar ? "معرض الصور" : "Image Gallery"}</label>
                <p className="text-xs text-(--muted-foreground) mb-3">
                  {ar ? "صور إضافية لنشاطك (يمكن اختيار عدة صور)" : "Additional photos (multiple allowed)"}
                </p>

                {galleryPreview.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {galleryPreview.map((url, i) => (
                      <div key={url + i} className="relative group rounded-xl overflow-hidden">
                        <Image src={url} alt={`Gallery ${i + 1}`} width={320} height={220} className="w-full h-28 object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePreview(url, setGalleryPreview, galleryFilesRef)}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="text-white text-sm font-medium">{ar ? "حذف" : "Remove"}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--border) hover:border-accent hover:bg-accent/5 transition-colors">
                  <svg className="h-6 w-6 text-(--muted-foreground) mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="text-xs text-(--muted-foreground)">{ar ? "أضف صور المعرض" : "Add gallery images"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files, setGalleryPreview, galleryFilesRef, true)}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {steps[currentStep].id === "settings" && (
          <div className="space-y-6">
            <StepHeader
              icon={IconSettings}
              title={ar ? "الإعدادات" : "Settings"}
              desc={ar ? "إعدادات الاعتماد والظهور" : "Approval and visibility settings"}
            />
            <div className="sbc-card p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isApproved} onChange={(e) => setIsApproved(e.target.checked)} className="h-4 w-4" />{ar ? "معتمد" : "Approved"}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} className="h-4 w-4" />{ar ? "موثّق" : "Verified"}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} className="h-4 w-4" />{ar ? "مميز" : "Special"}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={homepageFeatured} onChange={(e) => setHomepageFeatured(e.target.checked)} className="h-4 w-4" />{ar ? "ضمن Featured" : "Homepage featured"}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={homepageTop} onChange={(e) => { const next = e.target.checked; setHomepageTop(next); if (next) setHomepageFeatured(true); }} className="h-4 w-4" />{ar ? "ضمن Top 3" : "Homepage top"}</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showSimilarBusinesses} onChange={(e) => setShowSimilarBusinesses(e.target.checked)} className="h-4 w-4" />{ar ? "إظهار الأنشطة المشابهة" : "Show similar businesses"}</label>
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold mb-2">{ar ? "وضع الصورة الشخصية" : "Avatar mode"}</p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="radio" checked={avatarMode === "icon"} onChange={() => setAvatarMode("icon")} />{ar ? "أيقونة التصنيف" : "Category icon"}</label>
                  <label className="flex items-center gap-2 text-sm"><input type="radio" checked={avatarMode === "logo"} onChange={() => setAvatarMode("logo")} disabled={logoPreview.length === 0} />{ar ? "الشعار" : "Logo"}</label>
                </div>
              </div>

              <div className="rounded-xl border border-(--surface-border) bg-(--chip-bg) p-4">
                <p className="text-sm font-semibold mb-1">{ar ? "الدومين المخصص" : "Custom Domain"}</p>
                <p className="text-xs text-(--muted-foreground) mb-3">
                  {ar
                    ? "سيتم ربط الدومين بهذا النشاط مباشرة بعد الإنشاء. أدخل الدومين بدون http/https وبصيغة مثل example.com أو www.example.com."
                    : "This domain will be linked to the business at creation. Enter only the hostname (no http/https), e.g. example.com or www.example.com."}
                </p>
                <Input
                  value={domainValue}
                  onChange={(e) => setDomainValue(normalizeDomainInput(e.target.value))}
                  onBlur={(e) => setDomainValue(normalizeDomainInput(e.target.value))}
                  placeholder="example.com"
                  dir="ltr"
                />
                <div className="mt-2 rounded-lg border border-(--surface-border) bg-(--surface) p-3 text-xs text-(--muted-foreground)">
                  <p className="font-medium text-foreground mb-1">{ar ? "متطلبات الدومين" : "Domain requirements"}</p>
                  <ul className="space-y-1">
                    <li>{ar ? "- يُسمح بالأحرف الإنجليزية والأرقام والشرطة والنقطة فقط." : "- Use letters, numbers, hyphens, and dots only."}</li>
                    <li>{ar ? "- يجب أن يحتوي على امتداد صالح مثل .com أو .net." : "- Must include a valid TLD such as .com or .net."}</li>
                    <li>{ar ? "- لا تضع بروتوكول أو مسار (مثل https:// أو /about)." : "- Do not include protocol or paths (e.g., https:// or /about)."}</li>
                  </ul>
                </div>
                <span
                  className={`mt-2 block min-h-4 text-xs ${
                    domainStatus === "available"
                      ? "text-emerald-600"
                      : domainStatus === "checking" || domainStatus === "idle"
                        ? "text-(--muted-foreground)"
                        : "text-red-600"
                  }`}
                >
                  {domainMessage || " "}
                </span>
                {domainPreview ? (
                  <p className="mt-1 text-xs text-(--muted-foreground)">
                    {ar ? "الرابط المتوقع:" : "Expected URL:"} <span dir="ltr" className="font-medium">{domainPreview}</span>
                  </p>
                ) : null}
                <div className="mt-3 rounded-lg border border-(--surface-border) bg-(--surface) p-3 text-xs">
                  <p className="font-medium text-foreground mb-2">{ar ? "إعدادات DNS المقترحة" : "Recommended DNS setup"}</p>
                  <div className="space-y-1.5 font-mono text-(--muted-foreground)">
                    <div>Type: CNAME</div>
                    <div>Name: www</div>
                    <div>Value: sbc.om</div>
                  </div>
                  <p className="mt-2 text-(--muted-foreground)">
                    {ar
                      ? "إن كان مزوّد DNS لا يدعم CNAME على الجذر (@)، استخدم ALIAS/ANAME إن كان متاحاً."
                      : "If your DNS provider does not support apex (@) CNAME, use ALIAS/ANAME if available."}
                  </p>
                  <p className="mt-2 text-(--muted-foreground)">
                    {ar
                      ? "ملاحظة: انتشار DNS قد يستغرق من 5 دقائق حتى 24 ساعة حسب مزود الدومين."
                      : "Note: DNS propagation can take from a few minutes up to 24 hours depending on your DNS provider."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {steps[currentStep].id === "review" && (
          <div className="space-y-6">
            <StepHeader
              icon={IconCheck}
              title={ar ? "مراجعة وإنشاء" : "Review & Create"}
              desc={ar ? "راجع البيانات قبل الإنشاء" : "Review your data before creating"}
            />
            <div className="sbc-card p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-(--muted-foreground)">{ar ? "الاسم" : "Name"}</span><span>{formData.name_en || "—"}</span></div>
              <div className="flex justify-between"><span className="text-(--muted-foreground)">{ar ? "التصنيف" : "Category"}</span><span>{selectedCategory ? (ar ? selectedCategory.name.ar : selectedCategory.name.en) : "—"}</span></div>
              <div className="flex justify-between"><span className="text-(--muted-foreground)">{ar ? "المالك" : "Owner"}</span><span>{selectedOwner?.fullName || selectedOwner?.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-(--muted-foreground)">{ar ? "المدينة" : "City"}</span><span>{formData.city || "—"}</span></div>
              <div className="flex justify-between"><span className="text-(--muted-foreground)">{ar ? "الدومين" : "Domain"}</span><span>{domainValue || "—"}</span></div>
              {domainPreview ? (
                <div className="flex justify-between"><span className="text-(--muted-foreground)">{ar ? "الرابط" : "URL"}</span><span dir="ltr">{domainPreview}</span></div>
              ) : null}
              <div className="flex justify-between"><span className="text-(--muted-foreground)">{ar ? "الصور" : "Media"}</span><span>{logoPreview.length + coverPreview.length + bannerPreview.length + galleryPreview.length > 0 ? (ar ? "مضاف" : "Added") : "—"}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={currentStep === 0 ? () => router.push(`/${locale}/admin/businesses`) : goPrev}
          disabled={loading}
        >
          <span className="flex items-center gap-1.5">
            {ar ? IconChevronRight : IconChevronLeft}
            {currentStep === 0 ? (ar ? "إلغاء" : "Cancel") : ar ? "السابق" : "Previous"}
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
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (ar ? "جاري الإنشاء..." : "Creating...") : ar ? "إنشاء النشاط" : "Create business"}
          </Button>
        )}
      </div>
    </div>
  );
}

function MediaUploadField({
  ar,
  label,
  hint,
  previews,
  setter,
  fileRef,
  handleFileSelect,
  handleRemovePreview,
  aspect,
}: {
  ar: boolean;
  label: string;
  hint: string;
  previews: string[];
  setter: Dispatch<SetStateAction<string[]>>;
  fileRef: MutableRefObject<File | null>;
  handleFileSelect: (
    files: FileList | null,
    setter: Dispatch<SetStateAction<string[]>>,
    fileRef: MutableRefObject<File | null> | MutableRefObject<File[]>,
    multiple?: boolean,
  ) => void;
  handleRemovePreview: (
    url: string,
    setter: Dispatch<SetStateAction<string[]>>,
    fileRef: MutableRefObject<File | null> | MutableRefObject<File[]>,
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
            width={aspect === "square" ? 220 : 1200}
            height={aspect === "square" ? 220 : aspect === "wide" ? 420 : 620}
            className={`${previewClass} object-cover`}
          />
          <button
            type="button"
            onClick={() => handleRemovePreview(previews[0], setter, fileRef)}
            className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="text-white text-sm font-medium">{ar ? "حذف" : "Remove"}</span>
          </button>
        </div>
      ) : (
        <label className={`${sizeClass} flex flex-col items-center justify-center border-2 border-dashed border-(--border) rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors`}>
          <svg className="h-6 w-6 text-(--muted-foreground) mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-xs text-(--muted-foreground)">{ar ? "اختر صورة" : "Choose image"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files, setter, fileRef, false)}
          />
        </label>
      )}
    </div>
  );
}
