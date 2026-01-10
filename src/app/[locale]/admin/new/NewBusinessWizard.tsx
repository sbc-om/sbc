"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import Image from "next/image";

import type { Locale } from "@/lib/i18n/locales";
import type { Category } from "@/lib/db/types";
import { createBusinessDraftAction, type CreateBusinessDraftResult } from "@/app/[locale]/admin/actions";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { UserSelect } from "@/components/ui/UserSelect";

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="group grid gap-2">
      <span className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </span>
      <Input name={name} placeholder={placeholder} required={required} />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="group grid gap-2">
      <span className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </span>
      <Textarea name={name} placeholder={placeholder} required={required} />
    </label>
  );
}

function MediaUploadBox({
  label,
  description,
  accept,
  multiple,
  onChange,
  previewUrls,
  onRemove,
}: {
  label: string;
  description: string;
  accept: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
  previewUrls: string[];
  onRemove: (url: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        <p className="text-xs text-(--muted-foreground) mt-0.5">{description}</p>
      </div>
      
      <label className="group relative cursor-pointer">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => onChange(e.target.files)}
          className="sr-only"
        />
        <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-(--surface-border) bg-(--chip-bg) transition hover:border-accent hover:bg-(--surface)">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-(--muted-foreground)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-xs text-(--muted-foreground)">
              {multiple ? "Click to select files" : "Click to select file"}
            </p>
          </div>
        </div>
      </label>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previewUrls.map((url) => (
            <div key={url} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-(--surface-border) bg-(--surface)">
                <Image
                  src={url}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
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
  users: Array<{ id: string; email: string; role: "admin" | "user" }>;
}) {
  const ar = locale === "ar";
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  
  // Media states
  const [coverPreview, setCoverPreview] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string[]>([]);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);

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

  if (state?.ok) {
    return (
      <div className="mt-8">
        <div className="sbc-card p-6">
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
    <div className="mt-8">
      {state && !state.ok ? (
        <div className="mb-6 sbc-card border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-red-700 dark:text-red-300">
              <span className="font-semibold">{ar ? "خطأ:" : "Error:"}</span> {state.error}
            </div>
          </div>
        </div>
      ) : null}

      <form action={formAction} className="grid gap-8">
        {/* Basic Info Section */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "المعلومات الأساسية" : "Basic Information"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "أدخل التفاصيل الأساسية للنشاط التجاري" : "Enter the core details of your business"}
          </p>
          
          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field 
                label="Slug" 
                name="slug" 
                placeholder="my-coffee-shop" 
                required 
              />
              <label className="group grid gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {ar ? "التصنيف" : "Category"}
                  <span className="text-red-500 ms-1">*</span>
                </span>
                <CategorySelect
                  categories={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder={ar ? "اختر تصنيفاً" : "Select a category"}
                  searchPlaceholder={ar ? "ابحث..." : "Search..."}
                  locale={locale}
                  required
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field 
                label={ar ? "الاسم (EN)" : "Name (EN)"} 
                name="name_en" 
                required 
                placeholder={ar ? "Coffee Paradise" : "Coffee Paradise"}
              />
              <Field 
                label={ar ? "الاسم (AR)" : "Name (AR)"} 
                name="name_ar" 
                required 
                placeholder={ar ? "جنة القهوة" : "جنة القهوة"}
              />
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "الوصف" : "Description"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "اكتب وصفاً جذاباً يوضح ما يميز نشاطك التجاري" : "Write a compelling description that highlights what makes your business unique"}
          </p>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <TextArea 
              label={ar ? "الوصف (EN)" : "Description (EN)"} 
              name="desc_en" 
              placeholder={ar ? "Describe your business..." : "Describe your business..."}
            />
            <TextArea 
              label={ar ? "الوصف (AR)" : "Description (AR)"} 
              name="desc_ar" 
              placeholder={ar ? "اوصف نشاطك التجاري..." : "اوصف نشاطك التجاري..."}
            />
          </div>
        </div>

        {/* Contact & Location Section */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "معلومات الاتصال والموقع" : "Contact & Location"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "ساعد العملاء في العثور عليك والتواصل معك" : "Help customers find and reach you"}
          </p>
          
          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label={ar ? "المدينة" : "City"} name="city" placeholder="Muscat" />
              <Field label={ar ? "الهاتف" : "Phone"} name="phone" placeholder="+968 9123 4567" />
            </div>

            <Field label={ar ? "العنوان" : "Address"} name="address" placeholder="Al Qurum Street, Building 123" />

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label={ar ? "الموقع الإلكتروني" : "Website"} name="website" placeholder="https://example.com" />
              <Field label={emailLabel} name="email" placeholder="info@example.com" />
            </div>

            <label className="group grid gap-2">
              <span className="text-sm font-semibold text-foreground">
                {ar ? "صاحب النشاط التجاري" : "Business Owner"}
              </span>
              <UserSelect
                users={users}
                value={selectedOwner}
                onChange={setSelectedOwner}
                placeholder={ar ? "اختر صاحب النشاط" : "Select business owner"}
                searchPlaceholder={ar ? "ابحث بالبريد الإلكتروني..." : "Search by email..."}
                locale={locale}
                allowEmpty
                emptyLabel={ar ? "بدون صاحب (اختياري)" : "No owner (optional)"}
              />
              <p className="text-xs text-(--muted-foreground)">
                {ar
                  ? "اختياري: اربط هذا النشاط بمستخدم موجود."
                  : "Optional: link this business to an existing user."}
              </p>
            </label>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "معلومات إضافية" : "Additional Details"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "أضف وسوماً لمساعدة الزوار في العثور على نشاطك" : "Add tags to help visitors discover your business"}
          </p>
          
          <Field
            label={ar ? "الوسوم (مفصولة بفواصل)" : "Tags (comma-separated)"}
            name="tags"
            placeholder={ar ? "قهوة، واي فاي، إفطار" : "coffee, wifi, breakfast"}
          />
        </div>

        {/* Media Upload Section */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "الصور والوسائط" : "Images & Media"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "ارفع صور نشاطك التجاري لجعله أكثر جاذبية" : "Upload images to make your business more appealing"}
          </p>
          
          <div className="grid gap-6">
            <MediaUploadBox
              label={ar ? "الصورة الرئيسية" : "Cover Image"}
              description={ar ? "الصورة الأساسية التي تمثل نشاطك" : "Main image representing your business"}
              accept="image/*"
              onChange={(files) => handleFileSelect(files, setCoverPreview, false)}
              previewUrls={coverPreview}
              onRemove={(url) => handleRemovePreview(url, setCoverPreview)}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <MediaUploadBox
                label={ar ? "الشعار" : "Logo"}
                description={ar ? "شعار نشاطك التجاري" : "Your business logo"}
                accept="image/*"
                onChange={(files) => handleFileSelect(files, setLogoPreview, false)}
                previewUrls={logoPreview}
                onRemove={(url) => handleRemovePreview(url, setLogoPreview)}
              />

              <MediaUploadBox
                label={ar ? "البنر" : "Banner"}
                description={ar ? "صورة البنر العريضة" : "Wide banner image"}
                accept="image/*"
                onChange={(files) => handleFileSelect(files, setBannerPreview, false)}
                previewUrls={bannerPreview}
                onRemove={(url) => handleRemovePreview(url, setBannerPreview)}
              />
            </div>

            <MediaUploadBox
              label={ar ? "معرض الصور" : "Gallery"}
              description={ar ? "صور إضافية لنشاطك (يمكنك اختيار عدة صور)" : "Additional images (you can select multiple)"}
              accept="image/*"
              multiple
              onChange={(files) => handleFileSelect(files, setGalleryPreview, true)}
              previewUrls={galleryPreview}
              onRemove={(url) => handleRemovePreview(url, setGalleryPreview)}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 border-t border-(--surface-border) pt-6">
          <Link
            href={`/${locale}/admin`}
            className={buttonVariants({ variant: "ghost" })}
          >
            {ar ? "إلغاء" : "Cancel"}
          </Link>
          <Button type="submit" disabled={pending} className="min-w-45">
            {pending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {ar ? "جارٍ الحفظ..." : "Saving..."}
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {ar ? "حفظ ونشر" : "Save & Publish"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
