"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { HiOutlineCheckCircle } from "react-icons/hi";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/locales";
import type { Category } from "@/lib/db/types";
import type { AgentClientWithUser } from "@/lib/db/agents";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/Button";
import { CategorySelectField } from "@/components/CategorySelectField";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";

const OsmLocationPicker = dynamic(
  () =>
    import("@/components/maps/OsmLocationPicker").then(
      (m) => m.OsmLocationPicker
    ),
  { ssr: false }
);

const texts = {
  en: {
    title: "Register a New Business",
    subtitle: "Fill the form to register a business for admin approval",
    basicInfo: "Basic Information",
    nameEn: "Business Name (EN) *",
    nameAr: "Business Name (AR) *",
    category: "Category *",
    descEn: "Description (EN)",
    descAr: "Description (AR)",
    contactInfo: "Contact Information",
    city: "City",
    phone: "Phone",
    email: "Email",
    website: "Website",
    location: "Geographic Location",
    locationDesc: "Mark the exact business location on the map",
    address: "Address",
    selectLocation: "Select your location on the map",
    selectLocationHint: "Click on the map to mark the exact business location",
    selectedLocation: "Selected location:",
    additional: "Additional Details",
    tags: "Tags (comma-separated)",
    tagsPlaceholder: "coffee, wifi, breakfast",
    cancel: "Cancel",
    submit: "Submit for Approval",
    submitting: "Submitting...",
    successTitle: "Request Submitted!",
    successMsg: "The business has been submitted for admin review. You can track the status in your businesses list.",
    viewBusinesses: "View My Businesses",
    registerAnother: "Register Another",
    chooseCat: "Choose a category",
    searchCat: "Search categories...",
    descEnPlaceholder: "Describe the business...",
    descArPlaceholder: "اوصف النشاط التجاري...",
    images: "Images & Media",
    coverImage: "Cover Image",
    coverHint: "Wide background image (suggested: 1200×400)",
    chooseCover: "Choose cover image",
    logo: "Logo",
    logoHint: "Square brand logo (suggested: 400×400)",
    chooseLogo: "Choose logo",
    banner: "Banner Image",
    bannerHint: "Promotional image (suggested: 1200×600)",
    chooseBanner: "Choose banner image",
    gallery: "Image Gallery",
    galleryHint: "Additional business images (multiple selection allowed)",
    chooseGallery: "Choose gallery images",
    clientSection: "Register For Client",
    clientLabel: "Select Client",
    clientHint: "Choose the client this business belongs to",
    noClient: "No client (general submission)",
    clientSelected: "Business will be registered for:",
  },
  ar: {
    title: "تسجيل عمل جديد",
    subtitle: "املأ النموذج لتسجيل عمل وإرساله للمراجعة",
    basicInfo: "المعلومات الأساسية",
    nameEn: "اسم العمل (EN) *",
    nameAr: "اسم العمل (AR) *",
    category: "التصنيف *",
    descEn: "الوصف (EN)",
    descAr: "الوصف (AR)",
    contactInfo: "معلومات الاتصال",
    city: "المدينة",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    website: "الموقع الإلكتروني",
    location: "الموقع الجغرافي",
    locationDesc: "حدد الموقع الدقيق للنشاط على الخريطة",
    address: "العنوان",
    selectLocation: "حدد موقعك على الخريطة",
    selectLocationHint: "انقر على الخريطة لتحديد الموقع الدقيق",
    selectedLocation: "الموقع المحدد:",
    additional: "معلومات إضافية",
    tags: "الوسوم (مفصولة بفواصل)",
    tagsPlaceholder: "قهوة، واي فاي، إفطار",
    cancel: "إلغاء",
    submit: "إرسال للمراجعة",
    submitting: "جاري الإرسال...",
    successTitle: "تم إرسال الطلب!",
    successMsg: "تم إرسال العمل لمراجعة الإدارة. يمكنك متابعة الحالة في قائمة أعمالك.",
    viewBusinesses: "عرض أعمالي",
    registerAnother: "تسجيل عمل آخر",
    chooseCat: "اختر تصنيفاً",
    searchCat: "ابحث عن تصنيف...",
    descEnPlaceholder: "Describe the business...",
    descArPlaceholder: "اوصف النشاط التجاري...",
    images: "الصور والوسائط",
    coverImage: "صورة الغلاف",
    coverHint: "صورة عريضة للخلفية (مقترح: 1200×400)",
    chooseCover: "اختر صورة الغلاف",
    logo: "الشعار",
    logoHint: "شعار مربع للعلامة التجارية (مقترح: 400×400)",
    chooseLogo: "اختر شعار",
    banner: "صورة البانر",
    bannerHint: "صورة ترويجية (مقترح: 1200×600)",
    chooseBanner: "اختر صورة البانر",
    gallery: "معرض الصور",
    galleryHint: "صور إضافية للنشاط (يمكن اختيار عدة صور)",
    chooseGallery: "اختر صور المعرض",
    clientSection: "تسجيل لعميل",
    clientLabel: "اختر العميل",
    clientHint: "اختر العميل الذي ينتمي إليه هذا العمل",
    noClient: "بدون عميل (تقديم عام)",
    clientSelected: "سيتم تسجيل العمل لـ:",
  },
};

