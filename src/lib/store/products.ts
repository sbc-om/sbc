import type { Locale } from "@/lib/i18n/locales";

export type StoreProductPrice = {
  /** numeric amount, for formatting */
  amount: number;
  /** ISO currency code */
  currency: "USD" | "OMR";
  /** If set, displayed as recurring */
  interval?: "month" | "year" | "6mo";
};

export type StoreProgramId = "directory" | "loyalty" | "marketing";

export type StoreProduct = {
  slug: string;
  /** Program this product grants access to. */
  program: StoreProgramId;
  /** Plan id within the program. */
  plan: string;
  /** Access duration in days (used for entitlements). */
  durationDays: number;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: StoreProductPrice;
  badges?: string[];
  features: { en: string[]; ar: string[] };
};

const PRODUCTS: StoreProduct[] = [
  {
    slug: "directory-membership-yearly",
    program: "directory",
    plan: "directory-yearly",
    durationDays: 365,
    name: {
      en: "Business Directory - Membership",
      ar: "دليل الأعمال - عضوية",
    },
    description: {
      en: "Annual membership in the business directory.",
      ar: "عضوية سنوية في دليل الأعمال.",
    },
    price: { amount: 50, currency: "OMR", interval: "year" },
    features: {
      en: ["Directory membership", "Standard listing visibility"],
      ar: ["عضوية في الدليل", "ظهور قياسي للإدراج"],
    },
  },
  {
    slug: "directory-homepage-yearly",
    program: "directory",
    plan: "homepage-yearly",
    durationDays: 365,
    name: {
      en: "Business Directory - Homepage display",
      ar: "دليل الأعمال - عرض في الصفحة الرئيسية",
    },
    description: {
      en: "Show your business on the homepage (annual).",
      ar: "عرض نشاطك في الصفحة الرئيسية (سنوي).",
    },
    price: { amount: 100, currency: "OMR", interval: "year" },
    features: {
      en: ["Homepage placement", "Higher visibility"],
      ar: ["ظهور في الصفحة الرئيسية", "وضوح أعلى"],
    },
  },
  {
    slug: "directory-homepage-top-yearly",
    program: "directory",
    plan: "homepage-top-yearly",
    durationDays: 365,
    name: {
      en: "Business Directory - Top row on homepage",
      ar: "دليل الأعمال - الصف الأول في الرئيسية",
    },
    description: {
      en: "Top row placement on homepage (annual).",
      ar: "عرض في الصف الأول بالصفحة الرئيسية (سنوي).",
    },
    price: { amount: 200, currency: "OMR", interval: "year" },
    badges: ["Best"],
    features: {
      en: ["Top row on homepage", "Maximum visibility"],
      ar: ["الصف الأول في الرئيسية", "أعلى وضوح"],
    },
  },
  {
    slug: "loyalty-monthly",
    program: "loyalty",
    plan: "monthly",
    durationDays: 30,
    name: {
      en: "Loyalty System - Monthly",
      ar: "نظام الولاء - شهري",
    },
    description: {
      en: "Loyalty system subscription (monthly).",
      ar: "اشتراك نظام الولاء (شهري).",
    },
    price: { amount: 15, currency: "OMR", interval: "month" },
    features: {
      en: ["Customer CRM", "Digital loyalty cards", "Points management"],
      ar: ["إدارة العملاء", "بطاقات ولاء رقمية", "إدارة النقاط"],
    },
  },
  {
    slug: "loyalty-6mo",
    program: "loyalty",
    plan: "6mo",
    durationDays: 180,
    name: {
      en: "Loyalty System - 6 months",
      ar: "نظام الولاء - 6 أشهر",
    },
    description: {
      en: "Loyalty system subscription (6 months).",
      ar: "اشتراك نظام الولاء (6 أشهر).",
    },
    price: { amount: 60, currency: "OMR", interval: "6mo" },
    badges: ["Save"],
    features: {
      en: ["Customer CRM", "Digital loyalty cards", "Points management"],
      ar: ["إدارة العملاء", "بطاقات ولاء رقمية", "إدارة النقاط"],
    },
  },
  {
    slug: "loyalty-yearly",
    program: "loyalty",
    plan: "yearly",
    durationDays: 365,
    name: {
      en: "Loyalty System - Yearly",
      ar: "نظام الولاء - سنوي",
    },
    description: {
      en: "Loyalty system subscription (annual).",
      ar: "اشتراك نظام الولاء (سنوي).",
    },
    price: { amount: 90, currency: "OMR", interval: "year" },
    features: {
      en: ["Customer CRM", "Digital loyalty cards", "Points management"],
      ar: ["إدارة العملاء", "بطاقات ولاء رقمية", "إدارة النقاط"],
    },
  },
  {
    slug: "marketing-monthly",
    program: "marketing",
    plan: "monthly",
    durationDays: 30,
    name: {
      en: "Marketing Platform - Monthly",
      ar: "منصة التسويق - شهري",
    },
    description: {
      en: "Marketing platform subscription (monthly).",
      ar: "اشتراك منصة التسويق (شهري).",
    },
    price: { amount: 15, currency: "OMR", interval: "month" },
    features: {
      en: ["Messaging tools", "Templates", "Basic automations"],
      ar: ["أدوات الرسائل", "قوالب", "أتمتة أساسية"],
    },
  },
  {
    slug: "marketing-6mo",
    program: "marketing",
    plan: "6mo",
    durationDays: 180,
    name: {
      en: "Marketing Platform - 6 months",
      ar: "منصة التسويق - 6 أشهر",
    },
    description: {
      en: "Marketing platform subscription (6 months).",
      ar: "اشتراك منصة التسويق (6 أشهر).",
    },
    price: { amount: 60, currency: "OMR", interval: "6mo" },
    badges: ["Save"],
    features: {
      en: ["Messaging tools", "Templates", "Basic automations"],
      ar: ["أدوات الرسائل", "قوالب", "أتمتة أساسية"],
    },
  },
  {
    slug: "marketing-yearly",
    program: "marketing",
    plan: "yearly",
    durationDays: 365,
    name: {
      en: "Marketing Platform - Yearly",
      ar: "منصة التسويق - سنوي",
    },
    description: {
      en: "Marketing platform subscription (annual).",
      ar: "اشتراك منصة التسويق (سنوي).",
    },
    price: { amount: 90, currency: "OMR", interval: "year" },
    features: {
      en: ["Messaging tools", "Templates", "Basic automations"],
      ar: ["أدوات الرسائل", "قوالب", "أتمتة أساسية"],
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
        : price.interval === "6mo"
          ? " / 6 أشهر"
          : " / سنة"
      : price.interval === "month"
        ? " / mo"
        : price.interval === "6mo"
          ? " / 6 mo"
          : " / yr";

  return base + suffix;
}
