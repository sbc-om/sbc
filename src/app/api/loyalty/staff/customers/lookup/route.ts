import { z } from "zod";

import { getCurrentLoyaltyStaffSession } from "@/lib/auth/loyaltyStaffSession";
import {
  defaultLoyaltySettings,
  getLoyaltyProfileByJoinCode,
  getLoyaltySettingsByUserId,
  getLoyaltyCustomerById,
  getLoyaltyCustomerByMemberId,
  listLoyaltyCustomersByUser,
} from "@/lib/db/loyalty";

export const runtime = "nodejs";

const schema = z
  .object({
    joinCode: z.string().trim().min(1),
    query: z.string().trim().optional(),
    memberId: z.string().trim().optional(),
    customerId: z.string().trim().optional(),
    cardId: z.string().trim().optional(),
  })
  .strict();

export async function POST(req: Request) {
  try {
    const session = await getCurrentLoyaltyStaffSession();
    if (!session) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

    const json = await req.json();
    const data = schema.parse(json);

    if (session.joinCode !== data.joinCode) {
      return Response.json({ ok: false, error: "JOIN_CODE_MISMATCH" }, { status: 403 });
    }

    const profile = await getLoyaltyProfileByJoinCode(data.joinCode);
    if (!profile) return Response.json({ ok: false, error: "JOIN_CODE_NOT_FOUND" }, { status: 404 });
    if (profile.userId !== session.ownerUserId) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const settings = (await getLoyaltySettingsByUserId(profile.userId)) ?? defaultLoyaltySettings(profile.userId);

    let customer = null;
    if (data.customerId) {
      const found = await getLoyaltyCustomerById(data.customerId);
      if (found && found.userId === profile.userId) customer = found;
    } else if (data.memberId) {
      customer = await getLoyaltyCustomerByMemberId(profile.userId, data.memberId);
    } else if (data.cardId) {
      const all = await listLoyaltyCustomersByUser(profile.userId);
      customer = all.find((item) => item.cardId === data.cardId) ?? null;
    } else if (data.query) {
      const all = await listLoyaltyCustomersByUser(profile.userId);
      const needle = data.query.trim().toLowerCase();
      customer =
        all.find((item) =>
          [item.fullName, item.phone ?? "", item.email ?? "", item.memberId, item.cardId, item.id]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        ) ?? null;
    }

    return Response.json({
      ok: true,
      profile: {
        businessName: profile.businessName,
        logoUrl: profile.logoUrl,
        joinCode: profile.joinCode,
      },
      settings: {
        pointsRequiredPerRedemption: settings.pointsRequiredPerRedemption,
        pointsDeductPerRedemption: settings.pointsDeductPerRedemption,
      },
      customer: customer
        ? {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone,
            email: customer.email,
            points: customer.points,
            cardId: customer.cardId,
            memberId: customer.memberId,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "LOOKUP_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
