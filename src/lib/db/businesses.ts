import { nanoid } from "nanoid";
import { z } from "zod";

import { query, transaction } from "./postgres";
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
  isApproved: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isSpecial: z.boolean().optional(),
  homepageFeatured: z.boolean().optional(),
  homepageTop: z.boolean().optional(),
  category: z.string().trim().min(1).optional(),
  categoryId: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  website: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  customDomain: z.string().trim().toLowerCase().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  avatarMode: z.enum(["icon", "logo"]).optional(),
  showSimilarBusinesses: z.boolean().optional(),
});

export type BusinessInput = z.infer<typeof businessInputSchema>;

export type BusinessMediaKind = "cover" | "logo" | "banner" | "gallery" | "video";

function rowToBusiness(row: any): Business {
  return {
    id: row.id,
    slug: row.slug,
    username: row.username,
    ownerId: row.owner_id,
    name: { en: row.name_en, ar: row.name_ar },
    description: row.description_en || row.description_ar
      ? { en: row.description_en || "", ar: row.description_ar || "" }
      : undefined,
    isApproved: row.is_approved ?? false,
    isVerified: row.is_verified ?? false,
    isSpecial: row.is_special ?? false,
    homepageFeatured: row.homepage_featured ?? false,
    homepageTop: row.homepage_top ?? false,
    category: row.category,
    categoryId: row.category_id,
    city: row.city,
    address: row.address,
    phone: row.phone,
    website: row.website,
    email: row.email,
    tags: row.tags || [],
    customDomain: row.custom_domain,
    latitude: row.latitude,
    longitude: row.longitude,
    avatarMode: row.avatar_mode,
    showSimilarBusinesses: row.show_similar_businesses ?? true,
    media: row.media || {},
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const result = await query(`SELECT * FROM businesses WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToBusiness(result.rows[0]) : null;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const key = slugSchema.safeParse(slug);
  if (!key.success) return null;

  const result = await query(`SELECT * FROM businesses WHERE slug = $1`, [key.data]);
  return result.rows.length > 0 ? rowToBusiness(result.rows[0]) : null;
}

export async function getBusinessByUsername(username: string): Promise<Business | null> {
  const normalized = username.trim().replace(/^@/, "").toLowerCase();
  const key = usernameSchema.safeParse(normalized);
  if (!key.success) return null;

  // Try username first
  let result = await query(`SELECT * FROM businesses WHERE username = $1`, [key.data]);
  if (result.rows.length > 0) return rowToBusiness(result.rows[0]);

  // Fall back to slug
  result = await query(`SELECT * FROM businesses WHERE slug = $1`, [key.data]);
  return result.rows.length > 0 ? rowToBusiness(result.rows[0]) : null;
}

export async function getBusinessByOwnerId(ownerId: string): Promise<Business | null> {
  const result = await query(`SELECT * FROM businesses WHERE owner_id = $1 LIMIT 1`, [ownerId]);
  return result.rows.length > 0 ? rowToBusiness(result.rows[0]) : null;
}

/** Return a Set of user IDs that own at least one business */
export async function getOwnerIdsWithBusiness(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await query(
    `SELECT DISTINCT owner_id FROM businesses WHERE owner_id IN (${placeholders})`,
    userIds
  );
  return new Set(result.rows.map((r: any) => r.owner_id));
}

/**
 * Get a business by its custom domain.
 */
export async function getBusinessByDomain(domain: string): Promise<Business | null> {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return null;
  const result = await query(`SELECT * FROM businesses WHERE custom_domain = $1`, [normalized]);
  return result.rows.length > 0 ? rowToBusiness(result.rows[0]) : null;
}

/**
 * Check if a custom domain is available (not already used by another business).
 */
export async function checkDomainAvailability(
  domain: string,
  excludeBusinessId?: string
): Promise<{ available: boolean; reason?: "INVALID" | "TAKEN" }> {
  const normalized = domain.trim().toLowerCase();
  // Basic validation
  if (!normalized || !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(normalized)) {
    return { available: false, reason: "INVALID" };
  }
  
  const result = excludeBusinessId
    ? await query(
        `SELECT id FROM businesses WHERE custom_domain = $1 AND id != $2`,
        [normalized, excludeBusinessId]
      )
    : await query(`SELECT id FROM businesses WHERE custom_domain = $1`, [normalized]);
  
  if (result.rows.length > 0) {
    return { available: false, reason: "TAKEN" };
  }
  
  return { available: true };
}

/**
 * Returns a Set of user IDs that already own a business.
 * Optionally excludes a specific business (useful when editing an existing business).
 */
export async function getUserIdsWithBusiness(excludeBusinessId?: string): Promise<Set<string>> {
  const result = excludeBusinessId
    ? await query(
        `SELECT DISTINCT owner_id FROM businesses WHERE owner_id IS NOT NULL AND id != $1`,
        [excludeBusinessId]
      )
    : await query(`SELECT DISTINCT owner_id FROM businesses WHERE owner_id IS NOT NULL`);
  return new Set(result.rows.map((row: any) => row.owner_id));
}

export function normalizeBusinessUsername(input: string): string | null {
  const normalized = input.trim().replace(/^@/, "").toLowerCase();
  const key = usernameSchema.safeParse(normalized);
  return key.success ? key.data : null;
}

export async function checkBusinessUsernameAvailability(
  input: string,
  options?: { excludeBusinessId?: string }
): Promise<{ available: boolean; normalized?: string; reason?: "INVALID" | "TAKEN" }> {
  const normalized = normalizeBusinessUsername(input);
  if (!normalized) {
    return { available: false, reason: "INVALID" };
  }

  const excludeId = options?.excludeBusinessId;

  // Check business username
  let result = await query(
    excludeId
      ? `SELECT id FROM businesses WHERE username = $1 AND id != $2`
      : `SELECT id FROM businesses WHERE username = $1`,
    excludeId ? [normalized, excludeId] : [normalized]
  );
  if (result.rows.length > 0) {
    return { available: false, normalized, reason: "TAKEN" };
  }

  // Check business slug
  result = await query(
    excludeId
      ? `SELECT id FROM businesses WHERE slug = $1 AND id != $2`
      : `SELECT id FROM businesses WHERE slug = $1`,
    excludeId ? [normalized, excludeId] : [normalized]
  );
  if (result.rows.length > 0) {
    return { available: false, normalized, reason: "TAKEN" };
  }

  // Check user username (global uniqueness across system)
  result = await query(`SELECT id FROM users WHERE username = $1`, [normalized]);
  if (result.rows.length > 0) {
    return { available: false, normalized, reason: "TAKEN" };
  }

  return { available: true, normalized };
}

export async function listBusinesses(): Promise<Business[]> {
  const result = await query(`SELECT * FROM businesses ORDER BY created_at DESC`);
  return result.rows.map(rowToBusiness);
}

export type BusinessFilter = "all" | "pending" | "approved";

export interface ListBusinessesOptions {
  filter?: BusinessFilter;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listBusinessesPaginated(
  options: ListBusinessesOptions = {}
): Promise<Business[]> {
  const { filter = "all", search, limit = 20, offset = 0 } = options;
  
  let queryStr = `SELECT * FROM businesses WHERE 1=1`;
  const params: (string | number)[] = [];
  let paramIndex = 1;

  // Filter by approval status
  if (filter === "pending") {
    queryStr += ` AND (is_approved = false OR is_approved IS NULL)`;
  } else if (filter === "approved") {
    queryStr += ` AND is_approved = true`;
  }

  // Search
  if (search) {
    queryStr += ` AND (
      name_en ILIKE $${paramIndex} OR 
      name_ar ILIKE $${paramIndex} OR 
      username ILIKE $${paramIndex} OR 
      slug ILIKE $${paramIndex} OR 
      city ILIKE $${paramIndex} OR 
      phone ILIKE $${paramIndex} OR
      category ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await query(queryStr, params);
  return result.rows.map(rowToBusiness);
}

export async function countBusinesses(
  options: Omit<ListBusinessesOptions, "limit" | "offset"> = {}
): Promise<{ total: number; pending: number; approved: number }> {
  const { filter = "all", search } = options;
  
  let baseCondition = `WHERE 1=1`;
  const params: string[] = [];
  let paramIndex = 1;

  if (search) {
    baseCondition += ` AND (
      name_en ILIKE $${paramIndex} OR 
      name_ar ILIKE $${paramIndex} OR 
      username ILIKE $${paramIndex} OR 
      slug ILIKE $${paramIndex} OR 
      city ILIKE $${paramIndex} OR 
      phone ILIKE $${paramIndex} OR
      category ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
  }

  const result = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_approved = false OR is_approved IS NULL) as pending,
      COUNT(*) FILTER (WHERE is_approved = true) as approved
    FROM businesses ${baseCondition}
  `, params);

  return {
    total: parseInt(result.rows[0]?.total || "0", 10),
    pending: parseInt(result.rows[0]?.pending || "0", 10),
    approved: parseInt(result.rows[0]?.approved || "0", 10),
  };
}

export async function listApprovedBusinesses(): Promise<Business[]> {
  const result = await query(`SELECT * FROM businesses WHERE is_approved = true ORDER BY name_en`);
  return result.rows.map(rowToBusiness);
}

export async function createBusiness(input: BusinessInput): Promise<Business> {
  const data = businessInputSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  // Check slug uniqueness
  const existingSlug = await query(`SELECT id FROM businesses WHERE slug = $1`, [data.slug]);
  if (existingSlug.rows.length > 0) {
    throw new Error("SLUG_TAKEN");
  }

  // Check username uniqueness if provided
  if (data.username) {
    const existingUsername = await query(`SELECT id FROM businesses WHERE username = $1`, [data.username]);
    if (existingUsername.rows.length > 0) {
      throw new Error("USERNAME_TAKEN");
    }
  }

  const result = await query(`
    INSERT INTO businesses (
      id, slug, username, owner_id, name_en, name_ar, description_en, description_ar,
      is_approved, is_verified, is_special, homepage_featured, homepage_top,
      category, category_id, city, address, phone, website, email, tags,
      latitude, longitude, avatar_mode, show_similar_businesses, media, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $27
    ) RETURNING *
  `, [
    id, data.slug, data.username, data.ownerId,
    data.name.en, data.name.ar,
    data.description?.en, data.description?.ar,
    data.isApproved ?? false, data.isVerified ?? false, data.isSpecial ?? false,
    data.homepageFeatured ?? false, data.homepageTop ?? false,
    data.category, data.categoryId, data.city, data.address, data.phone, data.website, data.email,
    data.tags || [], data.latitude, data.longitude, data.avatarMode || 'icon',
    data.showSimilarBusinesses ?? true,
    JSON.stringify({}), now
  ]);

  return rowToBusiness(result.rows[0]);
}

export async function updateBusiness(id: string, input: Partial<BusinessInput>): Promise<Business> {
  return transaction(async (client) => {
    const currentRes = await client.query(`SELECT * FROM businesses WHERE id = $1 FOR UPDATE`, [id]);
    if (currentRes.rows.length === 0) throw new Error("NOT_FOUND");
    const current = rowToBusiness(currentRes.rows[0]);

    const data = businessInputSchema.partial().parse(input);

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== current.slug) {
      const existingSlug = await client.query(`SELECT id FROM businesses WHERE slug = $1 AND id != $2`, [data.slug, id]);
      if (existingSlug.rows.length > 0) {
        throw new Error("SLUG_TAKEN");
      }
    }

    // Check username uniqueness if changed
    if (data.username && data.username !== current.username) {
      const existingUsername = await client.query(`SELECT id FROM businesses WHERE username = $1 AND id != $2`, [data.username, id]);
      if (existingUsername.rows.length > 0) {
        throw new Error("USERNAME_TAKEN");
      }
    }

    const result = await client.query(`
      UPDATE businesses SET
        slug = COALESCE($1, slug),
        username = $2,
        owner_id = $3,
        name_en = COALESCE($4, name_en),
        name_ar = COALESCE($5, name_ar),
        description_en = $6,
        description_ar = $7,
        is_approved = COALESCE($8, is_approved),
        is_verified = COALESCE($9, is_verified),
        is_special = COALESCE($10, is_special),
        homepage_featured = COALESCE($11, homepage_featured),
        homepage_top = COALESCE($12, homepage_top),
        category = $13,
        category_id = $14,
        city = $15,
        address = $16,
        phone = $17,
        website = $18,
        email = $19,
        tags = COALESCE($20, tags),
        latitude = $21,
        longitude = $22,
        avatar_mode = COALESCE($23, avatar_mode),
        show_similar_businesses = COALESCE($24, show_similar_businesses),
        updated_at = $25
      WHERE id = $26
      RETURNING *
    `, [
      data.slug,
      data.username !== undefined ? data.username : current.username,
      data.ownerId !== undefined ? data.ownerId : current.ownerId,
      data.name?.en,
      data.name?.ar,
      data.description?.en !== undefined ? data.description.en : current.description?.en,
      data.description?.ar !== undefined ? data.description.ar : current.description?.ar,
      data.isApproved,
      data.isVerified,
      data.isSpecial,
      data.homepageFeatured,
      data.homepageTop,
      data.category !== undefined ? data.category : current.category,
      data.categoryId !== undefined ? data.categoryId : current.categoryId,
      data.city !== undefined ? data.city : current.city,
      data.address !== undefined ? data.address : current.address,
      data.phone !== undefined ? data.phone : current.phone,
      data.website !== undefined ? data.website : current.website,
      data.email !== undefined ? data.email : current.email,
      data.tags,
      data.latitude !== undefined ? data.latitude : current.latitude,
      data.longitude !== undefined ? data.longitude : current.longitude,
      data.avatarMode,
      data.showSimilarBusinesses,
      new Date(),
      id
    ]);

    return rowToBusiness(result.rows[0]);
  });
}

export async function deleteBusiness(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM businesses WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function setBusinessApproved(id: string, isApproved: boolean): Promise<Business> {
  const result = await query(`
    UPDATE businesses SET is_approved = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [isApproved, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessVerified(id: string, isVerified: boolean): Promise<Business> {
  const result = await query(`
    UPDATE businesses SET is_verified = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [isVerified, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessSpecial(id: string, isSpecial: boolean): Promise<Business> {
  const result = await query(`
    UPDATE businesses SET is_special = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [isSpecial, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessHomepageFeatured(id: string, homepageFeatured: boolean): Promise<Business> {
  const result = await query(`
    UPDATE businesses SET homepage_featured = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [homepageFeatured, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessHomepageTop(id: string, homepageTop: boolean): Promise<Business> {
  const result = await query(`
    UPDATE businesses SET homepage_top = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [homepageTop, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessCustomDomain(id: string, customDomain: string | null): Promise<Business> {
  const normalized = customDomain?.trim().toLowerCase() || null;
  
  // Check availability if setting a domain
  if (normalized) {
    const availability = await checkDomainAvailability(normalized, id);
    if (!availability.available) {
      throw new Error(availability.reason === "TAKEN" ? "DOMAIN_TAKEN" : "INVALID_DOMAIN");
    }
  }
  
  const result = await query(`
    UPDATE businesses SET custom_domain = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [normalized, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessMedia(
  id: string,
  kind: BusinessMediaKind,
  value: string | string[] | null
): Promise<Business> {
  return transaction(async (client) => {
    const currentRes = await client.query(`SELECT media FROM businesses WHERE id = $1 FOR UPDATE`, [id]);
    if (currentRes.rows.length === 0) throw new Error("NOT_FOUND");

    const media = currentRes.rows[0].media || {};

    if (kind === "gallery" || kind === "video") {
      if (Array.isArray(value)) {
        media[kind === "video" ? "videos" : "gallery"] = value;
      } else if (value === null) {
        delete media[kind === "video" ? "videos" : "gallery"];
      }
    } else {
      if (typeof value === "string") {
        media[kind] = value;
      } else if (value === null) {
        delete media[kind];
      }
    }

    const result = await client.query(`
      UPDATE businesses SET media = $1, updated_at = $2 WHERE id = $3 RETURNING *
    `, [JSON.stringify(media), new Date(), id]);

    return rowToBusiness(result.rows[0]);
  });
}

export async function listBusinessesByCategory(categoryId: string): Promise<Business[]> {
  const result = await query(`
    SELECT * FROM businesses WHERE category_id = $1 AND is_approved = true ORDER BY name_en
  `, [categoryId]);
  return result.rows.map(rowToBusiness);
}

export async function listBusinessesByOwner(ownerId: string): Promise<Business[]> {
  const result = await query(`SELECT * FROM businesses WHERE owner_id = $1 ORDER BY created_at DESC`, [ownerId]);
  return result.rows.map(rowToBusiness);
}

export async function getBusinessesByIds(ids: string[]): Promise<Business[]> {
  if (ids.length === 0) return [];
  const result = await query(`SELECT * FROM businesses WHERE id = ANY($1)`, [ids]);
  return result.rows.map(rowToBusiness);
}

export async function searchBusinesses(searchTerm: string, locale: Locale = "en"): Promise<Business[]> {
  const term = `%${searchTerm.toLowerCase()}%`;
  const result = await query(`
    SELECT * FROM businesses
    WHERE is_approved = true AND (
      LOWER(name_en) LIKE $1 OR
      LOWER(name_ar) LIKE $1 OR
      LOWER(category) LIKE $1 OR
      LOWER(city) LIKE $1 OR
      EXISTS (SELECT 1 FROM unnest(tags) tag WHERE LOWER(tag) LIKE $1)
    )
    ORDER BY name_${locale === "ar" ? "ar" : "en"}
    LIMIT 100
  `, [term]);
  return result.rows.map(rowToBusiness);
}
