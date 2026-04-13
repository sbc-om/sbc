/**
 * App Settings Management
 * Handles admin-configurable settings
 */
import { query } from "./postgres";

export type SettingKey = 
  | "require_approval"
  | "whatsapp_login_enabled"
  | "whatsapp_registration_verification"
  | "whatsapp_login_notification"
  | "auto_approve_business_requests"
  | "auto_approve_business_updates"
  | "auto_approve_business_stories"
  | "auto_approve_business_news"
  | "auto_approve_business_products"
  | "auto_approve_business_cards"
  | "auto_approve_business_instagram";

export const DEFAULT_BOOLEAN_SETTINGS: Record<SettingKey, boolean> = {
  require_approval: false,
  whatsapp_login_enabled: true,
  whatsapp_registration_verification: true,
  whatsapp_login_notification: false,
  auto_approve_business_requests: false,
  auto_approve_business_updates: false,
  auto_approve_business_stories: false,
  auto_approve_business_news: false,
  auto_approve_business_products: false,
  auto_approve_business_cards: false,
  auto_approve_business_instagram: false,
};

type AppSettingRow = {
  key: SettingKey;
  value: unknown;
};

/**
 * Get a setting value
 */
export async function getSetting<T = boolean>(key: SettingKey): Promise<T | null> {
  const result = await query<{ value: T }>(
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
  const result = await query<AppSettingRow>(`SELECT key, value FROM app_settings`);
  const settings: Partial<Record<SettingKey, unknown>> = { ...DEFAULT_BOOLEAN_SETTINGS };
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }
  return settings as Record<SettingKey, unknown>;
}

export async function getBooleanSetting(key: SettingKey): Promise<boolean> {
  const value = await getSetting<boolean>(key);
  if (typeof value === "boolean") return value;
  return DEFAULT_BOOLEAN_SETTINGS[key];
}

/**
 * Check if WhatsApp login is enabled
 */
export async function isWhatsAppLoginEnabled(): Promise<boolean> {
  return getBooleanSetting("whatsapp_login_enabled");
}

/**
 * Check if WhatsApp registration verification is required
 */
export async function isWhatsAppVerificationRequired(): Promise<boolean> {
  return getBooleanSetting("whatsapp_registration_verification");
}

export async function isBusinessRequestAutoApprovalEnabled(): Promise<boolean> {
  return getBooleanSetting("auto_approve_business_requests");
}

export async function isBusinessUpdateAutoApprovalEnabled(): Promise<boolean> {
  return getBooleanSetting("auto_approve_business_updates");
}

export async function isBusinessStoryAutoApprovalEnabled(): Promise<boolean> {
  return getBooleanSetting("auto_approve_business_stories");
}

export async function isBusinessNewsAutoApprovalEnabled(): Promise<boolean> {
  return getBooleanSetting("auto_approve_business_news");
}

export async function isBusinessProductAutoApprovalEnabled(): Promise<boolean> {
  return getBooleanSetting("auto_approve_business_products");
}

export async function isBusinessCardAutoApprovalEnabled(): Promise<boolean> {
  return getBooleanSetting("auto_approve_business_cards");
}

export async function isBusinessInstagramAutoApprovalEnabled(): Promise<boolean> {
  return getBooleanSetting("auto_approve_business_instagram");
}
