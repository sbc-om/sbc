import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { createLoyaltyMessage } from "@/lib/db/loyalty";

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

    return Response.json({ ok: true, message });
  } catch (e) {
    const message = e instanceof Error ? e.message : "SEND_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
