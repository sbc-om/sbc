import { cookies } from "next/headers";
import { z } from "zod";

import {
  getCurrentLoyaltyStaffSession,
  getLoyaltyStaffCookieName,
  signLoyaltyStaffSession,
} from "@/lib/auth/loyaltyStaffSession";
import { getLoyaltyStaffById, updateLoyaltyStaff } from "@/lib/db/loyaltyStaff";

export const runtime = "nodejs";

const updateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
  })
  .strict();

async function getAuthenticatedStaff() {
  const session = await getCurrentLoyaltyStaffSession();
  if (!session) return null;

  const staff = await getLoyaltyStaffById(session.staffId);
  if (!staff || !staff.isActive || staff.userId !== session.ownerUserId) return null;

  return { session, staff };
}

export async function GET() {
  const auth = await getAuthenticatedStaff();
  if (!auth) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  return Response.json({
    ok: true,
    staff: {
      id: auth.staff.id,
      fullName: auth.staff.fullName,
      avatarUrl: auth.staff.avatarUrl ?? null,
      phone: auth.staff.phone,
      joinCode: auth.session.joinCode,
    },
  });
}

export async function PATCH(req: Request) {
  const auth = await getAuthenticatedStaff();
  if (!auth) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const json = await req.json();
    const data = updateSchema.parse(json);

    const updated = await updateLoyaltyStaff(auth.staff.id, { fullName: data.fullName });

    const token = await signLoyaltyStaffSession({
      staffId: updated.id,
      ownerUserId: updated.userId,
      joinCode: auth.session.joinCode,
      phone: updated.phone,
      fullName: updated.fullName,
    });

    (await cookies()).set(getLoyaltyStaffCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return Response.json({
      ok: true,
      staff: {
        id: updated.id,
        fullName: updated.fullName,
        avatarUrl: updated.avatarUrl ?? null,
        phone: updated.phone,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPDATE_PROFILE_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
