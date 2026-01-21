import { nanoid } from "nanoid";
import { z } from "zod";

import { getLmdb } from "./lmdb";
import type { Business, Locale, LocalizedString } from "./types";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(30)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid username");

const localizedStringSchema = z.object({
  en: z.string().trim().min(1),
  ar: z.string().trim().min(1),
});

export const businessInputSchema = z.object({
  slug: slugSchema,
  username: usernameSchema.optional(),
  ownerId: z.string().trim().min(1).optional(),
  name: localizedStringSchema,
  description: localizedStringSchema.optional(),
  isVerified: z.boolean().optional(),
  isSpecial: z.boolean().optional(),
  homepageFeatured: z.boolean().optional(),
  homepageTop: z.boolean().optional(),
  // Legacy free-text category (kept for backward compatibility + search)
  category: z.string().trim().min(1).optional(),
  // Preferred: managed category reference
  categoryId: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  website: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  avatarMode: z.enum(["icon", "logo"]).optional(),
});

export type BusinessInput = z.infer<typeof businessInputSchema>;

export type BusinessMediaKind = "cover" | "logo" | "banner" | "gallery" | "video";

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

export function getBusinessByUsername(username: string): Business | null {
  const normalized = username.trim().replace(/^@/, "").toLowerCase();
  const key = usernameSchema.safeParse(normalized);
  if (!key.success) return null;

  const { businesses, businessUsernames } = getLmdb();
  const id = (businessUsernames.get(key.data) as string | undefined) ?? null;
  if (id) return (businesses.get(id) as Business | undefined) ?? null;

  return getBusinessBySlug(key.data);
}

export function normalizeBusinessUsername(input: string): string | null {
  const normalized = input.trim().replace(/^@/, "").toLowerCase();
  const key = usernameSchema.safeParse(normalized);
  return key.success ? key.data : null;
}

