import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { Business, Locale, LocalizedString } from "./types";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const localizedStringSchema = z.object({
  en: z.string().trim().min(1),
  ar: z.string().trim().min(1),
});

export const businessInputSchema = z.object({
  slug: slugSchema,
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  category: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  website: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
});

export type BusinessInput = z.infer<typeof businessInputSchema>;

export function getBusinessById(id: string): Business | null {
  const { businesses } = getLmdb();
  return (businesses.get(id) as Business | undefined) ?? null;
}

export function getBusinessBySlug(slug: string): Business | null {
  const { businesses, businessSlugs } = getLmdb();
  const key = slugSchema.safeParse(slug);
  if (!key.success) return null;

  const id = (businessSlugs.get(key.data) as string | undefined) ?? null;
  if (!id) return null;
  return (businesses.get(id) as Business | undefined) ?? null;
}

export function listBusinesses(input?: {
  q?: string;
  locale?: Locale;
}): Business[] {
  const { businesses } = getLmdb();

  const qRaw = input?.q?.trim();
  const q = qRaw ? qRaw.toLowerCase() : null;
  const locale = input?.locale;

  const results: Business[] = [];
  for (const { value } of businesses.getRange()) {
    const b = value as Business;

    if (q) {
      const hay = [
        locale ? b.name[locale] : `${b.name.en} ${b.name.ar}`,
        b.category,
        b.city,
        b.tags?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!hay.includes(q)) continue;
    }

    results.push(b);
  }

  results.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return results;
}

export function createBusiness(input: BusinessInput): Business {
  const data = businessInputSchema.parse(input);
  const { businesses, businessSlugs } = getLmdb();

  const existingId = businessSlugs.get(data.slug) as string | undefined;
  if (existingId) {
    throw new Error("SLUG_TAKEN");
  }

  const now = new Date().toISOString();

  const business: Business = {
    id: nanoid(),
    slug: data.slug,
    name: data.name as LocalizedString,
    description: data.description as LocalizedString | undefined,
    category: data.category,
    city: data.city,
    address: data.address,
    phone: data.phone,
    website: data.website,
    email: data.email,
    tags: data.tags,
    createdAt: now,
    updatedAt: now,
  };

  businesses.put(business.id, business);
  businessSlugs.put(business.slug, business.id);

  return business;
}

export function updateBusiness(id: string, patch: Partial<BusinessInput>): Business {
  const { businesses, businessSlugs } = getLmdb();
  const current = businesses.get(id) as Business | undefined;
  if (!current) throw new Error("NOT_FOUND");

  const nextSlug = patch.slug ? slugSchema.parse(patch.slug) : current.slug;
  if (nextSlug !== current.slug) {
    const existing = businessSlugs.get(nextSlug) as string | undefined;
    if (existing && existing !== id) throw new Error("SLUG_TAKEN");
  }

  const next: Business = {
    ...current,
    ...patch,
    slug: nextSlug,
    updatedAt: new Date().toISOString(),
  };

  businesses.put(id, next);

  if (nextSlug !== current.slug) {
    businessSlugs.remove(current.slug);
    businessSlugs.put(nextSlug, id);
  }

  return next;
}

export function deleteBusiness(id: string) {
  const { businesses, businessSlugs } = getLmdb();
  const current = businesses.get(id) as Business | undefined;
  if (!current) return;

  businesses.remove(id);
  businessSlugs.remove(current.slug);
}
