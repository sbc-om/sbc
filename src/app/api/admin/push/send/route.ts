import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  listAllUserPushSubscriptions,
  removeUserPushSubscription,
} from "@/lib/db/users";
import { listUserNotificationSettingsByUserIds } from "@/lib/db/notificationSettings";
import { isWebPushConfigured, sendWebPushNotification } from "@/lib/push/webPush";

export const runtime = "nodejs";

const postSchema = z
  .object({
    userIds: z.array(z.string().trim().min(1)).optional(),
    title: z.string().trim().min(2).max(120),
    body: z.string().trim().min(2).max(1200),
    url: z.string().trim().min(1).max(2048).optional(),
    iconUrl: z.string().trim().min(1).max(2048).optional(),
  })
  .strict();

export async function POST(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });
  if (auth.role !== "admin") return new Response("Forbidden", { status: 403 });

  if (!isWebPushConfigured()) {
    return Response.json({ ok: false, error: "WEB_PUSH_NOT_CONFIGURED" }, { status: 501 });
  }

  try {
    const json = await req.json();
    const data = postSchema.parse(json);

    const allSubs = await listAllUserPushSubscriptions();
    const targetIds = data.userIds?.length ? new Set(data.userIds) : null;
    const scopedSubs = targetIds
      ? allSubs.filter((s) => targetIds.has(s.userId))
      : allSubs;

    const settingsMap = await listUserNotificationSettingsByUserIds(
      Array.from(new Set(scopedSubs.map((s) => s.userId))),
    );

    const subs = scopedSubs.filter((subscription) => {
      const settings = settingsMap[subscription.userId];
      return settings.notificationsEnabled && settings.marketingUpdates;
    });

    const results = await Promise.all(
      subs.map(async (s) => {
        const res = await sendWebPushNotification({
          subscription: { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } },
          payload: {
            title: data.title,
            body: data.body,
            url: data.url,
            iconUrl: data.iconUrl,
          },
        });

        if (!res.ok && (res.statusCode === 404 || res.statusCode === 410)) {
          await removeUserPushSubscription({
            userId: s.userId,
            endpoint: s.endpoint,
          });
        }

        return res.ok;
      })
    );

    const sent = results.filter(Boolean).length;
    const failed = results.length - sent;

    return Response.json({ ok: true, sent, failed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "SEND_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
