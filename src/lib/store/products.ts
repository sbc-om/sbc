/**
 * Server-side store products API
 * This file imports from the database and should only be used in server components
 */

import {
  listProducts as listProductsFromDb,
  getProductBySlug as getProductBySlugFromDb,
} from "@/lib/db/products";

// Re-export types (safe for client components)
export type { StoreProduct, StoreProductPrice, StoreProgramId } from "./types";

// Re-export utility functions (safe for client components)
export { formatStorePrice, getStoreProductText } from "./utils";

/**
 * List all active products from database
 * SERVER-SIDE ONLY - Do not use in client components
 */
export function listStoreProducts() {
  return listProductsFromDb({ activeOnly: true });
}

/**
 * Get a product by slug from database
 * SERVER-SIDE ONLY - Do not use in client components
 */
export function getStoreProductBySlug(slug: string) {
  const product = getProductBySlugFromDb(slug);
  // Only return active products
  if (product && !product.isActive) return null;
  return product;
}
