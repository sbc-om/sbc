"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  HiOutlineCheckCircle,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
} from "react-icons/hi";
import {
  HiOutlineWallet,
  HiOutlineBanknotes,
  HiOutlineExclamationTriangle,
  HiOutlineCheckBadge,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from "react-icons/hi2";
import Link from "next/link";

import type { Locale } from "@/lib/i18n/locales";
import type { Category } from "@/lib/db/types";
import type { AgentClientWithUser } from "@/lib/db/agents";
import type { Product } from "@/lib/db/products";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Button } from "@/components/ui/Button";
import { CategorySelectField } from "@/components/CategorySelectField";
import { UserSelect } from "@/components/ui/UserSelect";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { useToast } from "@/components/ui/Toast";

const OsmLocationPicker = dynamic(
  () =>
    import("@/components/maps/OsmLocationPicker").then(
      (m) => m.OsmLocationPicker
    ),
  { ssr: false }
);

type ClientSub = { productSlug: string; program: string; plan?: string };

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
    successMsg:
      "The business has been submitted for admin review. You can track the status in your businesses list.",
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
    bannerHint: "Shown first in link preview. Best size: 1200×630 (1.91:1), clear JPG/WEBP.",
    chooseBanner: "Choose banner image",
    gallery: "Image Gallery",
    galleryHint: "Additional business images (multiple selection allowed)",
    chooseGallery: "Choose gallery images",
    // Plan selection step
    step1Title: "Step 1: Select Client & Plan",
    step1Subtitle:
      "Choose a client and a subscription plan before registering the business",
    step2Title: "Step 2: Business Details",
    step2Subtitle: "Fill in the business information",
    clientSection: "Select Client",
    clientLabel: "Select Client",
    clientHint: "Choose the client this business belongs to",
    noClient: "-- Select a client --",
    clientSelected: "Business will be registered for:",
    selectPlan: "Select Subscription Plan",
    selectPlanHint: "The plan cost will be deducted from the client's wallet",
    planActive: "Active",
    planSelect: "Select",
    planSelected: "Selected",
    clientBalance: "Client Balance",
    insufficientBalance: "Insufficient Balance",
    insufficientBalanceMsg:
      "Client does not have enough balance. Please top up their wallet first.",
    topUpWallet: "Transfer to Client",
    noClientSelected: "Please select a client first",
    needsActivation: "Phone activation required",
    needsActivationMsg:
      "This client is not phone-verified yet. Send and verify activation code from Clients > New before continuing.",
    proceedToForm: "Continue to Business Form",
    backToPlans: "Back to Plan Selection",
    perYear: "/year",
    perMonth: "/month",
    per6mo: "/6 months",
    omr: "OMR",
    days: "days",
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
    successMsg:
      "تم إرسال العمل لمراجعة الإدارة. يمكنك متابعة الحالة في قائمة أعمالك.",
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
    bannerHint: "تظهر أولاً في رابط المعاينة. المقاس الأفضل 1200×630 (نسبة 1.91:1) بصيغة JPG/WEBP واضحة.",
    chooseBanner: "اختر صورة البانر",
    gallery: "معرض الصور",
    galleryHint: "صور إضافية للنشاط (يمكن اختيار عدة صور)",
    chooseGallery: "اختر صور المعرض",
    // Plan selection step
    step1Title: "الخطوة ١: اختيار العميل والطرح",
    step1Subtitle: "اختر العميل وطرح الاشتراك قبل تسجيل العمل",
    step2Title: "الخطوة ٢: تفاصيل العمل",
    step2Subtitle: "أدخل معلومات العمل",
    clientSection: "اختيار العميل",
    clientLabel: "اختر العميل",
    clientHint: "اختر العميل الذي ينتمي إليه هذا العمل",
    noClient: "-- اختر عميلاً --",
    clientSelected: "سيتم تسجيل العمل لـ:",
    selectPlan: "اختر طرح الاشتراك",
    selectPlanHint: "سيتم خصم مبلغ الطرح من محفظة العميل",
    planActive: "فعّال",
    planSelect: "اختيار",
    planSelected: "تم الاختيار",
    clientBalance: "رصيد العميل",
    insufficientBalance: "رصيد غير كافٍ",
    insufficientBalanceMsg:
      "رصيد العميل غير كافٍ. يرجى شحن محفظته أولاً.",
    topUpWallet: "تحويل للعميل",
    noClientSelected: "يرجى اختيار عميل أولاً",
    needsActivation: "يتطلب تفعيل الهاتف",
    needsActivationMsg:
      "هذا العميل غير مفعّل رقمه بعد. أرسل وتحقق من كود التفعيل من صفحة العملاء قبل المتابعة.",
    proceedToForm: "متابعة لنموذج العمل",
    backToPlans: "العودة لاختيار الطرح",
    perYear: "/سنة",
    perMonth: "/شهر",
    per6mo: "/٦ أشهر",
    omr: "ر.ع",
    days: "يوم",
  },
};

