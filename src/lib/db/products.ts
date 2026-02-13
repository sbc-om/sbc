import { nanoid } from "nanoid";
import { z } from "zod";

import { query } from "./postgres";
import type { LocalizedString } from "./types";

export type Product = {
  id: string;
  slug: string;
  name: LocalizedString;
  description?: LocalizedString;
  price: number;
  currency: string;
  program: string;
  /** Plan id within the program (e.g., 'basic', 'premium') */
  plan: string;
  durationDays?: number;
  features: string[];
  badges?: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const localizedStringSchema = z.object({
  en: z.string().trim().min(1),
  ar: z.string().trim().min(1),
});

const productSchema = z.object({
  slug: slugSchema,
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  price: z.number().min(0),
  currency: z.string().default("OMR"),
  program: z.string().min(1),
  plan: z.string().default("basic"),
  durationDays: z.number().int().positive().optional(),
  features: z.array(z.string()).default([]),
  badges: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type ProductInput = z.infer<typeof productSchema>;

type ProductRow = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  price: string | number | null;
  currency: string | null;
  program: string;
  plan: string | null;
  duration_days: number | null;
  features: string[] | null;
  badges: string[] | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: { en: row.name_en, ar: row.name_ar },
    description: row.description_en || row.description_ar
      ? { en: row.description_en || "", ar: row.description_ar || "" }
      : undefined,
    price: parseFloat(String(row.price ?? "0")) || 0,
    currency: row.currency || "OMR",
    program: row.program,
    plan: row.plan || "basic",
    durationDays: row.duration_days,
    features: row.features || [],
    badges: row.badges || [],
    isActive: row.is_active ?? true,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const data = productSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  // Check slug uniqueness
  const existingSlug = await query(`SELECT id FROM products WHERE slug = $1`, [data.slug]);
  if (existingSlug.rows.length > 0) {
    throw new Error("SLUG_TAKEN");
  }

  const result = await query(`
    INSERT INTO products (
      id, slug, name_en, name_ar, description_en, description_ar, price, currency,
      program, plan, duration_days, features, badges, is_active, sort_order, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
    RETURNING *
  `, [
    id, data.slug, data.name.en, data.name.ar,
    data.description?.en, data.description?.ar,
    data.price, data.currency, data.program, data.plan, data.durationDays,
    JSON.stringify(data.features), JSON.stringify(data.badges), data.isActive, data.sortOrder, now
  ]);

  return rowToProduct(result.rows[0]);
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await query(`SELECT * FROM products WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToProduct(result.rows[0]) : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const key = slugSchema.safeParse(slug);
  if (!key.success) return null;

  const result = await query(`SELECT * FROM products WHERE slug = $1`, [key.data]);
  return result.rows.length > 0 ? rowToProduct(result.rows[0]) : null;
}

export async function listProducts(): Promise<Product[]> {
  const result = await query(`SELECT * FROM products ORDER BY sort_order, name_en`);
  return result.rows.map(rowToProduct);
}

export async function listActiveProducts(): Promise<Product[]> {
  const result = await query(`SELECT * FROM products WHERE is_active = true ORDER BY sort_order, name_en`);
  return result.rows.map(rowToProduct);
}

export async function listProductsByProgram(program: string): Promise<Product[]> {
  const result = await query(`
    SELECT * FROM products WHERE program = $1 AND is_active = true ORDER BY sort_order, name_en
  `, [program]);
  return result.rows.map(rowToProduct);
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const currentRes = await query(`SELECT * FROM products WHERE id = $1`, [id]);
  if (currentRes.rows.length === 0) throw new Error("NOT_FOUND");
  const current = rowToProduct(currentRes.rows[0]);

  // Check slug uniqueness if changed
  if (input.slug && input.slug !== current.slug) {
    const existingSlug = await query(`SELECT id FROM products WHERE slug = $1 AND id != $2`, [input.slug, id]);
    if (existingSlug.rows.length > 0) {
      throw new Error("SLUG_TAKEN");
    }
  }

  const result = await query(`
    UPDATE products SET
      slug = COALESCE($1, slug),
      name_en = COALESCE($2, name_en),
      name_ar = COALESCE($3, name_ar),
      description_en = $4,
      description_ar = $5,
      price = COALESCE($6, price),
      currency = COALESCE($7, currency),
      program = COALESCE($8, program),
      duration_days = $9,
      features = COALESCE($10, features),
      is_active = COALESCE($11, is_active),
      sort_order = COALESCE($12, sort_order),
      updated_at = $13
    WHERE id = $14
    RETURNING *
  `, [
    input.slug,
    input.name?.en,
    input.name?.ar,
    input.description?.en !== undefined ? input.description.en : current.description?.en,
    input.description?.ar !== undefined ? input.description.ar : current.description?.ar,
    input.price,
    input.currency,
    input.program,
    input.durationDays !== undefined ? input.durationDays : current.durationDays,
    input.features ? JSON.stringify(input.features) : null,
    input.isActive,
    input.sortOrder,
    new Date(),
    id
  ]);

  return rowToProduct(result.rows[0]);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM products WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function setProductActive(id: string, isActive: boolean): Promise<Product> {
  const result = await query(`
    UPDATE products SET is_active = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [isActive, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToProduct(result.rows[0]);
}
