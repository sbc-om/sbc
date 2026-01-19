import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { removeUserPushSubscription, upsertUserPushSubscription } from "@/lib/db/users";

export const runtime = "nodejs";

const postSchema = z
  .object({
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
    endpoint: z.string().trim().min(1).optional(),
  })
  .strict();

export async function POST(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const json = await req.json();
    const data = postSchema.parse(json);

    const ua = req.headers.get("user-agent") ?? undefined;

    const sub = upsertUserPushSubscription({
      userId: auth.id,
      subscription: {
        endpoint: data.subscription.endpoint,
        keys: data.subscription.keys,
      },
      userAgent: ua,
    });

    return Response.json({ ok: true, subscriptionId: sub.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "SUBSCRIBE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const json = await req.json().catch(() => ({}));
    const data = deleteSchema.parse(json);

    const removed = await removeUserPushSubscription({
      userId: auth.id,
      endpoint: data.endpoint,
    });

    return Response.json({ ok: true, removed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UNSUBSCRIBE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
