export type NotificationPreferences = {
  notificationsEnabled: boolean;
  marketingUpdates: boolean;
  soundsEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notificationsEnabled: true,
  marketingUpdates: true,
  soundsEnabled: false,
};

export const NOTIFICATION_PREFERENCES_STORAGE_KEY = "sbc_notification_preferences_v2";
export const NOTIFICATION_PREFERENCES_EVENT = "sbc:notification-settings-changed";

export function normalizeNotificationPreferences(
  input: Partial<NotificationPreferences> | null | undefined,
): NotificationPreferences {
  return {
    notificationsEnabled: Boolean(
      input?.notificationsEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.notificationsEnabled,
    ),
    marketingUpdates: Boolean(
      input?.marketingUpdates ?? DEFAULT_NOTIFICATION_PREFERENCES.marketingUpdates,
    ),
    soundsEnabled: Boolean(input?.soundsEnabled ?? DEFAULT_NOTIFICATION_PREFERENCES.soundsEnabled),
  };
}

export function parseNotificationPreferences(raw: string | null): NotificationPreferences | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return normalizeNotificationPreferences(parsed);
  } catch {
    return null;
  }
}
