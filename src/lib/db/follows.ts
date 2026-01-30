import { query } from "./postgres";
import type { Category } from "./types";

function rowToCategory(row: any): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: { en: row.name_en, ar: row.name_ar },
    image: row.image,
    iconId: row.icon_id,
    parentId: row.parent_id,
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
  const result = await query(`
    SELECT c.* FROM categories c
    INNER JOIN user_category_follows f ON c.id = f.category_id
    WHERE f.user_id = $1
    ORDER BY c.name_en
  `, [userId]);
  return result.rows.map(rowToCategory);
}

export async function getUserFollowedCategoryIds(userId: string): Promise<string[]> {
  const result = await query(`
    SELECT category_id FROM user_category_follows WHERE user_id = $1
  `, [userId]);
  return result.rows.map((row: { category_id: string }) => row.category_id);
}

export async function getCategoryFollowerCount(categoryId: string): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) FROM user_category_follows WHERE category_id = $1
  `, [categoryId]);
  return parseInt(result.rows[0].count);
}
