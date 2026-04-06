import type { Product } from "@/lib/db/products";
import type { StoreProduct, StoreProgramId } from "@/lib/store/types";

const STORE_PROGRAMS: StoreProgramId[] = [
  "directory",
  "loyalty",
  "marketing",
  "crm",
  "accounting",
  "online-classes",
  "sbcclaw",
  "website",
  "email",
  "agent-builder",
];

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeLocalizedFeatures(features: unknown): { en: string[]; ar: string[] } {
  if (Array.isArray(features)) {
    const items = asStringArray(features);
    return { en: items, ar: items };
  }

  if (features && typeof features === "object") {
    const raw = features as { en?: unknown; ar?: unknown };
    const en = asStringArray(raw.en);
    const ar = asStringArray(raw.ar);
    if (en.length || ar.length) {
      return {
        en: en.length ? en : ar,
        ar: ar.length ? ar : en,
      };
    }
  }

  return { en: [], ar: [] };
}

export function toStoreAdminProduct(product: Product): StoreProduct {
  const program = STORE_PROGRAMS.includes(product.program as StoreProgramId)
    ? (product.program as StoreProgramId)
    : "directory";

  return {
    id: product.id,
    slug: product.slug,
    program,
    plan: product.plan,
    durationDays: product.durationDays ?? 365,
    name: product.name,
    description: product.description ?? { en: "", ar: "" },
    price: {
      amount: Number(product.price) || 0,
      currency: "OMR",
    },
    badges: asStringArray(product.badges),
    features: normalizeLocalizedFeatures(product.features),
    isActive: product.isActive,
    showInDashboard: product.showInDashboard,
    showInStore: product.showInStore,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
