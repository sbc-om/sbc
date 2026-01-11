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
  location: z
    .object({
      lat: z.number().finite().min(-90).max(90),
      lng: z.number().finite().min(-180).max(180),
      radiusMeters: z.number().int().min(25).max(20000),
      label: z.string().trim().min(1).max(200).optional(),
    })
    .optional(),
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
        location: data.location,
      },
    });

    return Response.json({ ok: true, profile });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPDATE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
