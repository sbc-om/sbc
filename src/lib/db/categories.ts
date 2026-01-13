import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { Category, Locale, LocalizedString } from "./types";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const localizedStringSchema = z.object({
  en: z.string().trim().min(1),
  ar: z.string().trim().min(1),
});

export const categoryInputSchema = z.object({
  slug: slugSchema,
  name: localizedStringSchema,
  iconId: z.string().trim().min(1).optional(),
  parentId: z.string().trim().min(1).optional(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export function getCategoryById(id: string): Category | null {
  const { categories } = getLmdb();
  return (categories.get(id) as Category | undefined) ?? null;
}

export function getCategoryBySlug(slug: string): Category | null {
  const { categorySlugs } = getLmdb();
  const key = slugSchema.safeParse(slug);
  if (!key.success) return null;

  const id = (categorySlugs.get(key.data) as string | undefined) ?? null;
  if (!id) return null;
  return getCategoryById(id);
}

export function listCategories(input?: { locale?: Locale; q?: string }): Category[] {
  const { categories } = getLmdb();

  const qRaw = input?.q?.trim();
  const q = qRaw ? qRaw.toLowerCase() : null;
  const locale = input?.locale;

  const results: Category[] = [];
  for (const { value } of categories.getRange()) {
    const c = value as Category;

    if (q) {
      const hay = [
        locale ? c.name[locale] : `${c.name.en} ${c.name.ar}`,
        c.slug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) continue;
    }

    results.push(c);
  }

  results.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return results;
}

export function createCategory(input: CategoryInput): Category {
  const data = categoryInputSchema.parse(input);
  const { categories, categorySlugs } = getLmdb();

  const existingId = categorySlugs.get(data.slug) as string | undefined;
  if (existingId) throw new Error("SLUG_TAKEN");

  const now = new Date().toISOString();

  const category: Category = {
    id: nanoid(),
    slug: data.slug,
    name: data.name as LocalizedString,
    iconId: data.iconId,
    parentId: data.parentId,
    createdAt: now,
    updatedAt: now,
  };

  categories.put(category.id, category);
  categorySlugs.put(category.slug, category.id);

  return category;
}

export function updateCategory(id: string, patch: Partial<CategoryInput>): Category {
  const { categories, categorySlugs } = getLmdb();
  const current = categories.get(id) as Category | undefined;
  if (!current) throw new Error("NOT_FOUND");

  const nextSlug = patch.slug ? slugSchema.parse(patch.slug) : current.slug;
  if (nextSlug !== current.slug) {
    const existing = categorySlugs.get(nextSlug) as string | undefined;
    if (existing && existing !== id) throw new Error("SLUG_TAKEN");
  }

  const next: Category = {
    ...current,
    ...patch,
    slug: nextSlug,
    name: (patch.name ?? current.name) as LocalizedString,
    iconId: patch.iconId ?? current.iconId,
    parentId: patch.parentId ?? current.parentId,
    updatedAt: new Date().toISOString(),
  };

  categories.put(id, next);

  if (nextSlug !== current.slug) {
    categorySlugs.remove(current.slug);
    categorySlugs.put(nextSlug, id);
  }

  return next;
}

export function deleteCategory(id: string) {
  const { categories, categorySlugs, businesses } = getLmdb();
  const current = categories.get(id) as Category | undefined;
  if (!current) return;

  // Professional behavior: don't allow deleting a category that is in use.
  for (const { value } of businesses.getRange()) {
    const b = value as { categoryId?: string };
    if (b.categoryId === id) throw new Error("CATEGORY_IN_USE");
  }

  categories.remove(id);
  categorySlugs.remove(current.slug);
}

export function updateCategoryImage(id: string, image: string | undefined): Category {
  const { categories } = getLmdb();
  const current = categories.get(id) as Category | undefined;
  if (!current) throw new Error("NOT_FOUND");

  const next: Category = {
    ...current,
    image: image || undefined,
    updatedAt: new Date().toISOString(),
  };

  categories.put(id, next);
  return next;
}
