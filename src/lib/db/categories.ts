import { nanoid } from "nanoid";
import { z } from "zod";

import { query, transaction } from "./postgres";
import type { Category, LocalizedString } from "./types";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const localizedStringSchema = z.object({
  en: z.string().trim().min(1),
  ar: z.string().trim().min(1),
});

type CategoryRow = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  image: string | null;
  icon_id: string | null;
  parent_id: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type CategoryWithCountRow = CategoryRow & {
  business_count: number;
};

function rowToCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    slug: r.slug,
    name: { en: r.name_en, ar: r.name_ar },
    image: r.image ?? undefined,
    iconId: r.icon_id ?? undefined,
    parentId: r.parent_id ?? undefined,
    createdAt: r.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: r.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const result = await query<CategoryRow>(`SELECT * FROM categories WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToCategory(result.rows[0]) : null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const key = slugSchema.safeParse(slug);
  if (!key.success) return null;

  const result = await query<CategoryRow>(`SELECT * FROM categories WHERE slug = $1`, [key.data]);
  return result.rows.length > 0 ? rowToCategory(result.rows[0]) : null;
}

export async function listCategories(): Promise<Category[]> {
  const result = await query<CategoryRow>(`SELECT * FROM categories ORDER BY name_en`);
  return result.rows.map(rowToCategory);
}

export async function listRootCategories(): Promise<Category[]> {
  const result = await query<CategoryRow>(`SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name_en`);
  return result.rows.map(rowToCategory);
}

export async function listChildCategories(parentId: string): Promise<Category[]> {
  const result = await query<CategoryRow>(`SELECT * FROM categories WHERE parent_id = $1 ORDER BY name_en`, [parentId]);
  return result.rows.map(rowToCategory);
}

export async function createCategory(input: {
  slug: string;
  name: LocalizedString;
  image?: string;
  iconId?: string;
  parentId?: string;
}): Promise<Category> {
  const slug = slugSchema.parse(input.slug);
  const name = localizedStringSchema.parse(input.name);
  const id = nanoid();
  const now = new Date();

  // Check slug uniqueness
  const existingSlug = await query(`SELECT id FROM categories WHERE slug = $1`, [slug]);
  if (existingSlug.rows.length > 0) {
    throw new Error("SLUG_TAKEN");
  }

  const result = await query<CategoryRow>(`
    INSERT INTO categories (id, slug, name_en, name_ar, image, icon_id, parent_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
    RETURNING *
  `, [id, slug, name.en, name.ar, input.image, input.iconId, input.parentId, now]);

  return rowToCategory(result.rows[0]);
}

export async function updateCategory(
  id: string,
  input: {
    slug?: string;
    name?: LocalizedString;
    image?: string | null;
    iconId?: string | null;
    parentId?: string | null;
  }
): Promise<Category> {
  return transaction(async (client) => {
    const currentRes = await client.query(`SELECT * FROM categories WHERE id = $1 FOR UPDATE`, [id]);
    if (currentRes.rows.length === 0) throw new Error("NOT_FOUND");
    const current = rowToCategory(currentRes.rows[0]);

    const slug = input.slug ? slugSchema.parse(input.slug) : current.slug;
    const name = input.name ? localizedStringSchema.parse(input.name) : current.name;

    // Check slug uniqueness if changed
    if (slug !== current.slug) {
      const existingSlug = await client.query(`SELECT id FROM categories WHERE slug = $1 AND id != $2`, [slug, id]);
      if (existingSlug.rows.length > 0) {
        throw new Error("SLUG_TAKEN");
      }
    }

    const result = await client.query(`
      UPDATE categories SET
        slug = $1,
        name_en = $2,
        name_ar = $3,
        image = $4,
        icon_id = $5,
        parent_id = $6,
        updated_at = $7
      WHERE id = $8
      RETURNING *
    `, [
      slug,
      name.en,
      name.ar,
      input.image !== undefined ? input.image : current.image,
      input.iconId !== undefined ? input.iconId : current.iconId,
      input.parentId !== undefined ? input.parentId : current.parentId,
      new Date(),
      id
    ]);

    return rowToCategory(result.rows[0]);
  });
}

export async function deleteCategory(id: string): Promise<boolean> {
  // Check if there are businesses using this category
  const businessCount = await query(`SELECT COUNT(*) FROM businesses WHERE category_id = $1`, [id]);
  if (parseInt(businessCount.rows[0].count) > 0) {
    throw new Error("CATEGORY_HAS_BUSINESSES");
  }

  // Check if there are child categories
  const childCount = await query(`SELECT COUNT(*) FROM categories WHERE parent_id = $1`, [id]);
  if (parseInt(childCount.rows[0].count) > 0) {
    throw new Error("CATEGORY_HAS_CHILDREN");
  }

  const result = await query(`DELETE FROM categories WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function countBusinessesInCategory(categoryId: string): Promise<number> {
  const result = await query(`SELECT COUNT(*) FROM businesses WHERE category_id = $1 AND is_approved = true`, [categoryId]);
  return parseInt(result.rows[0].count);
}

export async function getCategoriesWithCount(): Promise<(Category & { businessCount: number })[]> {
  const result = await query<CategoryWithCountRow>(`
    SELECT c.*, COALESCE(bc.count, 0)::int as business_count
    FROM categories c
    LEFT JOIN (
      SELECT category_id, COUNT(*) as count
      FROM businesses
      WHERE is_approved = true
      GROUP BY category_id
    ) bc ON c.id = bc.category_id
    ORDER BY c.name_en
  `);

  return result.rows.map((r) => ({
    ...rowToCategory(r),
    businessCount: r.business_count,
  }));
}