export function AgentBusinessForm({
  locale,
  categories,
  success,
  clients,
  preselectedClientId,
  preselectedClientName,
}: {
  locale: Locale;
  categories: Category[];
  success: boolean;
  clients: AgentClientWithUser[];
  preselectedClientId?: string;
  preselectedClientName?: string;
}) {
  const router = useRouter();
  const t = texts[locale];
  const ar = locale === "ar";
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || "");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

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
    multiple = false
  ) => {
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    if (multiple) {
      setter((prev) => [...prev, ...urls]);
    } else {
      setter([urls[0]]);
    }
  };

  const handleRemovePreview = (
    url: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    URL.revokeObjectURL(url);
    setter((prev) => prev.filter((u) => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name_en || !formData.name_ar || !formData.categoryId) {
      alert(ar ? "الرجاء ملء الحقول المطلوبة" : "Please fill required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        clientUserId: selectedClientId || undefined,
        latitude: location?.lat,
        longitude: location?.lng,
      };

      const res = await fetch("/api/agent/business-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit request");
      }

      router.push(`/${locale}/agent/businesses/new?success=1`);
      router.refresh();
    } catch (error: any) {
      alert(
        ar ? `خطأ: ${error.message}` : `Error: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="sbc-card rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <HiOutlineCheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold">{t.successTitle}</h2>
          <p className="mt-2 text-sm text-(--muted-foreground)">
            {t.successMsg}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/${locale}/agent/businesses`}>
              <Button variant="primary">{t.viewBusinesses}</Button>
            </Link>
            <Link href={`/${locale}/agent/businesses/new`}>
              <Button variant="ghost">{t.registerAnother}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selector */}
        {clients.length > 0 && (
          <div className="sbc-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">{t.clientSection}</h3>
            <p className="text-sm text-(--muted-foreground)">{t.clientHint}</p>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full rounded-xl border border-gray-200/80 bg-transparent px-4 py-2.5 text-sm transition-colors focus:border-gray-300 focus:outline-none dark:border-white/[0.08] dark:focus:border-white/[0.15]"
            >
              <option value="">{t.noClient}</option>
              {clients.map((c) => (
                <option key={c.clientUserId} value={c.clientUserId}>
                  {c.clientName} — {c.clientPhone || c.clientEmail}
                </option>
              ))}
            </select>
            {selectedClientId && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t.clientSelected}{" "}
                {clients.find((c) => c.clientUserId === selectedClientId)?.clientName ||
                  preselectedClientName}
              </p>
            )}
          </div>
        )}

        {/* Basic Information */}
        <div className="sbc-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">{t.basicInfo}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.nameEn}
              </label>
              <Input
                value={formData.name_en}
                onChange={(e) =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
                placeholder="Coffee Paradise"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.nameAr}
              </label>
              <Input
                value={formData.name_ar}
                onChange={(e) =>
                  setFormData({ ...formData, name_ar: e.target.value })
                }
                placeholder="جنة القهوة"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.category}
            </label>
            <CategorySelectField
              categories={categories}
              locale={locale}
              value={formData.categoryId}
              onChange={(value: string) =>
                setFormData({ ...formData, categoryId: value })
              }
              placeholder={t.chooseCat}
              searchPlaceholder={t.searchCat}
              required
            />
          </div>

          <div className="space-y-4">
            <MarkdownEditor
              label={t.descEn}
              value={formData.desc_en}
              onChange={(value) =>
                setFormData({ ...formData, desc_en: value })
              }
              placeholder={t.descEnPlaceholder}
              dir="ltr"
              height={200}
            />
            <MarkdownEditor
              label={t.descAr}
              value={formData.desc_ar}
              onChange={(value) =>
                setFormData({ ...formData, desc_ar: value })
              }
              placeholder={t.descArPlaceholder}
              dir="rtl"
              height={200}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="sbc-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">{t.contactInfo}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.city}
              </label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder={ar ? "المدينة" : "City"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.phone}
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
                {t.email}
              </label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="info@business.com"
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.website}
              </label>
              <Input
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>
        </div>

        {/* Geographic Location */}
        <div className="sbc-card p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{t.location}</h3>
            <p className="text-sm text-(--muted-foreground) mt-1">
              {t.locationDesc}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t.address}
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
              {t.selectLocation}
            </label>
            <p className="text-sm text-(--muted-foreground) mb-3">
              {t.selectLocationHint}
            </p>
            <div className="rounded-lg overflow-hidden">
              <OsmLocationPicker
                value={
                  location
                    ? { lat: location.lat, lng: location.lng, radiusMeters: 250 }
                    : null
                }
                onChange={(next) => {
                  setLocation(next ? { lat: next.lat, lng: next.lng } : null);
                }}
                locale={locale}
                hideRadius
              />
            </div>
            {location && (
              <p className="mt-2 text-xs text-(--muted-foreground)">
                {t.selectedLocation} {location.lat.toFixed(6)},{" "}
                {location.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="sbc-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">{t.additional}</h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t.tags}
            </label>
            <Input
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder={t.tagsPlaceholder}
            />
          </div>
        </div>

        {/* Images & Media */}
        <div className="sbc-card p-6 space-y-6">
          <h3 className="text-lg font-semibold">{t.images}</h3>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t.coverImage}
            </label>
            <p className="text-sm text-(--muted-foreground) mb-3">
              {t.coverHint}
            </p>
            {coverPreview.length > 0 ? (
              <div className="relative rounded-lg overflow-hidden">
                <Image
                  src={coverPreview[0]}
                  alt="Cover"
                  width={1200}
                  height={400}
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleRemovePreview(coverPreview[0], setCoverPreview)
                  }
                  className="absolute top-2 end-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-(--surface-border) rounded-lg cursor-pointer hover:border-(--primary) transition-colors">
                <span className="text-sm text-(--muted-foreground)">
                  {t.chooseCover}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelect(e.target.files, setCoverPreview, false)
                  }
                />
              </label>
            )}
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t.logo}
            </label>
            <p className="text-sm text-(--muted-foreground) mb-3">
              {t.logoHint}
            </p>
            {logoPreview.length > 0 ? (
              <div className="relative inline-block">
                <Image
                  src={logoPreview[0]}
                  alt="Logo"
                  width={200}
                  height={200}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleRemovePreview(logoPreview[0], setLogoPreview)
                  }
                  className="absolute -top-2 -end-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-(--surface-border) rounded-lg cursor-pointer hover:border-(--primary) transition-colors">
                <span className="text-xs text-(--muted-foreground) text-center px-2">
                  {t.chooseLogo}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelect(e.target.files, setLogoPreview, false)
                  }
                />
              </label>
            )}
          </div>

          {/* Banner */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t.banner}
            </label>
            <p className="text-sm text-(--muted-foreground) mb-3">
              {t.bannerHint}
            </p>
            {bannerPreview.length > 0 ? (
              <div className="relative rounded-lg overflow-hidden">
                <Image
                  src={bannerPreview[0]}
                  alt="Banner"
                  width={1200}
                  height={600}
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleRemovePreview(bannerPreview[0], setBannerPreview)
                  }
                  className="absolute top-2 end-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-(--surface-border) rounded-lg cursor-pointer hover:border-(--primary) transition-colors">
                <span className="text-sm text-(--muted-foreground)">
                  {t.chooseBanner}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelect(e.target.files, setBannerPreview, false)
                  }
                />
              </label>
            )}
          </div>

          {/* Gallery */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t.gallery}
            </label>
            <p className="text-sm text-(--muted-foreground) mb-3">
              {t.galleryHint}
            </p>
            {galleryPreview.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {galleryPreview.map((url, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden"
                  >
                    <Image
                      src={url}
                      alt={`Gallery ${i + 1}`}
                      width={300}
                      height={300}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleRemovePreview(url, setGalleryPreview)
                      }
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
                {t.chooseGallery}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) =>
                  handleFileSelect(e.target.files, setGalleryPreview, true)
                }
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/${locale}/agent/businesses`)}
          >
            {t.cancel}
          </Button>
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? t.submitting : t.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
