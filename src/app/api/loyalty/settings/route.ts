import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  defaultLoyaltySettings,
  getLoyaltySettingsByUserId,
  upsertLoyaltySettings,
} from "@/lib/db/loyalty";

export const runtime = "nodejs";

const patchSchema = z
  .object({
    pointsRequiredPerRedemption: z.number().int().min(1).max(100000).optional(),
    pointsDeductPerRedemption: z.number().int().min(1).max(100000).optional(),
    pointsIconMode: z.enum(["logo", "custom"]).optional(),
    pointsIconUrl: z.string().trim().min(1).max(2048).optional(),

    walletPassDescription: z.string().trim().min(1).max(2000).optional(),
    walletPassTerms: z.string().trim().min(1).max(4000).optional(),
    walletWebsiteUrl: z.string().trim().min(1).max(2048).optional(),
    walletSupportEmail: z.string().trim().min(1).max(320).optional(),
    walletSupportPhone: z.string().trim().min(1).max(80).optional(),
    walletAddress: z.string().trim().min(1).max(400).optional(),
    walletBarcodeFormat: z.enum(["qr", "code128"]).optional(),
    walletBarcodeMessage: z.string().trim().min(1).max(2048).optional(),
    walletNotificationTitle: z.string().trim().min(1).max(140).optional(),
    walletNotificationBody: z.string().trim().min(1).max(1200).optional(),
  })
  .strict();

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  const existing = getLoyaltySettingsByUserId(auth.id);
  const settings = existing ?? defaultLoyaltySettings(auth.id);

  return Response.json({ ok: true, settings });
}

export async function PATCH(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) return new Response("Unauthorized", { status: 401 });

  try {
    const json = await req.json();
    const data = patchSchema.parse(json);

    const settings = upsertLoyaltySettings({
      userId: auth.id,
      settings: data,
    });

    return Response.json({ ok: true, settings });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPDATE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
