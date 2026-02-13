import { query } from "./postgres";

// Business likes
export async function likeBusiness(userId: string, businessId: string): Promise<void> {
  await query(`
    INSERT INTO user_business_likes (user_id, business_id, created_at)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
  `, [userId, businessId, new Date()]);
}

export async function unlikeBusiness(userId: string, businessId: string): Promise<void> {
  await query(`DELETE FROM user_business_likes WHERE user_id = $1 AND business_id = $2`, [userId, businessId]);
}

export async function hasUserLikedBusiness(userId: string, businessId: string): Promise<boolean> {
  const result = await query(`
    SELECT 1 FROM user_business_likes WHERE user_id = $1 AND business_id = $2
  `, [userId, businessId]);
  return result.rows.length > 0;
}

export async function getBusinessLikeCount(businessId: string): Promise<number> {
  const result = await query(`
    SELECT COUNT(*) FROM user_business_likes WHERE business_id = $1
  `, [businessId]);
  return parseInt(result.rows[0].count);
}

export async function getUserLikedBusinessIds(userId: string): Promise<string[]> {
  const result = await query<{ business_id: string }>(`
    SELECT business_id FROM user_business_likes WHERE user_id = $1
  `, [userId]);
  return result.rows.map((row) => row.business_id);
}

// Business saves
export async function saveBusiness(userId: string, businessId: string): Promise<void> {
  await query(`
    INSERT INTO user_business_saves (user_id, business_id, created_at)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
  `, [userId, businessId, new Date()]);
}

export async function unsaveBusiness(userId: string, businessId: string): Promise<void> {
  await query(`DELETE FROM user_business_saves WHERE user_id = $1 AND business_id = $2`, [userId, businessId]);
}

export async function hasUserSavedBusiness(userId: string, businessId: string): Promise<boolean> {
  const result = await query(`
    SELECT 1 FROM user_business_saves WHERE user_id = $1 AND business_id = $2
  `, [userId, businessId]);
  return result.rows.length > 0;
}

export async function getUserSavedBusinessIds(userId: string): Promise<string[]> {
  const result = await query<{ business_id: string }>(`
    SELECT business_id FROM user_business_saves WHERE user_id = $1 ORDER BY created_at DESC
  `, [userId]);
  return result.rows.map((row) => row.business_id);
}

// Business comments
import { nanoid } from "nanoid";
import type { BusinessComment, BusinessCommentStatus } from "./types";

type BusinessCommentRow = {
  id: string;
  business_id: string;
  user_id: string;
  text: string;
  status: BusinessCommentStatus;
  moderated_by_user_id: string | null;
  moderated_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function rowToComment(r: BusinessCommentRow): BusinessComment {
  return {
    id: r.id,
    businessId: r.business_id,
    userId: r.user_id,
    text: r.text,
    status: r.status as BusinessCommentStatus,
    moderatedByUserId: r.moderated_by_user_id ?? undefined,
    moderatedAt: r.moderated_at?.toISOString(),
    createdAt: r.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: r.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createBusinessComment(input: {
  businessId: string;
  userId: string;
  text: string;
}): Promise<BusinessComment> {
  const id = nanoid();
  const now = new Date();

  const result = await query<BusinessCommentRow>(`
    INSERT INTO business_comments (id, business_id, user_id, text, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, 'pending', $5, $5)
    RETURNING *
  `, [id, input.businessId, input.userId, input.text, now]);

  return rowToComment(result.rows[0]);
}

export async function getBusinessComments(businessId: string): Promise<BusinessComment[]> {
  const result = await query<BusinessCommentRow>(`
    SELECT * FROM business_comments WHERE business_id = $1 ORDER BY created_at DESC
  `, [businessId]);
  return result.rows.map(rowToComment);
}

export async function getApprovedBusinessComments(businessId: string): Promise<BusinessComment[]> {
  const result = await query<BusinessCommentRow>(`
    SELECT * FROM business_comments WHERE business_id = $1 AND status = 'approved' ORDER BY created_at DESC
  `, [businessId]);
  return result.rows.map(rowToComment);
}

export async function moderateComment(
  commentId: string,
  status: BusinessCommentStatus,
  moderatorUserId: string
): Promise<BusinessComment> {
  const result = await query<BusinessCommentRow>(`
    UPDATE business_comments SET
      status = $1,
      moderated_by_user_id = $2,
      moderated_at = $3,
      updated_at = $3
    WHERE id = $4
    RETURNING *
  `, [status, moderatorUserId, new Date(), commentId]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToComment(result.rows[0]);
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const result = await query(`DELETE FROM business_comments WHERE id = $1`, [commentId]);
  return (result.rowCount ?? 0) > 0;
}

export async function listAllComments(): Promise<BusinessComment[]> {
  const result = await query<BusinessCommentRow>(`SELECT * FROM business_comments ORDER BY created_at DESC`);
  return result.rows.map(rowToComment);
}

export async function listPendingComments(): Promise<BusinessComment[]> {
  const result = await query<BusinessCommentRow>(`SELECT * FROM business_comments WHERE status = 'pending' ORDER BY created_at DESC`);
  return result.rows.map(rowToComment);
}
