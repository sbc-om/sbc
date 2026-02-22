import { query } from "./postgres";
import type { Category, Business } from "./types";

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

type BusinessRow = {
  id: string;
  slug: string;
  username: string | null;
  owner_id: string;
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
  email: string | null;
  tags: string[] | null;
  latitude: number | null;
  longitude: number | null;
  avatar_mode: Business["avatarMode"];
  show_similar_businesses: boolean | null;
  media: Business["media"] | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: { en: row.name_en, ar: row.name_ar },
    image: row.image ?? undefined,
    iconId: row.icon_id ?? undefined,
    parentId: row.parent_id ?? undefined,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function rowToBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    slug: row.slug,
    username: row.username ?? undefined,
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
    category: row.category ?? undefined,
    categoryId: row.category_id ?? undefined,
    city: row.city ?? undefined,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    email: row.email ?? undefined,
    tags: row.tags || [],
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    avatarMode: row.avatar_mode,
    showSimilarBusinesses: row.show_similar_businesses ?? true,
    media: row.media || {},
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function followCategory(userId: string, categoryId: string): Promise<void> {
  await query(`
    INSERT INTO user_category_follows (user_id, category_id, created_at)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
  `, [userId, categoryId, new Date()]);
}

export async function unfollowCategory(userId: string, categoryId: string): Promise<void> {
  await query(`DELETE FROM user_category_follows WHERE user_id = $1 AND category_id = $2`, [userId, categoryId]);
}

export async function isFollowingCategory(userId: string, categoryId: string): Promise<boolean> {
  const result = await query(`
    SELECT 1 FROM user_category_follows WHERE user_id = $1 AND category_id = $2
  `, [userId, categoryId]);
  return result.rows.length > 0;
}

export async function getUserFollowedCategories(userId: string): Promise<Category[]> {
  const result = await query<CategoryRow>(`
    SELECT c.* FROM categories c
    INNER JOIN user_category_follows f ON c.id = f.category_id
    WHERE f.user_id = $1
    ORDER BY c.name_en
  `, [userId]);
  return result.rows.map(rowToCategory);
}

export async function getUserFollowedCategoryIds(userId: string): Promise<string[]> {
  const result = await query<{ category_id: string }>(`
    SELECT category_id FROM user_category_follows WHERE user_id = $1
  `, [userId]);
  return result.rows.map((row) => row.category_id);
}

export async function getCategoryFollowerCount(categoryId: string): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) FROM user_category_follows WHERE category_id = $1
  `, [categoryId]);
  return parseInt(result.rows[0].count);
}

// ============ Business Follow Functions ============

/**
 * Follow a specific business (for businesses not in followed categories)
 */
export async function followBusiness(userId: string, businessId: string): Promise<void> {
  // When following a business, also remove from unfollows if exists
  await query(`DELETE FROM user_business_unfollows WHERE user_id = $1 AND business_id = $2`, [userId, businessId]);
  await query(`
    INSERT INTO user_business_follows (user_id, business_id, created_at)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
  `, [userId, businessId, new Date()]);
}

/**
 * Unfollow a specific business (hides it even if its category is followed)
 */
export async function unfollowBusiness(userId: string, businessId: string): Promise<void> {
  // Remove from follows
  await query(`DELETE FROM user_business_follows WHERE user_id = $1 AND business_id = $2`, [userId, businessId]);
  // Add to unfollows (to hide even when category is followed)
  await query(`
    INSERT INTO user_business_unfollows (user_id, business_id, created_at)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
  `, [userId, businessId, new Date()]);
}

/**
 * Re-follow a business that was previously unfollowed
 * (Removes from unfollows list)
 */
export async function refollowBusiness(userId: string, businessId: string): Promise<void> {
  await query(`DELETE FROM user_business_unfollows WHERE user_id = $1 AND business_id = $2`, [userId, businessId]);
}

/**
 * Check if user is directly following a business
 */
export async function isFollowingBusiness(userId: string, businessId: string): Promise<boolean> {
  const result = await query(`
    SELECT 1 FROM user_business_follows WHERE user_id = $1 AND business_id = $2
  `, [userId, businessId]);
  return result.rows.length > 0;
}

/**
 * Check if user has unfollowed (hidden) a business
 */
export async function hasUnfollowedBusiness(userId: string, businessId: string): Promise<boolean> {
  const result = await query(`
    SELECT 1 FROM user_business_unfollows WHERE user_id = $1 AND business_id = $2
  `, [userId, businessId]);
  return result.rows.length > 0;
}

/**
 * Get follow status for a business
 * Returns: 'following' | 'unfollowed' | 'neutral'
 */
export async function getBusinessFollowStatus(
  userId: string,
  businessId: string
): Promise<'following' | 'unfollowed' | 'neutral'> {
  const [isFollowing, isUnfollowed] = await Promise.all([
    isFollowingBusiness(userId, businessId),
    hasUnfollowedBusiness(userId, businessId),
  ]);
  if (isFollowing) return 'following';
  if (isUnfollowed) return 'unfollowed';
  return 'neutral';
}

/**
 * Get all businesses the user has explicitly followed
 */
export async function getUserFollowedBusinesses(userId: string): Promise<Business[]> {
  const result = await query<BusinessRow>(`
    SELECT b.* FROM businesses b
    INNER JOIN user_business_follows f ON b.id = f.business_id
    WHERE f.user_id = $1 AND b.is_approved = true
    ORDER BY f.created_at DESC
  `, [userId]);
  return result.rows.map(rowToBusiness);
}

/**
 * Get IDs of businesses the user has explicitly followed
 */
export async function getUserFollowedBusinessIds(userId: string): Promise<string[]> {
  const result = await query<{ business_id: string }>(`
    SELECT business_id FROM user_business_follows WHERE user_id = $1
  `, [userId]);
  return result.rows.map((row) => row.business_id);
}

/**
 * Get IDs of businesses the user has unfollowed (hidden)
 */
export async function getUserUnfollowedBusinessIds(userId: string): Promise<string[]> {
  const result = await query<{ business_id: string }>(`
    SELECT business_id FROM user_business_unfollows WHERE user_id = $1
  `, [userId]);
  return result.rows.map((row) => row.business_id);
}

export async function countUserHomeBusinesses(userId: string): Promise<number> {
  const result = await query<{ total: string }>(`
    SELECT COUNT(*)::text AS total
    FROM businesses b
    WHERE b.is_approved = true
      AND (
        EXISTS (
          SELECT 1
          FROM user_business_follows f
          WHERE f.user_id = $1 AND f.business_id = b.id
        )
        OR (
          NOT EXISTS (
            SELECT 1
            FROM user_business_unfollows uf
            WHERE uf.user_id = $1 AND uf.business_id = b.id
          )
          AND b.category_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM user_category_follows cf
            WHERE cf.user_id = $1 AND cf.category_id = b.category_id
          )
        )
      )
  `, [userId]);

  return parseInt(result.rows[0]?.total || "0", 10);
}

export async function listUserHomeBusinessesPaginated(
  userId: string,
  limit = 12,
  offset = 0,
): Promise<Business[]> {
  const safeLimit = Math.max(1, Math.min(limit, 60));
  const safeOffset = Math.max(0, offset);

  const result = await query<BusinessRow>(`
    SELECT b.*
    FROM businesses b
    WHERE b.is_approved = true
      AND (
        EXISTS (
          SELECT 1
          FROM user_business_follows f
          WHERE f.user_id = $1 AND f.business_id = b.id
        )
        OR (
          NOT EXISTS (
            SELECT 1
            FROM user_business_unfollows uf
            WHERE uf.user_id = $1 AND uf.business_id = b.id
          )
          AND b.category_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM user_category_follows cf
            WHERE cf.user_id = $1 AND cf.category_id = b.category_id
          )
        )
      )
    ORDER BY b.created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, safeLimit, safeOffset]);

  return result.rows.map(rowToBusiness);
}

/**
 * Get follower count for a business
 */
export async function getBusinessFollowerCount(businessId: string): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) FROM user_business_follows WHERE business_id = $1
  `, [businessId]);
  return parseInt(result.rows[0].count);
}
