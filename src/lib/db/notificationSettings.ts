import { z } from "zod";

import { query } from "./postgres";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications/preferences";

type NotificationSettingsRow = {
  user_id: string;
  notifications_enabled: boolean | null;
  marketing_updates: boolean | null;
  sounds_enabled: boolean | null;
  updated_at: Date | null;
};

const upsertSchema = z
  .object({
    notificationsEnabled: z.boolean().optional(),
    marketingUpdates: z.boolean().optional(),
    soundsEnabled: z.boolean().optional(),
  })
  .strict();

let ensureTablePromise: Promise<void> | null = null;

function isUndefinedTableError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "42P01";
}

async function ensureNotificationSettingsTable(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS user_notification_settings (
          user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          notifications_enabled BOOLEAN NOT NULL DEFAULT true,
          marketing_updates BOOLEAN NOT NULL DEFAULT true,
          sounds_enabled BOOLEAN NOT NULL DEFAULT false,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    })().finally(() => {
      ensureTablePromise = null;
    });
  }

  await ensureTablePromise;
}

async function queryWithTableGuard(sql: string, params: unknown[]): Promise<{ rows: NotificationSettingsRow[] }> {
  try {
    return await query<NotificationSettingsRow>(sql, params);
  } catch (error) {
    if (!isUndefinedTableError(error)) throw error;
    await ensureNotificationSettingsTable();
    return await query<NotificationSettingsRow>(sql, params);
  }
}

function rowToSettings(row: NotificationSettingsRow | null): NotificationPreferences {
  if (!row) return DEFAULT_NOTIFICATION_PREFERENCES;
  return normalizeNotificationPreferences({
    notificationsEnabled: row.notifications_enabled ?? undefined,
    marketingUpdates: row.marketing_updates ?? undefined,
    soundsEnabled: row.sounds_enabled ?? undefined,
  });
}

export async function getUserNotificationSettings(userId: string): Promise<NotificationPreferences> {
  const result = await queryWithTableGuard(
    `SELECT user_id, notifications_enabled, marketing_updates, sounds_enabled, updated_at FROM user_notification_settings WHERE user_id = $1`,
    [userId],
  );

  if (result.rows.length === 0) return DEFAULT_NOTIFICATION_PREFERENCES;
  return rowToSettings(result.rows[0]);
}

export async function upsertUserNotificationSettings(
  userId: string,
  input: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const patch = upsertSchema.parse(input);
  const current = await getUserNotificationSettings(userId);
  const merged = normalizeNotificationPreferences({ ...current, ...patch });

  const result = await queryWithTableGuard(
    `
    INSERT INTO user_notification_settings (user_id, notifications_enabled, marketing_updates, sounds_enabled, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      notifications_enabled = EXCLUDED.notifications_enabled,
      marketing_updates = EXCLUDED.marketing_updates,
      sounds_enabled = EXCLUDED.sounds_enabled,
      updated_at = NOW()
    RETURNING user_id, notifications_enabled, marketing_updates, sounds_enabled, updated_at
    `,
    [userId, merged.notificationsEnabled, merged.marketingUpdates, merged.soundsEnabled],
  );

  return rowToSettings(result.rows[0] ?? null);
}

export async function listUserNotificationSettingsByUserIds(
  userIds: string[],
): Promise<Record<string, NotificationPreferences>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const result = await queryWithTableGuard(
    `
    SELECT user_id, notifications_enabled, marketing_updates, sounds_enabled, updated_at
    FROM user_notification_settings
    WHERE user_id = ANY($1::text[])
    `,
    [uniqueIds],
  );

  const out: Record<string, NotificationPreferences> = {};
  for (const id of uniqueIds) {
    out[id] = DEFAULT_NOTIFICATION_PREFERENCES;
  }

  for (const row of result.rows) {
    out[row.user_id] = rowToSettings(row);
  }

  return out;
}