export function checkBusinessUsernameAvailability(
  input: string,
  options?: { excludeBusinessId?: string }
): { available: boolean; normalized?: string; reason?: "INVALID" | "TAKEN" } {
  const normalized = normalizeBusinessUsername(input);
  if (!normalized) {
    return { available: false, reason: "INVALID" };
  }

  const { businessUsernames, businessSlugs } = getLmdb();
  const excludeId = options?.excludeBusinessId;

  const usernameOwnerId = businessUsernames.get(normalized) as string | undefined;
  if (usernameOwnerId && usernameOwnerId !== excludeId) {
    return { available: false, normalized, reason: "TAKEN" };
  }

  const slugOwnerId = businessSlugs.get(normalized) as string | undefined;
  if (slugOwnerId && slugOwnerId !== excludeId) {
    return { available: false, normalized, reason: "TAKEN" };
  }

  return { available: true, normalized };
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
        b.username,
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

export function listBusinessesByOwner(userId: string): Business[] {
  const { businesses } = getLmdb();
  const uid = z.string().trim().min(1).safeParse(userId);
  if (!uid.success) return [];

  const results: Business[] = [];
  for (const { value } of businesses.getRange()) {
    const b = value as Business;
    if (b.ownerId !== uid.data) continue;
    results.push(b);
  }

  results.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return results;
}

export function createBusiness(input: BusinessInput): Business {
  const data = businessInputSchema.parse(input);
  const { businesses, businessSlugs, businessUsernames } = getLmdb();

  const existingId = businessSlugs.get(data.slug) as string | undefined;
  if (existingId) {
    throw new Error("SLUG_TAKEN");
  }

  if (data.username) {
    const availability = checkBusinessUsernameAvailability(data.username);
    if (!availability.available) throw new Error("USERNAME_TAKEN");
  }

  const now = new Date().toISOString();

  const business: Business = {
    id: nanoid(),
    slug: data.slug,
    username: data.username,
    ownerId: data.ownerId,
    name: data.name as LocalizedString,
    description: data.description as LocalizedString | undefined,
    isVerified: data.isVerified ?? false,
    isSpecial: data.isSpecial ?? false,
    homepageFeatured: data.homepageFeatured ?? false,
    homepageTop: data.homepageTop ?? false,
    category: data.category,
    categoryId: data.categoryId,
    city: data.city,
    address: data.address,
    phone: data.phone,
    website: data.website,
    email: data.email,
    tags: data.tags,
    latitude: data.latitude,
    longitude: data.longitude,
    avatarMode: data.avatarMode ?? "icon",
    createdAt: now,
    updatedAt: now,
  };

  businesses.put(business.id, business);
  businessSlugs.put(business.slug, business.id);
  if (business.username) {
    businessUsernames.put(business.username, business.id);
  }

  return business;
}

export function updateBusiness(id: string, patch: Partial<BusinessInput>): Business {
  const { businesses, businessSlugs, businessUsernames } = getLmdb();
  const current = businesses.get(id) as Business | undefined;
  if (!current) throw new Error("NOT_FOUND");

  const nextSlug = patch.slug ? slugSchema.parse(patch.slug) : current.slug;
  if (nextSlug !== current.slug) {
    const existing = businessSlugs.get(nextSlug) as string | undefined;
    if (existing && existing !== id) throw new Error("SLUG_TAKEN");
  }

  const nextUsername =
    typeof patch.username === "string"
      ? patch.username
        ? usernameSchema.parse(patch.username)
        : undefined
      : current.username;

  if (nextUsername && nextUsername !== current.username) {
    const availability = checkBusinessUsernameAvailability(nextUsername, {
      excludeBusinessId: id,
    });
    if (!availability.available) throw new Error("USERNAME_TAKEN");
  }

  const next: Business = {
    ...current,
    ...patch,
    slug: nextSlug,
    username: nextUsername,
    avatarMode: patch.avatarMode ?? current.avatarMode ?? "icon",
    updatedAt: new Date().toISOString(),
  };

  businesses.put(id, next);

  if (nextSlug !== current.slug) {
    businessSlugs.remove(current.slug);
    businessSlugs.put(nextSlug, id);
  }

  if (nextUsername !== current.username) {
    if (current.username) {
      businessUsernames.remove(current.username);
    }
    if (nextUsername) {
      businessUsernames.put(nextUsername, id);
    }
  }

  return next;
}

export function deleteBusiness(id: string) {
  const { businesses, businessSlugs, businessUsernames } = getLmdb();
  const current = businesses.get(id) as Business | undefined;
  if (!current) return;

  businesses.remove(id);
  businessSlugs.remove(current.slug);
  if (current.username) {
    businessUsernames.remove(current.username);
  }
}

function ensureBusiness(id: string) {
  const { businesses } = getLmdb();
  const current = businesses.get(id) as Business | undefined;
  if (!current) throw new Error("NOT_FOUND");
  return current;
}

export function setBusinessSingleMedia(
  id: string,
  kind: Extract<BusinessMediaKind, "cover" | "logo" | "banner">,
  url: string | null,
): Business {
  const { businesses } = getLmdb();
  const current = ensureBusiness(id);

  const next: Business = {
    ...current,
    media: {
      ...current.media,
      [kind]: url ?? undefined,
    },
    updatedAt: new Date().toISOString(),
  };

  businesses.put(id, next);
  return next;
}

export function setBusinessLogo(id: string, url: string | null): Business {
  // Backward compatibility
  return setBusinessSingleMedia(id, "logo", url);
}

export function addBusinessMedia(
  id: string,
  kind: Extract<BusinessMediaKind, "gallery" | "video">,
  urls: string[],
): Business {
  const { businesses } = getLmdb();
  const current = ensureBusiness(id);

  const existing = kind === "gallery"
    ? current.media?.gallery ?? []
    : current.media?.videos ?? [];

  const merged = Array.from(new Set([...existing, ...urls]));

  const next: Business = {
    ...current,
    media: {
      ...current.media,
      ...(kind === "gallery" ? { gallery: merged } : { videos: merged }),
    },
    updatedAt: new Date().toISOString(),
  };

  businesses.put(id, next);
  return next;
}

export function removeBusinessMedia(
  id: string,
  kind: BusinessMediaKind,
  url: string,
): Business {
  const { businesses } = getLmdb();
  const current = ensureBusiness(id);

  let nextMedia = current.media ?? {};

  if (kind === "cover") {
    if (nextMedia.cover === url) nextMedia = { ...nextMedia, cover: undefined };
  } else if (kind === "logo") {
    if (nextMedia.logo === url) nextMedia = { ...nextMedia, logo: undefined };
  } else if (kind === "banner") {
    if (nextMedia.banner === url) nextMedia = { ...nextMedia, banner: undefined };
  } else if (kind === "gallery") {
    nextMedia = {
      ...nextMedia,
      gallery: (nextMedia.gallery ?? []).filter((u) => u !== url),
    };
  } else {
    nextMedia = {
      ...nextMedia,
      videos: (nextMedia.videos ?? []).filter((u) => u !== url),
    };
  }

  const next: Business = {
    ...current,
    media: nextMedia,
    updatedAt: new Date().toISOString(),
  };

  businesses.put(id, next);
  return next;
}
