"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import type { Category, Business } from "@/lib/db/types";
import { updateBusinessAction, deleteBusinessAction } from "@/app/[locale]/admin/actions";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategorySelect } from "@/components/ui/CategorySelect";

function Field({
  label,
  name,
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="group grid gap-2">
      <span className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </span>
      <Input name={name} placeholder={placeholder} required={required} defaultValue={defaultValue} />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="group grid gap-2">
      <span className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
      </span>
      <Textarea name={name} placeholder={placeholder} required={required} defaultValue={defaultValue} />
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
        <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-(--surface-border) bg-(--chip-bg) transition hover:border-(--accent) hover:bg-(--surface)">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-(--muted-foreground)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-xs text-(--muted-foreground)">
              {multiple ? "Click to upload files" : "Click to upload file"}
            </p>
          </div>
        </div>
      </label>

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {previewUrls.map((url, index) => (
            <div key={url + index} className="relative group">
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

export function EditBusinessForm({
  locale,
  business,
  categories,
  emailLabel,
}: {
  locale: Locale;
  business: Business;
  categories: Category[];
  emailLabel: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(business.categoryId || "");
  
  // Media states
  const [coverPreview, setCoverPreview] = useState<string[]>(
    business.media?.cover ? [business.media.cover] : []
  );
  const [logoPreview, setLogoPreview] = useState<string[]>(
    business.media?.logo ? [business.media.logo] : []
  );
  const [bannerPreview, setBannerPreview] = useState<string[]>(
    business.media?.banner ? [business.media.banner] : []
  );
  const [galleryPreview, setGalleryPreview] = useState<string[]>(
    business.media?.gallery || []
  );

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
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
    setter(prev => prev.filter(u => u !== url));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBusinessAction(locale, business.id);
      router.push(`/${locale}/admin`);
    } catch (e) {
      setDeleting(false);
      alert(ar ? "فشل الحذف" : "Delete failed");
    }
  };

  return (
    <div className="mt-8">
      <form action={updateBusinessAction.bind(null, locale, business.id)} className="grid gap-8">
        {/* Basic Info */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "المعلومات الأساسية" : "Basic Information"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "أدخل التفاصيل الأساسية" : "Enter core details"}
          </p>
          
          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field 
                label="Slug" 
                name="slug" 
                required 
                defaultValue={business.slug}
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
                  placeholder={ar ? "اختر تصنيفاً" : "Select category"}
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
                defaultValue={business.name.en}
              />
              <Field 
                label={ar ? "الاسم (AR)" : "Name (AR)"} 
                name="name_ar" 
                required 
                defaultValue={business.name.ar}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "الوصف" : "Description"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "وصف مفصل" : "Detailed description"}
          </p>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <TextArea 
              label={ar ? "الوصف (EN)" : "Description (EN)"} 
              name="desc_en" 
              defaultValue={business.description?.en}
            />
            <TextArea 
              label={ar ? "الوصف (AR)" : "Description (AR)"} 
              name="desc_ar" 
              defaultValue={business.description?.ar}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "الاتصال" : "Contact"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "معلومات التواصل" : "Contact information"}
          </p>
          
          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label={ar ? "المدينة" : "City"} name="city" defaultValue={business.city} />
              <Field label={ar ? "الهاتف" : "Phone"} name="phone" defaultValue={business.phone} />
            </div>

            <Field label={ar ? "العنوان" : "Address"} name="address" defaultValue={business.address} />

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label={ar ? "الموقع" : "Website"} name="website" defaultValue={business.website} />
              <Field label={emailLabel} name="email" defaultValue={business.email} />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "الوسوم" : "Tags"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "وسوم البحث" : "Search tags"}
          </p>
          
          <Field
            label={ar ? "الوسوم (مفصولة بفواصل)" : "Tags (comma-separated)"}
            name="tags"
            defaultValue={business.tags?.join(", ")}
          />
        </div>

        {/* Media */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "الصور" : "Images"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "قم بتحديث الصور" : "Update images"}
          </p>
          
          <div className="grid gap-6">
            <MediaUploadBox
              label={ar ? "الصورة الرئيسية" : "Cover"}
              description={ar ? "الصورة الأساسية" : "Main image"}
              accept="image/*"
              onChange={(files) => handleFileSelect(files, setCoverPreview, false)}
              previewUrls={coverPreview}
              onRemove={(url) => handleRemovePreview(url, setCoverPreview)}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <MediaUploadBox
                label={ar ? "الشعار" : "Logo"}
                description={ar ? "شعار النشاط" : "Logo"}
                accept="image/*"
                onChange={(files) => handleFileSelect(files, setLogoPreview, false)}
                previewUrls={logoPreview}
                onRemove={(url) => handleRemovePreview(url, setLogoPreview)}
              />

              <MediaUploadBox
                label={ar ? "البنر" : "Banner"}
                description={ar ? "صورة البنر" : "Banner"}
                accept="image/*"
                onChange={(files) => handleFileSelect(files, setBannerPreview, false)}
                previewUrls={bannerPreview}
                onRemove={(url) => handleRemovePreview(url, setBannerPreview)}
              />
            </div>

            <MediaUploadBox
              label={ar ? "المعرض" : "Gallery"}
              description={ar ? "صور إضافية" : "Additional images"}
              accept="image/*"
              multiple
              onChange={(files) => handleFileSelect(files, setGalleryPreview, true)}
              previewUrls={galleryPreview}
              onRemove={(url) => handleRemovePreview(url, setGalleryPreview)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-(--surface-border) pt-6">
          <ConfirmDialog
            title={ar ? "تأكيد الحذف" : "Confirm Delete"}
            message={ar ? "هل تريد حذف هذا النشاط؟" : "Delete this business?"}
            confirmText={ar ? "حذف" : "Delete"}
            cancelText={ar ? "إلغاء" : "Cancel"}
            onConfirm={handleDelete}
            variant="destructive"
            trigger={
              <Button variant="destructive" size="sm" disabled={deleting} type="button">
                {deleting ? (
                  <>{ar ? "جارٍ الحذف..." : "Deleting..."}</>
                ) : (
                  <>{ar ? "حذف" : "Delete"}</>
                )}
              </Button>
            }
          />

          <div className="flex items-center gap-3">
            <Link href={`/${locale}/admin`} className={buttonVariants({ variant: "ghost" })}>
              {ar ? "إلغاء" : "Cancel"}
            </Link>
            <Button type="submit" className="min-w-45">
              {ar ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
