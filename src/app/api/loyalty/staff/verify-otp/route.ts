import { cookies } from "next/headers";
import { z } from "zod";

import { verifyOTP } from "@/lib/db/otp";
import { getLoyaltyProfileByJoinCode } from "@/lib/db/loyalty";
import {
  getLoyaltyStaffById,
  getLoyaltyStaffByUserAndPhone,
  markLoyaltyStaffLogin,
  updateLoyaltyStaff,
} from "@/lib/db/loyaltyStaff";
import {
  getLoyaltyStaffCookieName,
  signLoyaltyStaffSession,
} from "@/lib/auth/loyaltyStaffSession";

export const runtime = "nodejs";

const schema = z
  .object({
    joinCode: z.string().trim().min(1),
    phone: z.string().trim().min(8).max(40),
    code: z.string().trim().length(6),
  })
  .strict();

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const data = schema.parse(json);

    const profile = await getLoyaltyProfileByJoinCode(data.joinCode);
    if (!profile) return Response.json({ ok: false, error: "JOIN_CODE_NOT_FOUND" }, { status: 400 });

    const staff = await getLoyaltyStaffByUserAndPhone(profile.userId, data.phone);
    if (!staff || !staff.isActive) {
      return Response.json({ ok: false, error: "STAFF_NOT_FOUND" }, { status: 401 });
    }

    const verified = await verifyOTP(data.phone, data.code, "phone_verification");
    if (!verified.success) {
      return Response.json({ ok: false, error: verified.error || "INVALID_CODE" }, { status: 401 });
    }

    if (verified.userId && verified.userId !== profile.userId) {
      return Response.json({ ok: false, error: "OTP_USER_MISMATCH" }, { status: 401 });
    }

    await updateLoyaltyStaff(staff.id, { isVerified: true });
    await markLoyaltyStaffLogin(staff.id);

    const refreshed = await getLoyaltyStaffById(staff.id);
    if (!refreshed) return Response.json({ ok: false, error: "STAFF_NOT_FOUND" }, { status: 401 });

    const token = await signLoyaltyStaffSession({
      staffId: refreshed.id,
      ownerUserId: refreshed.userId,
      joinCode: profile.joinCode,
      phone: refreshed.phone,
      fullName: refreshed.fullName,
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
        id: refreshed.id,
        fullName: refreshed.fullName,
        avatarUrl: refreshed.avatarUrl ?? null,
        phone: refreshed.phone,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "VERIFY_OTP_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
