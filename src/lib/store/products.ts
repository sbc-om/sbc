/**
 * Server-side store products API
 * This file imports from the database and should only be used in server components
 */

import {
  listActiveProducts as listProductsFromDb,
  getProductBySlug as getProductBySlugFromDb,
  type Product,
} from "@/lib/db/products";
import type { StoreProduct, StoreProgramId } from "./types";

// Re-export types (safe for client components)
export type { StoreProduct, StoreProductPrice, StoreProgramId } from "./types";

// Re-export utility functions (safe for client components)
export { formatStorePrice, getStoreProductText } from "./utils";

/**
 * Convert a database Product to a StoreProduct
 */
function toStoreProduct(product: Product): StoreProduct {
  return {
    id: product.id,
    slug: product.slug,
    program: product.program as StoreProgramId,
    plan: product.plan,
    durationDays: product.durationDays ?? 365,
    name: product.name,
    description: product.description ?? { en: "", ar: "" },
    price: {
      amount: product.price,
      currency: "OMR",
    },
    badges: product.badges,
    features: {
      en: product.features,
      ar: product.features,
    },
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

/**
 * List all active products from database
 * SERVER-SIDE ONLY - Do not use in client components
 */
export async function listStoreProducts(): Promise<StoreProduct[]> {
  const products = await listProductsFromDb();
  return products.map(toStoreProduct);
}

/**
 * Get a product by slug from database
 * SERVER-SIDE ONLY - Do not use in client components
 */
export async function getStoreProductBySlug(slug: string): Promise<StoreProduct | null> {
  const product = await getProductBySlugFromDb(slug);
  // Only return active products
  if (!product || !product.isActive) return null;
  return toStoreProduct(product);
}
