import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { LocalizedString } from "./types";

export type StoreProductPrice = {
  amount: number;
  currency: "USD" | "OMR";
  interval?: "month" | "year" | "6mo";
};

export type StoreProgramId = "directory" | "loyalty" | "marketing";

export type StoreProduct = {
  id: string;
  slug: string;
  program: StoreProgramId;
  plan: string;
  durationDays: number;
  name: LocalizedString;
  description: LocalizedString;
  price: StoreProductPrice;
  badges?: string[];
  features: { en: string[]; ar: string[] };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const priceSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "OMR"]),
  interval: z.enum(["month", "year", "6mo"]).optional(),
});

const featuresSchema = z.object({
  en: z.array(z.string().trim().min(1)),
  ar: z.array(z.string().trim().min(1)),
});

const localizedStringSchema = z.object({
  en: z.string().trim().min(1),
  ar: z.string().trim().min(1),
});

export const productInputSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
  program: z.enum(["directory", "loyalty", "marketing"]),
  plan: z.string().trim().min(1),
  durationDays: z.number().int().positive(),
  name: localizedStringSchema,
  description: localizedStringSchema,
  price: priceSchema,
  badges: z.array(z.string().trim()).optional(),
  features: featuresSchema,
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export function createProduct(input: ProductInput): StoreProduct {
  const data = productInputSchema.parse(input);
  const { products, productSlugs } = getLmdb();

  // Check if slug already exists
  const existingId = productSlugs.get(data.slug) as string | undefined;
  if (existingId) {
    throw new Error("SLUG_TAKEN");
  }

  const product: StoreProduct = {
    id: nanoid(),
    slug: data.slug,
    program: data.program,
    plan: data.plan,
    durationDays: data.durationDays,
    name: data.name,
    description: data.description,
    price: data.price,
    badges: data.badges,
    features: data.features,
    isActive: data.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.put(product.id, product);
  productSlugs.put(product.slug, product.id);

  return product;
}

export function getProductById(id: string): StoreProduct | null {
  const { products } = getLmdb();
  return (products.get(id) as StoreProduct | undefined) ?? null;
}

export function getProductBySlug(slug: string): StoreProduct | null {
  const { productSlugs } = getLmdb();
  const id = productSlugs.get(slug) as string | undefined;
  if (!id) return null;
  return getProductById(id);
}

export function listProducts(options?: { activeOnly?: boolean }): StoreProduct[] {
  const { products } = getLmdb();
  const results: StoreProduct[] = [];

  for (const { value } of products.getRange()) {
    const p = value as StoreProduct;
    if (options?.activeOnly && !p.isActive) continue;
    results.push(p);
  }

  results.sort((a, b) => {
    // Sort by program, then by price
    if (a.program !== b.program) {
      return a.program.localeCompare(b.program);
    }
    return a.price.amount - b.price.amount;
  });

  return results;
}

export function updateProduct(id: string, input: Partial<ProductInput>): StoreProduct {
  const { products, productSlugs } = getLmdb();
  const current = products.get(id) as StoreProduct | undefined;
  if (!current) throw new Error("NOT_FOUND");

  // If slug is changing, check availability and update index
  if (input.slug && input.slug !== current.slug) {
    const existingId = productSlugs.get(input.slug) as string | undefined;
    if (existingId && existingId !== id) {
      throw new Error("SLUG_TAKEN");
    }
    productSlugs.remove(current.slug);
    productSlugs.put(input.slug, id);
  }

  const updated: StoreProduct = {
    ...current,
    ...input,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  products.put(id, updated);
  return updated;
}

export function deleteProduct(id: string): void {
  const { products, productSlugs } = getLmdb();
  const current = products.get(id) as StoreProduct | undefined;
  if (!current) throw new Error("NOT_FOUND");

  productSlugs.remove(current.slug);
  products.remove(id);
}

export function toggleProductStatus(id: string): StoreProduct {
  const { products } = getLmdb();
  const current = products.get(id) as StoreProduct | undefined;
  if (!current) throw new Error("NOT_FOUND");

  const updated: StoreProduct = {
    ...current,
    isActive: !current.isActive,
    updatedAt: new Date().toISOString(),
  };

  products.put(id, updated);
  return updated;
}
