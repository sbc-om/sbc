import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getLoyaltyProfileByUserId,
  upsertLoyaltyProfile,
} from "@/lib/db/loyalty";

export const runtime = "nodejs";

const patchSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  joinCode: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
});

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const profile = getLoyaltyProfileByUserId(auth.id);
  return Response.json({ ok: true, profile: profile ?? null });
}

export async function PATCH(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const json = await req.json();
    const data = patchSchema.parse(json);

    const profile = upsertLoyaltyProfile({
      userId: auth.id,
      profile: {
        businessName: data.businessName,
        joinCode: data.joinCode ? data.joinCode : undefined,
        logoUrl: data.logoUrl ? data.logoUrl : undefined,
      },
    });

    return Response.json({ ok: true, profile });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPDATE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
