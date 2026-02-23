/**
 * Store product types (safe for client components)
 */

export type StoreProductPrice = {
  /** numeric amount, for formatting */
  amount: number;
  /** ISO currency code */
  currency: "OMR";
  /** If set, displayed as recurring */
  interval?: "month" | "year" | "6mo";
};

export type StoreProgramId = "directory" | "loyalty" | "marketing" | "website" | "email" | "agent-builder";

export type StoreProduct = {
  id: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
