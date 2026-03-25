import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyOTP } from "@/lib/db/otp";
import { getLoyaltyProfileByJoinCode, listLoyaltyCustomerCardsByPhone } from "@/lib/db/loyalty";

export const runtime = "nodejs";

const verifySchema = z.object({
  joinCode: z.string().trim().min(1),
  phone: z.string().trim().min(8).max(20),
  code: z.string().trim().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_REQUEST", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { joinCode, phone, code } = parsed.data;

    const profile = await getLoyaltyProfileByJoinCode(joinCode);
    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "BUSINESS_NOT_FOUND" },
        { status: 404 }
      );
    }

    const verification = await verifyOTP(phone, code, "loyalty_customer_login");

    if (!verification.success) {
      const errorMap: Record<string, string> = {
        OTP_NOT_FOUND: "OTP_NOT_FOUND",
        MAX_ATTEMPTS_EXCEEDED: "MAX_ATTEMPTS_EXCEEDED",
        INVALID_CODE: "INVALID_CODE",
      };
      return NextResponse.json(
        { ok: false, error: errorMap[verification.error ?? ""] || "VERIFY_FAILED" },
        { status: 401 }
      );
    }

    const cards = (await listLoyaltyCustomerCardsByPhone(phone)).filter(
      (card) => card.userId === profile.userId
    );
    if (!cards.length) {
      return NextResponse.json(
        { ok: false, error: "NO_CARDS_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      cards: cards.map((card) => ({
        cardId: card.cardId,
        customerName: card.customerName,
        points: card.points,
        businessName: card.businessName,
        businessLogoUrl: card.businessLogoUrl,
      })),
    });
  } catch (error) {
    console.error("[Loyalty Customer Auth] Verify error:", error);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
