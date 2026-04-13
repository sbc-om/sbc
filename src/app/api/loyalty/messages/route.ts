import { z } from "zod";
import { headers } from "next/headers";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  createLoyaltyMessage,
  defaultLoyaltySettings,
  getLoyaltyCustomerById,
  getLoyaltyCustomerByMemberId,
  getLoyaltyProfileByUserId,
  getLoyaltySettingsByUserId,
  listLoyaltyCustomersByUser,
  listLoyaltyPushSubscriptionsByBusiness,
  listLoyaltyPushSubscriptionsByCustomer,
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

    let targetCustomerId: string | undefined;
    if (data.customerId) {
      const rawTarget = data.customerId.trim();

      // Accept both internal customer id and public member id (e.g. SPH01),
      // while enforcing ownership under the authenticated business.
      const byId = await getLoyaltyCustomerById(rawTarget);
      if (byId && byId.userId === auth.id) {
        targetCustomerId = byId.id;
      } else {
        const upperTarget = rawTarget.toUpperCase();
        const byMemberId =
          (await getLoyaltyCustomerByMemberId(auth.id, rawTarget)) ??
          (upperTarget !== rawTarget
            ? await getLoyaltyCustomerByMemberId(auth.id, upperTarget)
            : null);
        if (!byMemberId) throw new Error("CUSTOMER_NOT_FOUND");
        targetCustomerId = byMemberId.id;
      }
    }

    const message = await createLoyaltyMessage({
      userId: auth.id,
      customerId: targetCustomerId,
      title: data.title,
      body: data.body,
    });

    // Best-effort: trigger Wallet-style alerts for customers who added the pass to Apple Wallet.
    // This does NOT reveal or track user location; it only tells Wallet "pass changed".
    try {
      const targetCardIds: string[] = [];
      if (message.customerId) {
        const c = await getLoyaltyCustomerById(message.customerId);
        if (c?.cardId) targetCardIds.push(c.cardId);
      } else {
        for (const c of await listLoyaltyCustomersByUser(auth.id)) {
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
      const proto = (h.get("x-forwarded-proto") ?? "http").split(",")[0].trim();
      const host = h.get("x-forwarded-host") ?? h.get("host");
      const baseUrl = host ? `${proto}://${host}` : "";

      const profile = await getLoyaltyProfileByUserId(auth.id);
      const settings = (await getLoyaltySettingsByUserId(auth.id)) ?? defaultLoyaltySettings(auth.id);
      const effectiveIconUrl =
        settings.pointsIconMode === "custom" ? settings.pointsIconUrl : profile?.logoUrl;
      const iconUrl = effectiveIconUrl
        ? effectiveIconUrl.startsWith("/")
          ? `${baseUrl}${effectiveIconUrl}`
          : effectiveIconUrl
        : undefined;

      const targetCustomer = message.customerId ? await getLoyaltyCustomerById(message.customerId) : null;
      const cardUrl =
        targetCustomer?.cardId && baseUrl
          ? `${baseUrl}/${defaultLocale}/loyalty/card/${encodeURIComponent(targetCustomer.cardId)}`
          : baseUrl || undefined;

      // Get push subscriptions - either for specific customer or all business customers
      const subs = message.customerId
        ? await listLoyaltyPushSubscriptionsByCustomer(message.customerId)
        : await listLoyaltyPushSubscriptionsByBusiness(auth.id);

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
            await removeLoyaltyPushSubscription(s.id);
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
