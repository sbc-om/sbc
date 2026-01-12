import { z } from "zod";
import { headers } from "next/headers";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  createLoyaltyMessage,
  defaultLoyaltySettings,
  getLoyaltyCustomerById,
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
  listLoyaltyCustomersByUser,
  listLoyaltyPushSubscriptionsByUser,
  removeLoyaltyPushSubscription,
} from "@/lib/db/loyalty";
import { defaultLocale } from "@/lib/i18n/locales";
import { isWebPushConfigured, sendWebPushNotification } from "@/lib/push/webPush";
import { notifyAppleWalletPassUpdated } from "@/lib/wallet/appleApns";

export const runtime = "nodejs";

const postSchema = z
  .object({
    customerId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(2).max(120),
    body: z.string().trim().min(2).max(1200),
  })
  .strict();

export async function POST(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const json = await req.json();
    const data = postSchema.parse(json);

    const message = createLoyaltyMessage({
      userId: auth.id,
      message: data,
    });

    // Best-effort: trigger Wallet-style alerts for customers who added the pass to Apple Wallet.
    // This does NOT reveal or track user location; it only tells Wallet "pass changed".
    try {
      const targetCardIds: string[] = [];
      if (message.customerId) {
        const c = getLoyaltyCustomerById(message.customerId);
        if (c?.cardId) targetCardIds.push(c.cardId);
      } else {
        for (const c of listLoyaltyCustomersByUser(auth.id)) {
          if (c.cardId) targetCardIds.push(c.cardId);
        }
      }

      await Promise.all(targetCardIds.map((cardId) => notifyAppleWalletPassUpdated({ cardId })));
    } catch {
      // ignore
    }

    // Fire-and-forget push delivery attempt (best-effort).
    // Even if push is not configured or fails, we still store the message.
    if (isWebPushConfigured()) {
      const h = await headers();
      const proto = h.get("x-forwarded-proto") ?? "http";
      const host = h.get("x-forwarded-host") ?? h.get("host");
      const baseUrl = host ? `${proto}://${host}` : "";

      const profile = getLoyaltyProfileByUserId(auth.id);
      const settings = getLoyaltySettingsByUserId(auth.id) ?? defaultLoyaltySettings(auth.id);
      const effectiveIconUrl =
        settings.pointsIconMode === "custom" ? settings.pointsIconUrl : profile?.logoUrl;
      const iconUrl = effectiveIconUrl
        ? effectiveIconUrl.startsWith("/")
          ? `${baseUrl}${effectiveIconUrl}`
          : effectiveIconUrl
        : undefined;

      const targetCustomer = message.customerId ? getLoyaltyCustomerById(message.customerId) : null;
      const cardUrl =
        targetCustomer?.cardId && baseUrl
          ? `${baseUrl}/${defaultLocale}/loyalty/card/${encodeURIComponent(targetCustomer.cardId)}`
          : baseUrl || undefined;

      const subs = listLoyaltyPushSubscriptionsByUser({
        userId: auth.id,
        customerId: message.customerId,
      });

      await Promise.all(
        subs.map(async (s) => {
          const res = await sendWebPushNotification({
            subscription: { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } },
            payload: {
              title: message.title,
              body: message.body,
              url: cardUrl,
              iconUrl,
            },
          });

          // Cleanup stale subscriptions.
          if (!res.ok && (res.statusCode === 404 || res.statusCode === 410)) {
            await removeLoyaltyPushSubscription({
              userId: auth.id,
              customerId: s.customerId,
              endpoint: s.endpoint,
            });
          }
        })
      );
    }

    return Response.json({ ok: true, message });
  } catch (e) {
    const message = e instanceof Error ? e.message : "SEND_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
