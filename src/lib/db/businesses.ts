import { nanoid } from "nanoid";
import { z } from "zod";

import { query, transaction } from "./postgres";
import type { Business, Locale } from "./types";

let businessInstagramSchemaPromise: Promise<void> | null = null;

async function ensureBusinessInstagramSchema() {
  if (!businessInstagramSchemaPromise) {
    businessInstagramSchemaPromise = (async () => {
      await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_username TEXT;`);
      await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_moderation_status TEXT NOT NULL DEFAULT 'approved';`);
      await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_reviewed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;`);
      await query(`ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_reviewed_at TIMESTAMPTZ;`);
      await query(`CREATE INDEX IF NOT EXISTS idx_businesses_instagram_moderation_status ON businesses(instagram_moderation_status);`);
      await query(`UPDATE businesses SET instagram_moderation_status = 'approved' WHERE instagram_moderation_status IS NULL;`);
    })();
  }

  await businessInstagramSchemaPromise;
}

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

const instagramUsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^@?([a-z0-9._]{1,30})$/, "Invalid Instagram username")
  .transform((value) => value.replace(/^@/, ""));

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
  instagramUsername: instagramUsernameSchema.optional(),
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

type BusinessRow = {
  id: string;
  slug: string;
  username: string | null;
  owner_id: string | null;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  is_approved: boolean | null;
  is_verified: boolean | null;
  is_special: boolean | null;
  homepage_featured: boolean | null;
  homepage_top: boolean | null;
  category: string | null;
  category_id: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram_username: string | null;
  instagram_moderation_status: "pending" | "approved" | "rejected" | null;
  instagram_reviewed_by_user_id: string | null;
  instagram_reviewed_at: Date | null;
  email: string | null;
  tags: string[] | null;
  custom_domain: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_mode: Business["avatarMode"];
  show_similar_businesses: boolean | null;
  media: Business["media"] | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type OwnerIdRow = { owner_id: string };

type BusinessCountRow = {
  total: string;
  pending: string;
  approved: string;
};

function rowToBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    slug: row.slug,
    username: row.username ?? undefined,
    ownerId: row.owner_id ?? undefined,
    name: { en: row.name_en, ar: row.name_ar },
    description: row.description_en || row.description_ar
      ? { en: row.description_en || "", ar: row.description_ar || "" }
      : undefined,
    isApproved: row.is_approved ?? false,
    isVerified: row.is_verified ?? false,
    isSpecial: row.is_special ?? false,
    homepageFeatured: row.homepage_featured ?? false,
    homepageTop: row.homepage_top ?? false,
    category: row.category ?? undefined,
    categoryId: row.category_id ?? undefined,
    city: row.city ?? undefined,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    instagramUsername: row.instagram_username ?? undefined,
    instagramModerationStatus: row.instagram_moderation_status ?? "approved",
    instagramReviewedByUserId: row.instagram_reviewed_by_user_id ?? undefined,
    instagramReviewedAt: row.instagram_reviewed_at?.toISOString(),
    email: row.email ?? undefined,
    tags: row.tags || [],
    customDomain: row.custom_domain ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    avatarMode: row.avatar_mode,
    showSimilarBusinesses: row.show_similar_businesses ?? true,
    media: row.media || {},
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const result = await query<BusinessRow>(`SELECT * FROM businesses WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToBusiness(result.rows[0]) : null;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const key = slugSchema.safeParse(slug);
  if (!key.success) return null;

  const result = await query<BusinessRow>(`SELECT * FROM businesses WHERE slug = $1`, [key.data]);
  return result.rows.length > 0 ? rowToBusiness(result.rows[0]) : null;
}

export async function getBusinessByUsername(username: string): Promise<Business | null> {
  const normalized = username.trim().replace(/^@/, "").toLowerCase();
  const key = usernameSchema.safeParse(normalized);
  if (!key.success) return null;

  // Try username first
  let result = await query<BusinessRow>(`SELECT * FROM businesses WHERE username = $1`, [key.data]);
  if (result.rows.length > 0) return rowToBusiness(result.rows[0]);

  // Fall back to slug
  result = await query<BusinessRow>(`SELECT * FROM businesses WHERE slug = $1`, [key.data]);
  return result.rows.length > 0 ? rowToBusiness(result.rows[0]) : null;
}

export async function getBusinessByOwnerId(ownerId: string): Promise<Business | null> {
  const result = await query<BusinessRow>(`SELECT * FROM businesses WHERE owner_id = $1 LIMIT 1`, [ownerId]);
  return result.rows.length > 0 ? rowToBusiness(result.rows[0]) : null;
}

/** Return a Set of user IDs that own at least one business */
export async function getOwnerIdsWithBusiness(userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await query<OwnerIdRow>(
    `SELECT DISTINCT owner_id FROM businesses WHERE owner_id IN (${placeholders})`,
    userIds
  );
  return new Set(result.rows.map((r) => r.owner_id));
}

/**
 * Get a business by its custom domain.
 */
export async function getBusinessByDomain(domain: string): Promise<Business | null> {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return null;
  const result = await query<BusinessRow>(`SELECT * FROM businesses WHERE custom_domain = $1`, [normalized]);
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
    ? await query<OwnerIdRow>(
        `SELECT DISTINCT owner_id FROM businesses WHERE owner_id IS NOT NULL AND id != $1`,
        [excludeBusinessId]
      )
    : await query<OwnerIdRow>(`SELECT DISTINCT owner_id FROM businesses WHERE owner_id IS NOT NULL`);
  return new Set(result.rows.map((row) => row.owner_id));
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
  const result = await query<BusinessRow>(`SELECT * FROM businesses ORDER BY created_at DESC`);
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

  const result = await query<BusinessRow>(queryStr, params);
  return result.rows.map(rowToBusiness);
}

export async function countBusinesses(
  options: Omit<ListBusinessesOptions, "limit" | "offset"> = {}
): Promise<{ total: number; pending: number; approved: number }> {
  const { search } = options;
  
  let baseCondition = `WHERE 1=1`;
  const params: string[] = [];
  const paramIndex = 1;

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

  const result = await query<BusinessCountRow>(`
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
  const result = await query<BusinessRow>(`SELECT * FROM businesses WHERE is_approved = true ORDER BY name_en`);
  return result.rows.map(rowToBusiness);
}

export type ExplorerBusinessSort =
  | "relevance"
  | "name-asc"
  | "name-desc"
  | "city-asc"
  | "created-desc"
  | "created-asc"
  | "updated-desc"
  | "verified-first"
  | "special-first"
  | "featured-first";

export interface ListExplorerBusinessesOptions {
  search?: string;
  city?: string;
  tags?: string;
  categoryId?: string;
  sortBy?: ExplorerBusinessSort;
  limit?: number;
  offset?: number;
}

function applyExplorerFilters(
  queryStr: string,
  params: (string | number)[],
  options: Omit<ListExplorerBusinessesOptions, "limit" | "offset" | "sortBy">,
): { queryStr: string; paramIndex: number } {
  let paramIndex = params.length + 1;

  if (options.search?.trim()) {
    const value = `%${options.search.trim()}%`;
    queryStr += ` AND (
      b.name_en ILIKE $${paramIndex} OR
      b.name_ar ILIKE $${paramIndex} OR
      b.username ILIKE $${paramIndex} OR
      b.slug ILIKE $${paramIndex} OR
      b.city ILIKE $${paramIndex} OR
      b.phone ILIKE $${paramIndex} OR
      b.category ILIKE $${paramIndex}
    )`;
    params.push(value);
    paramIndex++;
  }

  if (options.city?.trim()) {
    queryStr += ` AND COALESCE(b.city, '') ILIKE $${paramIndex}`;
    params.push(`%${options.city.trim()}%`);
    paramIndex++;
  }

  if (options.categoryId?.trim()) {
    queryStr += ` AND b.category_id = $${paramIndex}`;
    params.push(options.categoryId.trim());
    paramIndex++;
  }

  const tagTokens = (options.tags || "")
    .split(/[ ,]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  for (const token of tagTokens) {
    queryStr += ` AND LOWER(COALESCE(array_to_string(b.tags, ' '), '')) LIKE $${paramIndex}`;
    params.push(`%${token.toLowerCase()}%`);
    paramIndex++;
  }

  return { queryStr, paramIndex };
}

function explorerSortToOrderBy(sortBy: ExplorerBusinessSort): string {
  switch (sortBy) {
    case "name-asc":
      return `ORDER BY b.name_en ASC, b.created_at DESC`;
    case "name-desc":
      return `ORDER BY b.name_en DESC, b.created_at DESC`;
    case "city-asc":
      return `ORDER BY b.city ASC NULLS LAST, b.created_at DESC`;
    case "created-asc":
      return `ORDER BY b.created_at ASC`;
    case "updated-desc":
      return `ORDER BY b.updated_at DESC`;
    case "verified-first":
      return `ORDER BY COALESCE(b.is_verified, false) DESC, b.created_at DESC`;
    case "special-first":
      return `ORDER BY COALESCE(b.is_special, false) DESC, b.created_at DESC`;
    case "featured-first":
      return `ORDER BY (COALESCE(b.homepage_top, false) OR COALESCE(b.homepage_featured, false)) DESC, b.created_at DESC`;
    case "relevance":
    case "created-desc":
    default:
      return `ORDER BY b.created_at DESC`;
  }
}

export async function listExplorerBusinessesPaginated(
  options: ListExplorerBusinessesOptions = {},
): Promise<Business[]> {
  const { limit = 12, offset = 0, sortBy = "relevance" } = options;
  const safeLimit = Math.max(1, Math.min(limit, 60));
  const safeOffset = Math.max(0, offset);

  let queryStr = `SELECT b.* FROM businesses b WHERE b.is_approved = true`;
  const params: (string | number)[] = [];
  const filtered = applyExplorerFilters(queryStr, params, options);
  queryStr = filtered.queryStr;
  let paramIndex = filtered.paramIndex;

  queryStr += ` ${explorerSortToOrderBy(sortBy)} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(safeLimit, safeOffset);

  const result = await query<BusinessRow>(queryStr, params);
  return result.rows.map(rowToBusiness);
}

export async function countExplorerBusinesses(
  options: Omit<ListExplorerBusinessesOptions, "limit" | "offset" | "sortBy"> = {},
): Promise<number> {
  let queryStr = `SELECT COUNT(*)::text AS total FROM businesses b WHERE b.is_approved = true`;
  const params: (string | number)[] = [];
  queryStr = applyExplorerFilters(queryStr, params, options).queryStr;

  const result = await query<{ total: string }>(queryStr, params);
  return parseInt(result.rows[0]?.total || "0", 10);
}

export async function createBusiness(input: BusinessInput): Promise<Business> {
  await ensureBusinessInstagramSchema();
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

  const result = await query<BusinessRow>(`
    INSERT INTO businesses (
      id, slug, username, owner_id, name_en, name_ar, description_en, description_ar,
      is_approved, is_verified, is_special, homepage_featured, homepage_top,
      category, category_id, city, address, phone, website, instagram_username, email, tags,
      latitude, longitude, avatar_mode, show_similar_businesses, media, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $28
    ) RETURNING *
  `, [
    id, data.slug, data.username, data.ownerId,
    data.name.en, data.name.ar,
    data.description?.en, data.description?.ar,
    data.isApproved ?? false, data.isVerified ?? false, data.isSpecial ?? false,
    data.homepageFeatured ?? false, data.homepageTop ?? false,
    data.category, data.categoryId, data.city, data.address, data.phone, data.website, data.instagramUsername, data.email,
    data.tags || [], data.latitude, data.longitude, data.avatarMode || 'icon',
    data.showSimilarBusinesses ?? true,
    JSON.stringify({}), now
  ]);

  return rowToBusiness(result.rows[0]);
}

export async function updateBusiness(id: string, input: Partial<BusinessInput>): Promise<Business> {
  await ensureBusinessInstagramSchema();
  return transaction(async (client) => {
    const currentRes = await client.query<BusinessRow>(`SELECT * FROM businesses WHERE id = $1 FOR UPDATE`, [id]);
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

    const result = await client.query<BusinessRow>(`
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
        instagram_username = $19::text,
        instagram_moderation_status = CASE
          WHEN $19::text IS DISTINCT FROM instagram_username AND $19::text IS NOT NULL THEN 'pending'
          ELSE instagram_moderation_status
        END,
        instagram_reviewed_by_user_id = CASE
          WHEN $19::text IS DISTINCT FROM instagram_username AND $19::text IS NOT NULL THEN NULL
          ELSE instagram_reviewed_by_user_id
        END,
        instagram_reviewed_at = CASE
          WHEN $19::text IS DISTINCT FROM instagram_username AND $19::text IS NOT NULL THEN NULL
          ELSE instagram_reviewed_at
        END,
        email = $20,
        tags = COALESCE($21, tags),
        latitude = $22,
        longitude = $23,
        avatar_mode = COALESCE($24, avatar_mode),
        show_similar_businesses = COALESCE($25, show_similar_businesses),
        updated_at = $26
      WHERE id = $27
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
      data.instagramUsername !== undefined ? data.instagramUsername : current.instagramUsername,
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
  const result = await query<BusinessRow>(`
    UPDATE businesses SET is_approved = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [isApproved, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessVerified(id: string, isVerified: boolean): Promise<Business> {
  const result = await query<BusinessRow>(`
    UPDATE businesses SET is_verified = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [isVerified, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessSpecial(id: string, isSpecial: boolean): Promise<Business> {
  const result = await query<BusinessRow>(`
    UPDATE businesses SET is_special = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [isSpecial, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessHomepageFeatured(id: string, homepageFeatured: boolean): Promise<Business> {
  const result = await query<BusinessRow>(`
    UPDATE businesses SET homepage_featured = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [homepageFeatured, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessHomepageTop(id: string, homepageTop: boolean): Promise<Business> {
  const result = await query<BusinessRow>(`
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
  
  const result = await query<BusinessRow>(`
    UPDATE businesses SET custom_domain = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [normalized, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export async function setBusinessInstagramUsername(id: string, instagramUsername: string | null): Promise<Business> {
  await ensureBusinessInstagramSchema();
  const normalized = instagramUsername?.trim() ? instagramUsernameSchema.parse(instagramUsername) : null;

  const result = await query<BusinessRow>(`
    UPDATE businesses
    SET
      instagram_username = $1::text,
      instagram_moderation_status = CASE WHEN $1::text IS NULL THEN 'approved' ELSE 'pending' END,
      instagram_reviewed_by_user_id = NULL,
      instagram_reviewed_at = NULL,
      updated_at = $2
    WHERE id = $3
    RETURNING *
  `, [normalized, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToBusiness(result.rows[0]);
}

export type ModerationInstagramBusinessItem = Pick<Business,
  "id" | "slug" | "username" | "name" | "instagramUsername" | "instagramModerationStatus" | "instagramReviewedAt"
>;

export async function listPendingBusinessInstagramPages(limit = 100): Promise<ModerationInstagramBusinessItem[]> {
  await ensureBusinessInstagramSchema();
  const result = await query<BusinessRow>(`
    SELECT * FROM businesses
    WHERE instagram_username IS NOT NULL
      AND instagram_moderation_status = 'pending'
    ORDER BY updated_at DESC
    LIMIT $1
  `, [Math.max(1, Math.min(limit, 500))]);

  return result.rows.map((row) => {
    const business = rowToBusiness(row);
    return {
      id: business.id,
      slug: business.slug,
      username: business.username,
      name: business.name,
      instagramUsername: business.instagramUsername,
      instagramModerationStatus: business.instagramModerationStatus,
      instagramReviewedAt: business.instagramReviewedAt,
    };
  });
}

export async function listBusinessInstagramModerationQueue(limit = 200): Promise<ModerationInstagramBusinessItem[]> {
  await ensureBusinessInstagramSchema();
  const result = await query<BusinessRow>(`
    SELECT * FROM businesses
    WHERE instagram_username IS NOT NULL
    ORDER BY
      CASE instagram_moderation_status
        WHEN 'pending' THEN 0
        WHEN 'rejected' THEN 1
        WHEN 'approved' THEN 2
        ELSE 3
      END,
      updated_at DESC
    LIMIT $1
  `, [Math.max(1, Math.min(limit, 1000))]);

  return result.rows.map((row) => {
    const business = rowToBusiness(row);
    return {
      id: business.id,
      slug: business.slug,
      username: business.username,
      name: business.name,
      instagramUsername: business.instagramUsername,
      instagramModerationStatus: business.instagramModerationStatus,
      instagramReviewedAt: business.instagramReviewedAt,
    };
  });
}

export async function moderateBusinessInstagramPage(
  businessId: string,
  status: "approved" | "rejected",
  reviewerUserId: string
): Promise<Business | null> {
  await ensureBusinessInstagramSchema();
  const result = await query<BusinessRow>(`
    UPDATE businesses
    SET
      instagram_moderation_status = $1,
      instagram_reviewed_by_user_id = $2,
      instagram_reviewed_at = $3,
      updated_at = $3
    WHERE id = $4
      AND instagram_username IS NOT NULL
    RETURNING *
  `, [status, reviewerUserId, new Date(), businessId]);

  return result.rows[0] ? rowToBusiness(result.rows[0]) : null;
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

    const result = await client.query<BusinessRow>(`
      UPDATE businesses SET media = $1, updated_at = $2 WHERE id = $3 RETURNING *
    `, [JSON.stringify(media), new Date(), id]);

    return rowToBusiness(result.rows[0]);
  });
}

export async function listBusinessesByCategory(categoryId: string): Promise<Business[]> {
  const result = await query<BusinessRow>(`
    SELECT * FROM businesses WHERE category_id = $1 AND is_approved = true ORDER BY name_en
  `, [categoryId]);
  return result.rows.map(rowToBusiness);
}

export async function listBusinessesByOwner(ownerId: string): Promise<Business[]> {
  const result = await query<BusinessRow>(`SELECT * FROM businesses WHERE owner_id = $1 ORDER BY created_at DESC`, [ownerId]);
  return result.rows.map(rowToBusiness);
}

export async function getBusinessesByIds(ids: string[]): Promise<Business[]> {
  if (ids.length === 0) return [];
  const result = await query<BusinessRow>(`SELECT * FROM businesses WHERE id = ANY($1)`, [ids]);
  return result.rows.map(rowToBusiness);
}

export async function searchBusinesses(searchTerm: string, locale: Locale = "en"): Promise<Business[]> {
  const term = `%${searchTerm.toLowerCase()}%`;
  const result = await query<BusinessRow>(`
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
