import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { adjustLoyaltyCustomerPoints } from "@/lib/db/loyalty";

export const runtime = "nodejs";

const patchSchema = z.object({
  delta: z.number().int().min(-1000).max(1000),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const json = await req.json();
    const data = patchSchema.parse(json);

    const customer = adjustLoyaltyCustomerPoints({
      userId: auth.id,
      customerId: id,
      delta: data.delta,
    });

    return Response.json({ ok: true, customer });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPDATE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
