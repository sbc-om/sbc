"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

import type { Locale } from "@/lib/i18n/locales";
import type { Category } from "@/lib/db/types";
import { createBusinessDraftAction, type CreateBusinessDraftResult } from "@/app/[locale]/admin/actions";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { CategorySelectField } from "@/components/CategorySelectField";
import { UserSelect } from "@/components/ui/UserSelect";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";

const OsmLocationPicker = dynamic(
  () => import("@/components/maps/OsmLocationPicker").then((mod) => mod.OsmLocationPicker),
  { ssr: false }
);

const USERNAME_MIN = 2;
const USERNAME_MAX = 30;
const USERNAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getUsernameFormatError(value: string, ar: boolean) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < USERNAME_MIN || normalized.length > USERNAME_MAX) {
    return ar
      ? "الطول يجب أن يكون بين 2 و30 حرفاً."
      : "Length must be 2–30 characters.";
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return ar
      ? "مسموح فقط أحرف إنجليزية وأرقام والشرطة (-) ولا يمكن أن تبدأ أو تنتهي بشرطة."
      : "Use only English letters, digits, and hyphens. Hyphen can't be first or last.";
  }
  return null;
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
  const ar = locale === "ar";
  
  // Form data state
  const [formData, setFormData] = useState({
    username: "",
    name_en: "",
    name_ar: "",
    desc_en: "",
    desc_ar: "",
    categoryId: "",
    ownerId: "",
    city: "",
    phone: "",
    address: "",
    website: "",
    email: "",
    tags: "",
  });
  
  // Username validation
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const usernameCheckRef = useRef(0);
  
  // Slug
  const [slugValue, setSlugValue] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  
  // Checkboxes
  const [isApproved, setIsApproved] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [homepageFeatured, setHomepageFeatured] = useState(false);
  const [homepageTop, setHomepageTop] = useState(false);
  const [avatarMode, setAvatarMode] = useState<"icon" | "logo">("icon");
  
  // Media states
  const [coverPreview, setCoverPreview] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string[]>([]);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);
  
  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const usernameStatusClass =
    usernameStatus === "available"
      ? "text-emerald-600"
      : usernameStatus === "checking" || usernameStatus === "idle"
        ? "text-(--muted-foreground)"
        : "text-red-600";

  // Username validation effect
  useEffect(() => {
    if (!formData.username) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    const normalized = formData.username.trim().toLowerCase();
    const formatError = getUsernameFormatError(normalized, ar);
    if (formatError) {
      setUsernameStatus("invalid");
      setUsernameMessage(formatError);
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

        if (!data.ok) {
          setUsernameStatus("invalid");
          setUsernameMessage(ar ? "صيغة غير صحيحة" : "Invalid format");
          return;
        }

        if (data.available) {
          setUsernameStatus("available");
          setUsernameMessage(ar ? "متاح" : "Available");
        } else {
          setUsernameStatus("taken");
          setUsernameMessage(ar ? "غير متاح" : "Not available");
        }
      } catch {
        if (requestId !== usernameCheckRef.current) return;
        setUsernameStatus("invalid");
        setUsernameMessage(ar ? "تعذر التحقق الآن" : "Could not check right now");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.username, ar]);

  // Auto slug generation
  useEffect(() => {
    if (slugTouched) return;
    const next = slugifyEnglish(formData.name_en);
    setSlugValue(next);
  }, [formData.name_en, slugTouched]);

  const handleFileSelect = (
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    multiple: boolean = false
  ) => {
    if (!files) return;
    const urls = Array.from(files).map(file => URL.createObjectURL(file));
    if (multiple) {
      setter(prev => [...prev, ...urls]);
    } else {
      setter([urls[0]]);
    }
  };

  const handleRemovePreview = (
    url: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    URL.revokeObjectURL(url);
    setter(prev => prev.filter(u => u !== url));
  };

  const [state, formAction, pending] = useActionState<CreateBusinessDraftResult | null, FormData>(
    createBusinessDraftAction.bind(null, locale),
    null,
  );

  // Success state
  if (state?.ok) {
    return (
      <div className="mt-8">
        <div className="sbc-card relative z-20 overflow-visible p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground">
                {ar ? "تم إنشاء النشاط التجاري بنجاح!" : "Business Created Successfully!"}
              </h3>
              <p className="mt-2 text-sm text-(--muted-foreground)">
                {ar
                  ? "تم حفظ جميع البيانات والوسائط بنجاح. يمكنك الآن عرض النشاط أو إجراء تعديلات إضافية." 
                  : "All data and media have been saved successfully. You can now view the business or make additional edits."}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  className={buttonVariants({ variant: "primary", size: "sm" })}
                  href={`/${locale}/businesses/${state.id}`}
                >
                  {ar ? "عرض النشاط" : "View Business"}
                </Link>
                <Link
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                  href={`/${locale}/admin/${state.id}/edit`}
                >
                  {ar ? "تعديل النشاط" : "Edit Business"}
                </Link>
                <Link
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                  href={`/${locale}/admin/new`}
                >
                  {ar ? "إضافة نشاط جديد" : "Add New Business"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-6">
      {/* Hidden inputs */}
      <input type="hidden" name="categoryId" value={formData.categoryId} />
      <input type="hidden" name="ownerId" value={formData.ownerId} />
      <input type="hidden" name="avatarMode" value={avatarMode} />
      <input type="hidden" name="username" value={formData.username} />
      <input type="hidden" name="slug" value={slugValue} />
      <input type="hidden" name="name_en" value={formData.name_en} />
      <input type="hidden" name="name_ar" value={formData.name_ar} />
      <input type="hidden" name="desc_en" value={formData.desc_en} />
      <input type="hidden" name="desc_ar" value={formData.desc_ar} />
      <input type="hidden" name="city" value={formData.city} />
      <input type="hidden" name="phone" value={formData.phone} />
      <input type="hidden" name="address" value={formData.address} />
      <input type="hidden" name="website" value={formData.website} />
      <input type="hidden" name="email" value={formData.email} />
      <input type="hidden" name="tags" value={formData.tags} />
      {location && (
        <>
          <input type="hidden" name="latitude" value={String(location.lat)} />
          <input type="hidden" name="longitude" value={String(location.lng)} />
        </>
      )}

      {/* Error display */}
      {state && !state.ok && (
        <div className="sbc-card border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-red-700 dark:text-red-300">
              <span className="font-semibold">{ar ? "خطأ:" : "Error:"}</span> {state.error}
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="sbc-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">
          {ar ? "المعلومات الأساسية" : "Basic Information"}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              {ar ? "اسم المستخدم" : "Username"}
            </label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
              placeholder="username"
            />
            <span className={`block mt-1 min-h-4 text-xs ${usernameStatusClass}`}>
              {usernameMessage || " "}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {ar ? "التصنيف *" : "Category *"}
            </label>
            <CategorySelectField
              categories={categories}
              locale={locale}
              value={formData.categoryId}
              onChange={(value: string) => setFormData({ ...formData, categoryId: value })}
              placeholder={ar ? "اختر تصنيفاً" : "Choose a category"}
              searchPlaceholder={ar ? "ابحث عن تصنيف..." : "Search categories..."}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              {ar ? "الاسم (EN) *" : "Name (EN) *"}
            </label>
            <Input
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              placeholder="Coffee Paradise"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {ar ? "الاسم (AR) *" : "Name (AR) *"}
            </label>
            <Input
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              placeholder="جنة القهوة"
              required
            />
          </div>
        </div>

        {(slugValue || formData.name_en) && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {ar ? "المسار (Slug) *" : "Slug *"}
            </label>
            <Input
              value={slugValue}
              onChange={(e) => {
                setSlugTouched(true);
                setSlugValue(slugifyEnglish(e.target.value));
              }}
              placeholder="my-coffee-shop"
              required
            />
          </div>
        )}

        <div className="space-y-4">
          <MarkdownEditor
            label={ar ? "الوصف (EN)" : "Description (EN)"}
            value={formData.desc_en}
            onChange={(value) => setFormData({ ...formData, desc_en: value })}
            placeholder={ar ? "Describe your business..." : "Describe your business..."}
            dir="ltr"
            height={200}
          />

          <MarkdownEditor
            label={ar ? "الوصف (AR)" : "Description (AR)"}
            value={formData.desc_ar}
            onChange={(value) => setFormData({ ...formData, desc_ar: value })}
            placeholder={ar ? "اوصف نشاطك التجاري..." : "اوصف نشاطك التجاري..."}
            dir="rtl"
            height={200}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="sbc-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">
          {ar ? "معلومات الاتصال" : "Contact Information"}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              {ar ? "المدينة" : "City"}
            </label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Muscat"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {ar ? "الهاتف" : "Phone"}
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              placeholder="91234567"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              {emailLabel}
            </label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {ar ? "الموقع الإلكتروني" : "Website"}
            </label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              type="url"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "صاحب النشاط التجاري" : "Business Owner"}
          </label>
          <UserSelect
            users={users}
            value={formData.ownerId}
            onChange={(val) => setFormData({ ...formData, ownerId: val })}
            placeholder={ar ? "اختر صاحب النشاط" : "Select business owner"}
            searchPlaceholder={ar ? "ابحث بالبريد الإلكتروني..." : "Search by email..."}
            locale={locale}
            allowEmpty
            emptyLabel={ar ? "بدون صاحب (اختياري)" : "No owner (optional)"}
          />
          <p className="mt-1 text-xs text-(--muted-foreground)">
            {ar
              ? "اختياري: اربط هذا النشاط بمستخدم موجود."
              : "Optional: link this business to an existing user."}
          </p>
        </div>
      </div>

      {/* Geographic Location */}
      <div className="sbc-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            {ar ? "الموقع الجغرافي" : "Geographic Location"}
          </h3>
          <p className="text-sm text-(--muted-foreground) mt-1">
            {ar ? "حدد الموقع الدقيق للنشاط على الخريطة" : "Mark the exact business location on the map"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "العنوان" : "Address"}
          </label>
          <Textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder={ar ? "العنوان التفصيلي" : "Detailed address"}
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "حدد موقعك على الخريطة" : "Select your location on the map"}
          </label>
          <p className="text-sm text-(--muted-foreground) mb-3">
            {ar 
              ? "انقر على الخريطة لتحديد الموقع الدقيق لنشاطك"
              : "Click on the map to mark your exact business location"}
          </p>
          <div className="rounded-lg overflow-hidden">
            <OsmLocationPicker
              value={location ? { lat: location.lat, lng: location.lng, radiusMeters: 250 } : null}
              onChange={(next) => {
                setLocation(next ? { lat: next.lat, lng: next.lng } : null);
              }}
              locale={locale}
              hideRadius
            />
          </div>
          {location && (
            <p className="mt-2 text-xs text-(--muted-foreground)">
              {ar ? "الموقع المحدد:" : "Selected location:"} {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
        </div>
      </div>

      {/* Additional Details */}
      <div className="sbc-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">
          {ar ? "معلومات إضافية" : "Additional Details"}
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "الوسوم (مفصولة بفواصل)" : "Tags (comma-separated)"}
          </label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder={ar ? "قهوة، واي فاي، إفطار" : "coffee, wifi, breakfast"}
          />
        </div>
      </div>

      {/* Approval, Verification & Homepage */}
      <div className="sbc-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            {ar ? "الاعتماد والتوثيق والظهور" : "Approval, Verification & Homepage"}
          </h3>
          <p className="text-sm text-(--muted-foreground) mt-1">
            {ar
              ? "حدد اعتماد الظهور في القوائم، الشارة الزرقاء، والحالة الخاصة."
              : "Control listing approval, the blue check, and special status."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
            <input
              type="checkbox"
              name="isApproved"
              checked={isApproved}
              onChange={(e) => setIsApproved(e.target.checked)}
              className="mt-1 h-4 w-4 accent-emerald-600"
            />
            <div>
              <div className="text-sm font-semibold text-foreground">
                {ar ? "اعتماد الظهور في القوائم" : "Approved for listings"}
              </div>
              <div className="mt-1 text-xs text-(--muted-foreground)">
                {ar
                  ? "السماح بظهور النشاط في قوائم الأنشطة."
                  : "Allow this business to appear in public listings."}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
            <input
              type="checkbox"
              name="isVerified"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="mt-1 h-4 w-4 accent-blue-600"
            />
            <div>
              <div className="text-sm font-semibold text-foreground">
                {ar ? "تفعيل التوثيق (تِك أزرق)" : "Verified (blue check)"}
              </div>
              <div className="mt-1 text-xs text-(--muted-foreground)">
                {ar ? "يظهر بجانب اسم النشاط." : "Shown next to the business name."}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
            <input
              type="checkbox"
              name="isSpecial"
              checked={isSpecial}
              onChange={(e) => setIsSpecial(e.target.checked)}
              className="mt-1 h-4 w-4 accent-amber-500"
            />
            <div>
              <div className="text-sm font-semibold text-foreground">
                {ar ? "حساب خاص / مميّز" : "Special / VIP"}
              </div>
              <div className="mt-1 text-xs text-(--muted-foreground)">
                {ar ? "تمييز إضافي لعرضه كبزنس خاص." : "Highlights the business as special."}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
            <input
              type="checkbox"
              name="homepageFeatured"
              checked={homepageFeatured}
              onChange={(e) => setHomepageFeatured(e.target.checked)}
              className="mt-1 h-4 w-4 accent-emerald-500"
            />
            <div>
              <div className="text-sm font-semibold text-foreground">
                {ar ? "عرض في قائمة الـ 12 الرئيسية" : "Show in homepage 12"}
              </div>
              <div className="mt-1 text-xs text-(--muted-foreground)">
                {ar
                  ? "إضافة هذا النشاط إلى قائمة الـ 12 في الصفحة الرئيسية."
                  : "Pins this business in the homepage 12 list."}
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-(--surface-border) bg-(--surface) p-4">
            <input
              type="checkbox"
              name="homepageTop"
              checked={homepageTop}
              onChange={(e) => {
                const next = e.target.checked;
                setHomepageTop(next);
                if (next) setHomepageFeatured(true);
              }}
              className="mt-1 h-4 w-4 accent-emerald-500"
            />
            <div>
              <div className="text-sm font-semibold text-foreground">
                {ar ? "ضمن أفضل 3 في الرئيسية" : "Top 3 on homepage"}
              </div>
              <div className="mt-1 text-xs text-(--muted-foreground)">
                {ar
                  ? "يظهر ضمن أول 3 أنشطة في الصفحة الرئيسية."
                  : "Show in the top 3 slot on the homepage."}
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Images & Media */}
      <div className="sbc-card p-6 space-y-6">
        <h3 className="text-lg font-semibold">
          {ar ? "الصور والوسائط" : "Images & Media"}
        </h3>

        {/* Avatar Mode */}
        <div className="rounded-xl border border-(--surface-border) bg-(--chip-bg) p-4">
          <div className="text-sm font-semibold text-foreground">
            {ar ? "صورة الملف / الأيقونة" : "Profile image / icon"}
          </div>
          <p className="mt-1 text-xs text-(--muted-foreground)">
            {ar
              ? "الافتراضي: أيقونة التصنيف. يمكنك اختيار استخدام الشعار إن قمت برفعه."
              : "Default: category icon. You can choose to use the logo if you upload one."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="__avatarMode"
                checked={avatarMode === "icon"}
                onChange={() => setAvatarMode("icon")}
              />
              {ar ? "استخدم أيقونة التصنيف" : "Use category icon"}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="__avatarMode"
                checked={avatarMode === "logo"}
                onChange={() => setAvatarMode("logo")}
                disabled={logoPreview.length === 0}
              />
              {ar ? "استخدم الشعار (صورة)" : "Use logo (image)"}
            </label>
          </div>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "صورة الغلاف" : "Cover Image"}
          </label>
          <p className="text-sm text-(--muted-foreground) mb-3">
            {ar ? "صورة عريضة للخلفية (مقترح: 1200×400)" : "Wide background image (suggested: 1200×400)"}
          </p>
          <div className="space-y-3">
            {coverPreview.length > 0 && (
              <div className="relative rounded-lg overflow-hidden">
                <Image
                  src={coverPreview[0]}
                  alt="Cover preview"
                  width={1200}
                  height={400}
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePreview(coverPreview[0], setCoverPreview)}
                  className="absolute top-2 end-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            {coverPreview.length === 0 && (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-(--surface-border) rounded-lg cursor-pointer hover:border-(--primary) transition-colors">
                <span className="text-sm text-(--muted-foreground)">
                  {ar ? "اختر صورة الغلاف" : "Choose cover image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, setCoverPreview, false)}
                />
              </label>
            )}
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "الشعار" : "Logo"}
          </label>
          <p className="text-sm text-(--muted-foreground) mb-3">
            {ar ? "شعار مربع للعلامة التجارية (مقترح: 400×400)" : "Square brand logo (suggested: 400×400)"}
          </p>
          <div className="space-y-3">
            {logoPreview.length > 0 && (
              <div className="relative inline-block">
                <Image
                  src={logoPreview[0]}
                  alt="Logo preview"
                  width={200}
                  height={200}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePreview(logoPreview[0], setLogoPreview)}
                  className="absolute -top-2 -end-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            {logoPreview.length === 0 && (
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-(--surface-border) rounded-lg cursor-pointer hover:border-(--primary) transition-colors">
                <span className="text-xs text-(--muted-foreground) text-center px-2">
                  {ar ? "اختر شعار" : "Choose logo"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, setLogoPreview, false)}
                />
              </label>
            )}
          </div>
        </div>

        {/* Banner */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "صورة البانر" : "Banner Image"}
          </label>
          <p className="text-sm text-(--muted-foreground) mb-3">
            {ar ? "صورة ترويجية (مقترح: 1200×600)" : "Promotional image (suggested: 1200×600)"}
          </p>
          <div className="space-y-3">
            {bannerPreview.length > 0 && (
              <div className="relative rounded-lg overflow-hidden">
                <Image
                  src={bannerPreview[0]}
                  alt="Banner preview"
                  width={1200}
                  height={600}
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePreview(bannerPreview[0], setBannerPreview)}
                  className="absolute top-2 end-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            {bannerPreview.length === 0 && (
              <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-(--surface-border) rounded-lg cursor-pointer hover:border-(--primary) transition-colors">
                <span className="text-sm text-(--muted-foreground)">
                  {ar ? "اختر صورة البانر" : "Choose banner image"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, setBannerPreview, false)}
                />
              </label>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {ar ? "معرض الصور" : "Image Gallery"}
          </label>
          <p className="text-sm text-(--muted-foreground) mb-3">
            {ar ? "صور إضافية للنشاط (يمكن اختيار عدة صور)" : "Additional business images (multiple selection allowed)"}
          </p>
          <div className="space-y-3">
            {galleryPreview.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {galleryPreview.map((url, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden">
                    <Image
                      src={url}
                      alt={`Gallery ${index + 1}`}
                      width={300}
                      height={300}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePreview(url, setGalleryPreview)}
                      className="absolute top-1 end-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-(--surface-border) rounded-lg cursor-pointer hover:border-(--primary) transition-colors">
              <span className="text-sm text-(--muted-foreground)">
                {ar ? "اختر صور المعرض" : "Choose gallery images"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files, setGalleryPreview, true)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link
          href={`/${locale}/admin`}
          className={buttonVariants({ variant: "ghost" })}
        >
          {ar ? "إلغاء" : "Cancel"}
        </Link>
        <Button type="submit" disabled={pending} variant="primary">
          {pending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ ونشر" : "Save & Publish")}
        </Button>
      </div>
    </form>
  );
}
