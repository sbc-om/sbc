"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import type { Locale } from "@/lib/i18n/locales";
import type { Category, Business } from "@/lib/db/types";
import { updateBusinessAction, deleteBusinessAction } from "@/app/[locale]/admin/actions";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { UserSelect } from "@/components/ui/UserSelect";

const OsmLocationPicker = dynamic(
  () => import("@/components/maps/OsmLocationPicker").then((mod) => mod.OsmLocationPicker),
  { ssr: false }
);

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
        <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-(--surface-border) bg-(--chip-bg) transition hover:border-accent hover:bg-(--surface)">
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
  users,
}: {
  locale: Locale;
  business: Business;
  categories: Category[];
  emailLabel: string;
  users: Array<{ id: string; email: string; role: "admin" | "user" }>;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(business.categoryId || "");
  const [selectedOwner, setSelectedOwner] = useState(business.ownerId || "");
  
  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    business.latitude && business.longitude
      ? { lat: business.latitude, lng: business.longitude }
      : null
  );
  
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
    } catch {
      setDeleting(false);
      alert(ar ? "فشل الحذف" : "Delete failed");
    }
  };

  return (
    <div className="mt-8">
      <form action={updateBusinessAction.bind(null, locale, business.id)} className="grid gap-8">
        {/* Hidden inputs for state-controlled values */}
        <input type="hidden" name="categoryId" value={selectedCategory} />
        <input type="hidden" name="ownerId" value={selectedOwner} />
        
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
            {ar ? "معلومات الاتصال والموقع" : "Contact & Location"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "ساعد العملاء في العثور عليك والتواصل معك" : "Help customers find and reach you"}
          </p>
          
          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label={ar ? "المدينة" : "City"} name="city" placeholder="Muscat" defaultValue={business.city} />
              <Field label={ar ? "الهاتف" : "Phone"} name="phone" placeholder="+968 9123 4567" defaultValue={business.phone} />
            </div>

            <Field label={ar ? "العنوان" : "Address"} name="address" placeholder="Al Qurum Street, Building 123" defaultValue={business.address} />

            <div className="grid gap-6 sm:grid-cols-2">
              <Field label={ar ? "الموقع الإلكتروني" : "Website"} name="website" placeholder="https://example.com" defaultValue={business.website} />
              <Field label={emailLabel} name="email" placeholder="info@example.com" defaultValue={business.email} />
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

        {/* Location Section */}
        <div className="sbc-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ar ? "الموقع الجغرافي" : "Geographic Location"}
          </h2>
          <p className="text-sm text-(--muted-foreground) mb-6">
            {ar ? "حدد الموقع الدقيق للنشاط على الخريطة" : "Mark the exact business location on the map"}
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {ar ? "حدد موقعك على الخريطة" : "Select your location on the map"}
              </label>
              <p className="text-sm text-(--muted-foreground) mb-3">
                {ar 
                  ? "انقر على الخريطة لتحديد الموقع الدقيق لنشاطك التجاري"
                  : "Click on the map to mark your exact business location"}
              </p>
              <div className="rounded-lg overflow-hidden ">
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
                <>
                  <p className="mt-2 text-xs text-(--muted-foreground)">
                    {ar ? "الموقع المحدد:" : "Selected location:"} {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                  <input type="hidden" name="latitude" value={String(location.lat)} />
                  <input type="hidden" name="longitude" value={String(location.lng)} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
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
            defaultValue={business.tags?.join(", ")}
          />
        </div>

        {/* Media */}
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
        <div className="flex items-center justify-between border-t border-(--surface-border) pt-6">
          <ConfirmDialog
            title={ar ? "تأكيد الحذف" : "Confirm Delete"}
            message={ar ? "هل تريد حذف هذا النشاط؟ لا يمكن التراجع عن هذا الإجراء." : "Delete this business? This action cannot be undone."}
            confirmText={ar ? "حذف" : "Delete"}
            cancelText={ar ? "إلغاء" : "Cancel"}
            onConfirm={handleDelete}
            variant="destructive"
            trigger={
              <Button variant="destructive" size="sm" disabled={deleting} type="button">
                {deleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {ar ? "جارٍ الحذف..." : "Deleting..."}
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {ar ? "حذف النشاط" : "Delete Business"}
                  </>
                )}
              </Button>
            }
          />

          <div className="flex items-center gap-3">
            <Link href={`/${locale}/admin`} className={buttonVariants({ variant: "ghost" })}>
              {ar ? "إلغاء" : "Cancel"}
            </Link>
            <Button type="submit" className="min-w-45">
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {ar ? "حفظ ونشر" : "Save & Publish"}
              </>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
