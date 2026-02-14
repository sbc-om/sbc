import { nanoid } from "nanoid";

import { query } from "./postgres";
import type { UserNotification, UserNotificationType } from "./types";

type NotificationRow = {
  id: string;
  user_id: string;
  type: UserNotificationType;
  title: string;
  body: string;
  href: string | null;
  actor_user_id: string | null;
  actor_name: string | null;
  business_id: string | null;
  business_name: string | null;
  is_read: boolean;
  read_at: Date | null;
  created_at: Date | null;
};

function rowToNotification(row: NotificationRow): UserNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href ?? undefined,
    actorUserId: row.actor_user_id ?? undefined,
    actorName: row.actor_name ?? undefined,
    businessId: row.business_id ?? undefined,
    businessName: row.business_name ?? undefined,
    isRead: row.is_read,
    readAt: row.read_at?.toISOString(),
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createUserNotification(input: {
  userId: string;
  type: UserNotificationType;
  title: string;
  body: string;
  href?: string;
  actorUserId?: string;
  businessId?: string;
}): Promise<UserNotification> {
  const id = nanoid();
  const now = new Date();

  const result = await query<NotificationRow>(
    `
    INSERT INTO user_notifications (id, user_id, type, title, body, href, actor_user_id, business_id, is_read, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9)
    RETURNING
      id,
      user_id,
      type,
      title,
      body,
      href,
      actor_user_id,
      NULL::TEXT as actor_name,
      business_id,
      NULL::TEXT as business_name,
      is_read,
      read_at,
      created_at
    `,
    [
      id,
      input.userId,
      input.type,
      input.title,
      input.body,
      input.href ?? null,
      input.actorUserId ?? null,
      input.businessId ?? null,
      now,
    ]
  );

  return rowToNotification(result.rows[0]);
}

export async function createBusinessLikeNotificationOnce(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
  actorUserId: string;
  businessId: string;
}): Promise<UserNotification | null> {
  const id = nanoid();
  const now = new Date();

  const result = await query<NotificationRow>(
    `
    INSERT INTO user_notifications (id, user_id, type, title, body, href, actor_user_id, business_id, is_read, created_at)
    VALUES ($1, $2, 'business_like', $3, $4, $5, $6, $7, false, $8)
    ON CONFLICT DO NOTHING
    RETURNING
      id,
      user_id,
      type,
      title,
      body,
      href,
      actor_user_id,
      NULL::TEXT as actor_name,
      business_id,
      NULL::TEXT as business_name,
      is_read,
      read_at,
      created_at
    `,
    [
      id,
      input.userId,
      input.title,
      input.body,
      input.href ?? null,
      input.actorUserId,
      input.businessId,
      now,
    ]
  );

  if (result.rows.length === 0) return null;
  return rowToNotification(result.rows[0]);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::TEXT AS count FROM user_notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return Number(result.rows[0]?.count ?? "0");
}

export async function listUserNotifications(userId: string, limit = 50): Promise<UserNotification[]> {
  const result = await query<NotificationRow>(
    `
    SELECT
      n.id,
      n.user_id,
      n.type,
      n.title,
      n.body,
      n.href,
      n.actor_user_id,
      COALESCE(u.display_name, u.full_name, u.email) AS actor_name,
      n.business_id,
      COALESCE(b.name_en, b.slug) AS business_name,
      n.is_read,
      n.read_at,
      n.created_at
    FROM user_notifications n
    LEFT JOIN users u ON u.id = n.actor_user_id
    LEFT JOIN businesses b ON b.id = n.business_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT $2
    `,
    [userId, Math.max(1, Math.min(limit, 200))]
  );

  return result.rows.map(rowToNotification);
}

export async function getLatestUserNotification(userId: string): Promise<UserNotification | null> {
  const result = await query<NotificationRow>(
    `
    SELECT
      n.id,
      n.user_id,
      n.type,
      n.title,
      n.body,
      n.href,
      n.actor_user_id,
      COALESCE(u.display_name, u.full_name, u.email) AS actor_name,
      n.business_id,
      COALESCE(b.name_en, b.slug) AS business_name,
      n.is_read,
      n.read_at,
      n.created_at
    FROM user_notifications n
    LEFT JOIN users u ON u.id = n.actor_user_id
    LEFT JOIN businesses b ON b.id = n.business_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT 1
    `,
    [userId]
  );

  if (result.rows.length === 0) return null;
  return rowToNotification(result.rows[0]);
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await query(
    `
    UPDATE user_notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = $1 AND is_read = false
    `,
    [userId]
  );

  return result.rowCount ?? 0;
}
