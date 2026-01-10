import type { Locale } from "@/lib/i18n/locales";

export type StoreProductPrice = {
  /** numeric amount, for formatting */
  amount: number;
  /** ISO currency code */
  currency: "USD" | "OMR";
  /** If set, displayed as recurring */
  interval?: "month" | "year";
};

export type StoreProduct = {
  slug: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: StoreProductPrice;
  badges?: string[];
  features: { en: string[]; ar: string[] };
};

const PRODUCTS: StoreProduct[] = [
  {
    slug: "business-listing-pro",
    name: {
      en: "Business Listing Pro",
      ar: "إدراج الأعمال (Pro)",
    },
    description: {
      en: "Boost your directory presence with featured placement, rich media, and analytics.",
      ar: "عزّز ظهور نشاطك في الدليل عبر تمييز الإدراج، وإضافة وسائط، وإحصائيات.",
    },
    price: { amount: 9, currency: "OMR", interval: "month" },
    badges: ["Popular"],
    features: {
      en: [
        "Featured placement in search",
        "Logo + cover media",
        "Basic analytics (views & clicks)",
        "Priority review for updates",
      ],
      ar: [
        "تمييز في نتائج البحث",
        "شعار + غلاف",
        "إحصائيات أساسية (مشاهدات ونقرات)",
        "مراجعة أسرع للتحديثات",
      ],
    },
  },
  {
    slug: "loyalty-starter",
    name: {
      en: "Loyalty Card Starter",
      ar: "بطاقة الولاء (Starter)",
    },
    description: {
      en: "Issue digital loyalty cards and manage customers and points.",
      ar: "أصدر بطاقات ولاء رقمية وادِر العملاء والنقاط.",
    },
    price: { amount: 12, currency: "OMR", interval: "month" },
    badges: ["New"],
    features: {
      en: [
        "Customer CRM",
        "Digital card link per customer",
        "Points add/remove",
        "Export-ready customer list",
      ],
      ar: [
        "CRM للعملاء",
        "رابط بطاقة لكل عميل",
        "إضافة/خصم نقاط",
        "قائمة عملاء جاهزة للتصدير",
      ],
    },
  },
  {
    slug: "marketing-starter",
    name: {
      en: "Marketing Platform Starter",
      ar: "منصة التسويق (Starter)",
    },
    description: {
      en: "Start automating WhatsApp & Telegram outreach with templates and webhooks.",
      ar: "ابدأ أتمتة رسائل واتساب وتلغرام مع قوالب وWebhooks.",
    },
    price: { amount: 39, currency: "OMR", interval: "month" },
    features: {
      en: [
        "Template library",
        "Webhook events",
        "Basic segmentation (soon)",
        "API keys (phase 2)",
      ],
      ar: [
        "مكتبة قوالب",
        "أحداث Webhook",
        "تقسيم أساسي (قريباً)",
        "مفاتيح API (المرحلة 2)",
      ],
    },
  },
  {
    slug: "team-chat",
    name: {
      en: "Team Chat Inbox",
      ar: "صندوق الوارد للدردشة (Team)",
    },
    description: {
      en: "A shared inbox for customer chat, notes, and internal assignment.",
      ar: "صندوق وارد مشترك لدردشة العملاء مع ملاحظات وتوزيع داخلي.",
    },
    price: { amount: 19, currency: "OMR", interval: "month" },
    features: {
      en: [
        "Shared conversation inbox",
        "Internal notes",
        "Basic assignment (soon)",
        "Conversation search (soon)",
      ],
      ar: [
        "صندوق وارد مشترك",
        "ملاحظات داخلية",
        "توزيع أساسي (قريباً)",
        "بحث داخل المحادثات (قريباً)",
      ],
    },
  },
  {
    slug: "media-storage",
    name: {
      en: "Media Storage Add‑on",
      ar: "إضافة التخزين للوسائط",
    },
    description: {
      en: "More storage for business media (logo, cover, gallery) and faster delivery.",
      ar: "مساحة أكبر لوسائط النشاط (شعار، غلاف، معرض) مع تسليم أسرع.",
    },
    price: { amount: 5, currency: "OMR", interval: "month" },
    features: {
      en: ["+5GB storage", "CDN delivery", "Upload manager"],
      ar: ["+5GB مساحة", "تسليم عبر CDN", "مدير رفع الملفات"],
    },
  },
  {
    slug: "custom-integration",
    name: {
      en: "Custom Integration",
      ar: "تكامل مخصص",
    },
    description: {
      en: "Need SBC to integrate with your CRM or website? We'll build it.",
      ar: "هل تريد ربط SBC مع CRM أو موقعك؟ سنبني التكامل.",
    },
    price: { amount: 299, currency: "OMR" },
    badges: ["Service"],
    features: {
      en: ["Discovery call", "Implementation", "Basic documentation"],
      ar: ["جلسة تحديد المتطلبات", "تنفيذ التكامل", "توثيق أساسي"],
    },
  },
];

export function listStoreProducts(): StoreProduct[] {
  return PRODUCTS;
}

export function getStoreProductBySlug(slug: string): StoreProduct | null {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export function getStoreProductText(product: StoreProduct, locale: Locale) {
  const ar = locale === "ar";
  return {
    name: ar ? product.name.ar : product.name.en,
    description: ar ? product.description.ar : product.description.en,
    features: ar ? product.features.ar : product.features.en,
  };
}

export function formatStorePrice(price: StoreProductPrice, locale: Locale): string {
  // OMR uses 3 minor units; default Intl formatting is correct but we pin it for consistency.
  const fractionDigits = price.currency === "OMR" ? 3 : 0;
  const nf = new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    style: "currency",
    currency: price.currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  const base = nf.format(price.amount);
  if (!price.interval) return base;

  const suffix =
    locale === "ar"
      ? price.interval === "month"
        ? " / شهر"
        : " / سنة"
      : price.interval === "month"
        ? " / mo"
        : " / yr";

  return base + suffix;
}
