import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createOTP, hasRecentOTP } from "@/lib/db/otp";
import { getLoyaltyProfileByJoinCode } from "@/lib/db/loyalty";
import { isWAHAEnabled, sendLoyaltyCardAccessCode } from "@/lib/waha/client";

export const runtime = "nodejs";

const sendSchema = z.object({
  joinCode: z.string().trim().min(1),
  phone: z.string().trim().min(8).max(20),
  locale: z.enum(["en", "ar"]).default("en"),
});

export async function POST(req: NextRequest) {
  try {
    if (!isWAHAEnabled()) {
      return NextResponse.json(
        { ok: false, error: "WHATSAPP_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { joinCode, phone, locale } = parsed.data;

    const profile = await getLoyaltyProfileByJoinCode(joinCode);
    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "BUSINESS_NOT_FOUND" },
        { status: 404 }
      );
    }

    const hasRecent = await hasRecentOTP(phone, "loyalty_customer_login");
    if (hasRecent) {
      return NextResponse.json(
        { ok: false, error: "TOO_MANY_REQUESTS" },
        { status: 429 }
      );
    }

    const otp = await createOTP(phone, "loyalty_customer_login");

    try {
      await sendLoyaltyCardAccessCode(phone, otp.code, locale);
    } catch (error) {
      console.error("[Loyalty Customer Auth] Failed to send OTP:", error);
      return NextResponse.json(
        { ok: false, error: "SEND_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      expiresIn: 120,
    });
  } catch (error) {
    console.error("[Loyalty Customer Auth] Send error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
