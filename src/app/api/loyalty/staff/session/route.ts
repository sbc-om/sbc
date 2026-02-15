import { getCurrentLoyaltyStaffSession } from "@/lib/auth/loyaltyStaffSession";
import { getLoyaltyProfileByJoinCode } from "@/lib/db/loyalty";
import { getLoyaltyStaffById } from "@/lib/db/loyaltyStaff";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const joinCode = url.searchParams.get("joinCode")?.trim();
  if (!joinCode) return Response.json({ ok: false, error: "JOIN_CODE_REQUIRED" }, { status: 400 });

  const session = await getCurrentLoyaltyStaffSession();
  if (!session) return Response.json({ ok: true, authenticated: false });
  if (session.joinCode !== joinCode) return Response.json({ ok: true, authenticated: false });

  const profile = await getLoyaltyProfileByJoinCode(joinCode);
  if (!profile) return Response.json({ ok: true, authenticated: false });

  const staff = await getLoyaltyStaffById(session.staffId);
  if (!staff || !staff.isActive || staff.userId !== profile.userId) {
    return Response.json({ ok: true, authenticated: false });
  }

  return Response.json({
    ok: true,
    authenticated: true,
    staff: {
      id: staff.id,
      fullName: staff.fullName,
      avatarUrl: staff.avatarUrl ?? null,
      phone: staff.phone,
      ownerUserId: staff.userId,
      joinCode,
    },
    business: {
      businessName: profile.businessName,
      logoUrl: profile.logoUrl,
      joinCode: profile.joinCode,
      userId: profile.userId,
    },
  });
}
