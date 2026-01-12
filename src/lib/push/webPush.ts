import webpush, { type PushSubscription } from "web-push";

export type WebPushPayload = {
  title: string;
  body: string;
  /** Optional URL to open when the notification is clicked. */
  url?: string;
  /** Optional icon URL (e.g. /media/... or absolute). */
  iconUrl?: string;
};

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`MISSING_ENV_${name}`);
  return v;
}

export function isWebPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string {
  return getEnv("VAPID_PUBLIC_KEY");
}

function configureWebPushOnce() {
  // Idempotent: calling setVapidDetails multiple times is fine.
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  webpush.setVapidDetails(subject, getEnv("VAPID_PUBLIC_KEY"), getEnv("VAPID_PRIVATE_KEY"));
}

export async function sendWebPushNotification(input: {
  subscription: PushSubscription;
  payload: WebPushPayload;
}): Promise<{ ok: true } | { ok: false; error: string; statusCode?: number }> {
  try {
    configureWebPushOnce();
    const body = JSON.stringify(input.payload);
    await webpush.sendNotification(input.subscription, body);
    return { ok: true };
  } catch (e: unknown) {
    const maybe = e as { statusCode?: unknown; message?: unknown };
    const statusCode = typeof maybe?.statusCode === "number" ? maybe.statusCode : undefined;
    const msg = typeof maybe?.message === "string" ? maybe.message : "WEB_PUSH_FAILED";
    return { ok: false, error: msg, statusCode };
  }
}
