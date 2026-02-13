/**
 * App Settings Management
 * Handles admin-configurable settings
 */
import { query } from "./postgres";

export type SettingKey = 
  | "whatsapp_login_enabled"
  | "whatsapp_registration_verification"
  | "whatsapp_login_notification";

type AppSettingRow = {
  key: SettingKey;
  value: unknown;
};

/**
 * Get a setting value
 */
export async function getSetting<T = boolean>(key: SettingKey): Promise<T | null> {
  const result = await query(
    `SELECT value FROM app_settings WHERE key = $1`,
    [key]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].value as T;
}

/**
 * Set a setting value
 */
export async function setSetting<T>(key: SettingKey, value: T): Promise<void> {
  await query(
    `INSERT INTO app_settings (key, value, updated_at) 
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
}

/**
 * Get all settings
 */
export async function getAllSettings(): Promise<Record<SettingKey, unknown>> {
  const result = await query(`SELECT key, value FROM app_settings`);
  const settings: Partial<Record<SettingKey, unknown>> = {};
  for (const row of result.rows as AppSettingRow[]) {
    settings[row.key] = row.value;
  }
  return settings as Record<SettingKey, unknown>;
}

/**
 * Check if WhatsApp login is enabled
 */
export async function isWhatsAppLoginEnabled(): Promise<boolean> {
  const value = await getSetting<boolean>("whatsapp_login_enabled");
  return value === true;
}

/**
 * Check if WhatsApp registration verification is required
 */
export async function isWhatsAppVerificationRequired(): Promise<boolean> {
  const value = await getSetting<boolean>("whatsapp_registration_verification");
  return value === true;
}
