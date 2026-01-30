import { z } from "zod";

import {
  getLoyaltyCardById,
  removeLoyaltyPushSubscription,
  upsertLoyaltyPushSubscription,
} from "@/lib/db/loyalty";

export const runtime = "nodejs";

const postSchema = z
  .object({
    cardId: z.string().trim().min(1),
    subscription: z
      .object({
        endpoint: z.string().trim().min(1),
        keys: z.object({ p256dh: z.string().trim().min(1), auth: z.string().trim().min(1) }).strict(),
        expirationTime: z.number().nullable().optional(),
      })
      .passthrough(),
  })
  .strict();

const deleteSchema = z
  .object({
    cardId: z.string().trim().min(1),
    endpoint: z.string().trim().min(1).optional(),
  })
  .strict();

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = postSchema.parse(json);

    const card = await getLoyaltyCardById(data.cardId);
    if (!card || card.status !== "active") {
      return Response.json({ ok: false, error: "CARD_NOT_FOUND" }, { status: 404 });
    }

    const ua = req.headers.get("user-agent") ?? undefined;

    const sub = await upsertLoyaltyPushSubscription({
      userId: card.userId,
      customerId: card.customerId,
      endpoint: data.subscription.endpoint,
      keys: data.subscription.keys,
      userAgent: ua,
    });

    return Response.json({ ok: true, subscriptionId: sub.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "SUBSCRIBE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const data = deleteSchema.parse(json);

    const card = await getLoyaltyCardById(data.cardId);
    if (!card || card.status !== "active") {
      return Response.json({ ok: false, error: "CARD_NOT_FOUND" }, { status: 404 });
    }

    // Build subscription ID from customerId and endpoint hash to remove
    const { createHash } = await import("node:crypto");
    const hashEndpoint = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex").slice(0, 16);
    const subId = data.endpoint ? `${card.customerId}:${hashEndpoint(data.endpoint)}` : null;
    const removed = subId ? await removeLoyaltyPushSubscription(subId) : false;

    return Response.json({ ok: true, removed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UNSUBSCRIBE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
