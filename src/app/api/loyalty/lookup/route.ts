import { z } from "zod";
import {
  defaultLoyaltySettings,
  getLoyaltyProfileByJoinCode,
  getLoyaltyCustomerByMemberId,
  getLoyaltySettingsByUserId,
} from "@/lib/db/loyalty";

export const runtime = "nodejs";

const lookupSchema = z.object({
  joinCode: z.string().trim().min(1),
  memberId: z.string().trim().optional(),
});

/**
 * Public lookup endpoint:
 * 1. Find business by joinCode
 * 2. Optionally find customer by phone (if provided)
 */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = lookupSchema.parse(json);

    // Find business profile
    const profile = await getLoyaltyProfileByJoinCode(data.joinCode);
    if (!profile) {
      return Response.json(
        { ok: false, error: "BUSINESS_NOT_FOUND" },
        { status: 404 }
      );
    }

    const settings = (await getLoyaltySettingsByUserId(profile.userId)) ?? defaultLoyaltySettings(profile.userId);
    const pointsIconUrl = settings.pointsIconMode === "custom" ? settings.pointsIconUrl : profile.logoUrl;

    // If memberId is provided, search for customer
    let customer = null;
    if (data.memberId) {
      customer = await getLoyaltyCustomerByMemberId(profile.userId, data.memberId);
    }

    return Response.json({
      ok: true,
      profile: {
        businessName: profile.businessName,
        logoUrl: profile.logoUrl,
        joinCode: profile.joinCode,
        pointsIconUrl,
      },
      customer: customer
        ? {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            points: customer.points,
            cardId: customer.cardId,
          }
        : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "LOOKUP_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