export function AgentBusinessForm({
  locale,
  categories,
  success,
  clients,
  preselectedClientId,
  preselectedClientName: _preselectedClientName,
  products,
  clientWallets,
  clientSubscriptions,
}: {
  locale: Locale;
  categories: Category[];
  success: boolean;
  clients: AgentClientWithUser[];
  preselectedClientId?: string;
  preselectedClientName?: string;
  products: Product[];
  clientWallets: Record<string, number>;
  clientSubscriptions: Record<string, ClientSub[]>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = texts[locale];
  const ar = locale === "ar";
  void _preselectedClientName;

  // ── Step management ──
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedClientId, setSelectedClientId] = useState(
    preselectedClientId || ""
  );
  const [selectedProductSlug, setSelectedProductSlug] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Business form state ──
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
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

  // ── Derived data ──
  const selectedClient = clients.find(
    (c) => c.clientUserId === selectedClientId
  );
  const clientBalance = selectedClientId
    ? clientWallets[selectedClientId] ?? 0
    : 0;
  const clientSubs = selectedClientId
    ? clientSubscriptions[selectedClientId] ?? []
    : [];

  const selectedProduct = products.find(
    (p) => p.slug === selectedProductSlug
  );
  const selectedClientVerified = !!selectedClient?.clientIsPhoneVerified;

  const directoryProducts = useMemo(
    () => products.filter((product) => product.program === "directory"),
    [products]
  );

  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        id: client.clientUserId,
        email: client.clientEmail,
        fullName: client.clientName,
        phone: client.clientPhone || undefined,
        role: "user" as const,
      })),
    [clients]
  );

  const canAffordSelected =
    selectedProduct ? clientBalance >= selectedProduct.price : false;

  const isProductActive = (product: Product) =>
    clientSubs.some((s) => s.productSlug === product.slug);

  // Sort products: active first, then by sortOrder / price
  const sortedProducts = useMemo(() => {
    return [...directoryProducts].sort((a, b) => {
      const aActive = isProductActive(a) ? 1 : 0;
      const bActive = isProductActive(b) ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.price - b.price;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directoryProducts, clientSubs]);

  const canProceed =
    !!selectedClientId && !!selectedProductSlug && canAffordSelected && selectedClientVerified;

  // ── Handlers ──
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
      toast({ message: ar ? "الرجاء ملء الحقول المطلوبة" : "Please fill required fields", variant: "error" });
      return;
    }

    if (!selectedClientId || !selectedProductSlug) {
      toast({
        message:
          ar
            ? "الرجاء اختيار العميل والطرح"
            : "Please select a client and plan",
        variant: "error",
      });
      return;
    }

    if (!selectedClientVerified) {
      toast({ message: t.needsActivationMsg, variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        clientUserId: selectedClientId,
        productSlug: selectedProductSlug,
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
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to submit request";
      toast({ message: ar ? `خطأ: ${message}` : `Error: ${message}`, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const formatInterval = (durationDays?: number) => {
    if (durationDays === 365) return t.perYear;
    if (durationDays === 30) return t.perMonth;
    if (durationDays === 180) return t.per6mo;
    return durationDays ? `${durationDays} ${t.days}` : "";
  };

  // ── Success state ──
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

  // ════════════════════════════════════════════════════════════════
  // STEP 1: Client + Plan Selection
  // ════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.step1Title}
          </h1>
          <p className="mt-1 text-sm text-(--muted-foreground)">
            {t.step1Subtitle}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-full bg-accent h-8 w-8 text-white text-xs font-bold">
            1
          </div>
          <div className="h-0.5 flex-1 bg-(--surface-border)" />
          <div className="flex items-center justify-center rounded-full bg-(--chip-bg) h-8 w-8 text-(--muted-foreground) text-xs font-bold">
            2
          </div>
        </div>

        {/* Client Selector */}
        <div className="sbc-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <HiOutlineShieldCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t.clientSection}</h3>
              <p className="text-sm text-(--muted-foreground)">
                {t.clientHint}
              </p>
            </div>
          </div>

          <UserSelect
            users={clientOptions}
            value={selectedClientId}
            onChange={(value) => {
              setSelectedClientId(value);
              setSelectedProductSlug("");
            }}
            placeholder={t.clientLabel}
            searchPlaceholder={t.clientHint}
            modalTitle={t.clientLabel}
            locale={locale as "en" | "ar"}
          />

          {/* Client Balance Display */}
          {selectedClientId && (
            <div
              className={`flex items-center justify-between rounded-xl p-4 transition-all ${
                clientBalance > 0
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50"
                  : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    clientBalance > 0
                      ? "bg-emerald-100 dark:bg-emerald-900/40"
                      : "bg-red-100 dark:bg-red-900/40"
                  }`}
                >
                  <HiOutlineWallet
                    className={`h-5 w-5 ${
                      clientBalance > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-(--muted-foreground)">
                    {t.clientBalance}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      clientBalance > 0
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {clientBalance.toFixed(3)} {t.omr}
                  </p>
                </div>
              </div>

              {clientBalance <= 0 && (
                <Link
                  href={`/${locale}/agent`}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/90"
                >
                  <HiOutlineBanknotes className="h-4 w-4" />
                  {t.topUpWallet}
                </Link>
              )}
            </div>
          )}

          {selectedClientId && !selectedClientVerified && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t.needsActivation}</p>
              <p className="mt-1 text-xs text-amber-700/90 dark:text-amber-300/90">{t.needsActivationMsg}</p>
            </div>
          )}
        </div>

        {/* Plan Selection */}
        {selectedClientId ? (
          <div className="sbc-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <HiOutlineSparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t.selectPlan}</h3>
                <p className="text-sm text-(--muted-foreground)">
                  {t.selectPlanHint}
                </p>
              </div>
            </div>

            {/* Product cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProducts.map((product) => {
                const active = isProductActive(product);
                const selected = selectedProductSlug === product.slug;
                const affordable = clientBalance >= product.price;
                const disabled = !affordable && !active;
                const productName =
                  locale === "ar"
                    ? product.name.ar || product.name.en
                    : product.name.en;

                return (
                  <button
                    key={product.slug}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) {
                        setSelectedProductSlug(
                          selected ? "" : product.slug
                        );
                      }
                    }}
                    className={`relative flex flex-col rounded-2xl border-2 p-5 text-start transition-all duration-200 ${
                      selected
                        ? "border-accent bg-accent/5 shadow-lg shadow-accent/10 ring-2 ring-accent/20"
                        : active
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10"
                        : disabled
                        ? "border-(--surface-border) opacity-50 cursor-not-allowed"
                        : "border-(--surface-border) hover:border-accent/50 hover:shadow-md cursor-pointer"
                    }`}
                  >
                    {/* Active badge */}
                    {active && (
                      <span className="absolute -top-2.5 end-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <HiOutlineCheckBadge className="h-3 w-3" />
                        {t.planActive}
                      </span>
                    )}

                    {/* Selected indicator */}
                    {selected && (
                      <span className="absolute -top-2.5 start-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <HiOutlineCheckCircle className="h-3 w-3" />
                        {t.planSelected}
                      </span>
                    )}

                    {/* Locked badge */}
                    {disabled && (
                      <span className="absolute -top-2.5 end-3 inline-flex items-center gap-1 rounded-full bg-gray-400 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        <HiOutlineLockClosed className="h-3 w-3" />
                        {t.insufficientBalance}
                      </span>
                    )}

                    {/* Product name & program */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent/70">
                        {product.program}
                      </p>
                      <h4 className="mt-0.5 text-base font-bold">
                        {productName}
                      </h4>
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <span className="text-2xl font-extrabold text-accent">
                        {product.price.toFixed(3)}
                      </span>{" "}
                      <span className="text-sm text-(--muted-foreground)">
                        {t.omr}
                        {formatInterval(product.durationDays)}
                      </span>
                    </div>

                    {/* Features */}
                    {product.features.length > 0 && (
                      <ul className="space-y-1 text-xs text-(--muted-foreground)">
                        {product.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <HiOutlineCheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                        {product.features.length > 4 && (
                          <li className="text-(--muted-foreground)/60">
                            +{product.features.length - 4} more
                          </li>
                        )}
                      </ul>
                    )}

                    {/* Badges */}
                    {product.badges && product.badges.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {product.badges.map((badge, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Insufficient balance warning */}
            {selectedProductSlug && !canAffordSelected && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 p-4">
                <HiOutlineExclamationTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    {t.insufficientBalance}
                  </p>
                  <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                    {t.insufficientBalanceMsg}
                  </p>
                  <Link
                    href={`/${locale}/agent`}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                  >
                    <HiOutlineBanknotes className="h-3.5 w-3.5" />
                    {t.topUpWallet}
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="sbc-card rounded-2xl p-8 text-center">
            <p className="text-sm text-(--muted-foreground)">
              {t.noClientSelected}
            </p>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/${locale}/agent/businesses`)}
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canProceed}
            onClick={() => setStep(2)}
            className="gap-2"
          >
            {t.proceedToForm}
            {ar ? (
              <HiOutlineArrowLeft className="h-4 w-4" />
            ) : (
              <HiOutlineArrowRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // STEP 2: Business Details Form
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.step2Title}
        </h1>
        <p className="mt-1 text-sm text-(--muted-foreground)">
          {t.step2Subtitle}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center rounded-full bg-emerald-500 h-8 w-8 text-white text-xs font-bold">
          <HiOutlineCheckCircle className="h-4 w-4" />
        </div>
        <div className="h-0.5 flex-1 bg-accent" />
        <div className="flex items-center justify-center rounded-full bg-accent h-8 w-8 text-white text-xs font-bold">
          2
        </div>
      </div>

      {/* Selected client & plan summary */}
      <div className="sbc-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <HiOutlineCheckBadge className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold">{selectedClient?.clientName}</p>
            <p className="text-xs text-(--muted-foreground)">
              {selectedProduct &&
                `${
                  locale === "ar"
                    ? selectedProduct.name.ar || selectedProduct.name.en
                    : selectedProduct.name.en
                } — ${selectedProduct.price.toFixed(3)} ${t.omr}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStep(1)}
          className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          {ar ? (
            <HiOutlineArrowRight className="h-3.5 w-3.5" />
          ) : (
            <HiOutlineArrowLeft className="h-3.5 w-3.5" />
          )}
          {t.backToPlans}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                    ? {
                        lat: location.lat,
                        lng: location.lng,
                        radiusMeters: 250,
                      }
                    : null
                }
                onChange={(next) => {
                  setLocation(
                    next ? { lat: next.lat, lng: next.lng } : null
                  );
                }}
                locale={locale}
                hideRadius
                markerImageUrl={logoPreview[0]}
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
        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep(1)}
            className="gap-2"
          >
            {ar ? (
              <HiOutlineArrowRight className="h-4 w-4" />
            ) : (
              <HiOutlineArrowLeft className="h-4 w-4" />
            )}
            {t.backToPlans}
          </Button>
          <Button type="submit" disabled={loading} variant="primary">
            {loading ? t.submitting : t.submit}
          </Button>
        </div>
      </form>
    </div>
  );
}
