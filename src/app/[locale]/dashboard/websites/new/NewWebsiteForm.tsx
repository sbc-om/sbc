"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlineGlobeAlt,
  HiOutlinePaintBrush,
  HiOutlineDocumentText,
  HiOutlineBriefcase,
} from "react-icons/hi2";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/lib/i18n/locales";

const TEMPLATES = [
  {
    id: "minimal",
    name: { en: "Minimal", ar: "بسيط" },
    description: { en: "Clean and simple design", ar: "تصميم نظيف وبسيط" },
    Icon: HiOutlineDocumentText,
    color: "from-gray-500 to-gray-700",
  },
  {
    id: "business",
    name: { en: "Business", ar: "تجاري" },
    description: { en: "Professional business layout", ar: "تصميم تجاري احترافي" },
    Icon: HiOutlineBriefcase,
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "creative",
    name: { en: "Creative", ar: "إبداعي" },
    description: { en: "Bold and creative design", ar: "تصميم جريء وإبداعي" },
    Icon: HiOutlinePaintBrush,
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "portfolio",
    name: { en: "Portfolio", ar: "معرض أعمال" },
    description: { en: "Showcase your work", ar: "اعرض أعمالك" },
    Icon: HiOutlineGlobeAlt,
    color: "from-emerald-500 to-teal-600",
  },
];

export function NewWebsiteForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const ar = locale === "ar";

  const [step, setStep] = useState<"template" | "info">("template");
  const [selectedTemplate, setSelectedTemplate] = useState("minimal");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [slug, setSlug] = useState("");
  const [taglineEn, setTaglineEn] = useState("");
  const [taglineAr, setTaglineAr] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleTitleEnChange = (value: string) => {
    setTitleEn(value);
    if (!slug || slug === slugify(titleEn)) {
      setSlug(slugify(value));
    }
  };

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  }

  const handleSubmit = async () => {
    if (!titleEn.trim() && !titleAr.trim()) {
      setError(ar ? "يرجى إدخال اسم الموقع" : "Please enter a website name");
      return;
    }
    if (!slug.trim()) {
      setError(ar ? "يرجى إدخال الرابط" : "Please enter a slug");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          title: { en: titleEn.trim() || titleAr.trim(), ar: titleAr.trim() || titleEn.trim() },
          tagline: taglineEn || taglineAr
            ? { en: taglineEn.trim(), ar: taglineAr.trim() }
            : undefined,
          templateId: selectedTemplate,
          branding: { primaryColor, secondaryColor: "#7c3aed" },
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        if (data.error === "SLUG_TAKEN") {
          setError(ar ? "هذا الرابط مستخدم بالفعل" : "This slug is already taken");
        } else if (data.error === "SUBSCRIPTION_REQUIRED") {
          setError(ar ? "يتطلب اشتراك نشط" : "Active subscription required");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      router.push(`/${locale}/dashboard/websites/${data.website.id}`);
    } catch {
      setError(ar ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => setStep("template")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            step === "template"
              ? "bg-accent text-(--accent-foreground)"
              : "bg-(--chip-bg) text-(--muted-foreground)"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">1</span>
          {ar ? "اختر القالب" : "Choose Template"}
        </button>
        <span className="text-(--muted-foreground)">→</span>
        <button
          type="button"
          onClick={() => setStep("info")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            step === "info"
              ? "bg-accent text-(--accent-foreground)"
              : "bg-(--chip-bg) text-(--muted-foreground)"
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">2</span>
          {ar ? "المعلومات" : "Site Info"}
        </button>
      </div>

      {/* Step 1: Template Selection */}
      {step === "template" && (
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`relative rounded-2xl border-2 p-6 text-start transition-all duration-200 ${
                  selectedTemplate === tpl.id
                    ? "border-accent bg-accent/5 ring-2 ring-accent/20 shadow-md"
                    : "border-(--surface-border) bg-(--surface) hover:border-(--accent)/30 hover:shadow-sm"
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tpl.color}`}>
                  <tpl.Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-base font-semibold">
                  {tpl.name[locale]}
                </h3>
                <p className="mt-1 text-sm text-(--muted-foreground)">
                  {tpl.description[locale]}
                </p>
                {selectedTemplate === tpl.id && (
                  <div className="absolute top-3 end-3 h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep("info")}>
              {ar ? "التالي" : "Next"} →
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Basic Info */}
      {step === "info" && (
        <div className="max-w-xl space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {ar ? "اسم الموقع (English)" : "Website Name (English)"} *
              </label>
              <Input
                value={titleEn}
                onChange={(e) => handleTitleEnChange(e.target.value)}
                placeholder="My Business Website"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {ar ? "اسم الموقع (عربي)" : "Website Name (Arabic)"}
              </label>
              <Input
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="موقع أعمالي"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {ar ? "الرابط (Slug)" : "URL Slug"} *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-(--muted-foreground)">sbc.om/site/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-website"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {ar ? "الشعار (English)" : "Tagline (English)"}
              </label>
              <Input
                value={taglineEn}
                onChange={(e) => setTaglineEn(e.target.value)}
                placeholder="Welcome to our website"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {ar ? "الشعار (عربي)" : "Tagline (Arabic)"}
              </label>
              <Input
                value={taglineAr}
                onChange={(e) => setTaglineAr(e.target.value)}
                placeholder="مرحباً بكم في موقعنا"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {ar ? "اللون الأساسي" : "Primary Color"}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-(--surface-border)"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-32"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setStep("template")}>
              ← {ar ? "السابق" : "Back"}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                ar ? "إنشاء الموقع" : "Create Website"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
