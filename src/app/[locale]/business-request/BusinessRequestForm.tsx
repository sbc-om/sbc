"use client";

import { useState } from "react";
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
  () => import("@/components/maps/OsmLocationPicker").then((m) => m.OsmLocationPicker),
  { ssr: false }
);

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
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Media states
  const [coverPreview, setCoverPreview] = useState<string[]>([]);
  const [logoPreview, setLogoPreview] = useState<string[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string[]>([]);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name_en || !formData.name_ar || !formData.categoryId) {
      toast({ message: ar ? "الرجاء ملء الحقول المطلوبة" : "Please fill required fields", variant: "error" });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        latitude: location?.lat,
        longitude: location?.lng,
      };

      const res = await fetch(`/api/business-request`, {
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
      const message = error instanceof Error ? error.message : "Failed to submit request";
      toast({ message: ar ? `خطا: ${message}` : `Error: ${message}`, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {/* Basic Information */}
      <div className="sbc-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">
          {ar ? "المعلومات الأساسية" : "Basic Information"}
        </h3>

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
              placeholder={ar ? "المدينة" : "City"}
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
              {ar ? "البريد الإلكتروني" : "Email"}
            </label>
            <Input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={ar ? "البريد الإلكتروني" : "Email address"}
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
              placeholder={ar ? "رابط الموقع" : "Website URL"}
              type="url"
            />
          </div>
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
          <MarkdownEditor
            value={formData.address}
            onChange={(val) => setFormData({ ...formData, address: val })}
            placeholder={ar ? "العنوان التفصيلي" : "Detailed address"}
            dir={ar ? "rtl" : "ltr"}
            height={80}
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

      {/* Images & Media */}
      <div className="sbc-card p-6 space-y-6">
        <h3 className="text-lg font-semibold">
          {ar ? "الصور والوسائط" : "Images & Media"}
        </h3>

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
              <div className="relative rounded-lg overflow-hidden ">
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
                  className="w-32 h-32 object-cover rounded-lg "
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
              <div className="relative rounded-lg overflow-hidden ">
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
                  <div key={index} className="relative rounded-lg overflow-hidden ">
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

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/${locale}/dashboard`)}
        >
          {ar ? "إلغاء" : "Cancel"}
        </Button>
        <Button type="submit" disabled={loading} variant="primary">
          {loading ? (ar ? "جاري الإرسال..." : "Submitting...") : (ar ? "إرسال الطلب" : "Submit Request")}
        </Button>
      </div>
    </form>
  );
}
