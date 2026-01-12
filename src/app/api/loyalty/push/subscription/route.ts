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
      })
      .strict(),
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

    const card = getLoyaltyCardById(data.cardId);
    if (!card || card.status !== "active") {
      return Response.json({ ok: false, error: "CARD_NOT_FOUND" }, { status: 404 });
    }

    const ua = req.headers.get("user-agent") ?? undefined;

    const sub = upsertLoyaltyPushSubscription({
      userId: card.userId,
      customerId: card.customerId,
      subscription: data.subscription,
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

    const card = getLoyaltyCardById(data.cardId);
    if (!card || card.status !== "active") {
      return Response.json({ ok: false, error: "CARD_NOT_FOUND" }, { status: 404 });
    }

    const removed = await removeLoyaltyPushSubscription({
      userId: card.userId,
      customerId: card.customerId,
      endpoint: data.endpoint,
    });

    return Response.json({ ok: true, removed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UNSUBSCRIBE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
