import { z } from "zod";

import { createOTP, hasRecentOTP } from "@/lib/db/otp";
import { getLoyaltyProfileByJoinCode } from "@/lib/db/loyalty";
import { getLoyaltyStaffByUserAndPhone } from "@/lib/db/loyaltyStaff";
import { isWAHAEnabled, sendOTP } from "@/lib/waha/client";

export const runtime = "nodejs";

const schema = z
  .object({
    joinCode: z.string().trim().min(1),
    phone: z.string().trim().min(8).max(40),
    locale: z.enum(["en", "ar"]).default("en"),
  })
  .strict();

function mapSendOtpError(error: unknown): { code: string; status: number } {
  if (error instanceof z.ZodError) return { code: "INVALID_PAYLOAD", status: 400 };

  const message = error instanceof Error ? error.message : "SEND_OTP_FAILED";

  if (
    message.includes("WhatsApp API error") ||
    message.includes("WhatsApp is not enabled") ||
    message.includes("Failed to fetch")
  ) {
    return { code: "WHATSAPP_SEND_FAILED", status: 502 };
  }

  return { code: "SEND_OTP_FAILED", status: 500 };
}

export async function POST(req: Request) {
  if (!isWAHAEnabled()) {
    return Response.json({ ok: false, error: "WAHA_DISABLED" }, { status: 503 });
  }

  try {
    const json = await req.json();
    const data = schema.parse(json);

    const profile = await getLoyaltyProfileByJoinCode(data.joinCode);
    if (!profile) return Response.json({ ok: false, error: "JOIN_CODE_NOT_FOUND" }, { status: 400 });

    const staff = await getLoyaltyStaffByUserAndPhone(profile.userId, data.phone);
    if (!staff) {
      return Response.json({ ok: false, error: "STAFF_NOT_FOUND" }, { status: 400 });
    }
    if (!staff.isActive) {
      return Response.json({ ok: false, error: "STAFF_INACTIVE" }, { status: 403 });
    }

    const rateLimited = await hasRecentOTP(data.phone, "phone_verification");
    if (rateLimited) {
      return Response.json({ ok: false, error: "OTP_RATE_LIMIT" }, { status: 429 });
    }

    // OTP user_id must reference users(id). Bind to loyalty owner user id (not staff id).
    const otp = await createOTP(data.phone, "phone_verification", profile.userId);
    await sendOTP(data.phone, otp.code, data.locale);

    return Response.json({ ok: true, expiresIn: 120 });
  } catch (error) {
    const mapped = mapSendOtpError(error);
    return Response.json({ ok: false, error: mapped.code }, { status: mapped.status });
  }
}
