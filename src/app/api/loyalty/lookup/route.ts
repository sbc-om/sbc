import { z } from "zod";
import {
  getLoyaltyProfileByJoinCode,
  getLoyaltyCustomerByPhone,
} from "@/lib/db/loyalty";

export const runtime = "nodejs";

const lookupSchema = z.object({
  joinCode: z.string().trim().min(1),
  phone: z.string().trim().optional(),
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
    const profile = getLoyaltyProfileByJoinCode(data.joinCode);
    if (!profile) {
      return Response.json(
        { ok: false, error: "BUSINESS_NOT_FOUND" },
        { status: 404 }
      );
    }

    // If phone is provided, search for customer
    let customer = null;
    if (data.phone) {
      customer = getLoyaltyCustomerByPhone({
        userId: profile.userId,
        phone: data.phone,
      });
    }

    return Response.json({
      ok: true,
      profile: {
        businessName: profile.businessName,
        logoUrl: profile.logoUrl,
        joinCode: profile.joinCode,
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
