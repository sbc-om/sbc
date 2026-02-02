/**
 * @swagger
 * /api/auth/otp/status:
 *   get:
 *     summary: Get WhatsApp OTP authentication status
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OTP authentication status
 */
import { NextResponse } from "next/server";
import { isWhatsAppLoginEnabled, isWhatsAppVerificationRequired } from "@/lib/db/settings";
import { isWAHAEnabled } from "@/lib/waha/client";

export async function GET() {
  try {
    const wahaEnabled = isWAHAEnabled();
    const loginEnabled = wahaEnabled ? await isWhatsAppLoginEnabled() : false;
    const verificationRequired = wahaEnabled ? await isWhatsAppVerificationRequired() : false;

    return NextResponse.json({
      ok: true,
      whatsapp: {
        available: wahaEnabled,
        loginEnabled,
        verificationRequired,
      },
    });
  } catch (error) {
    console.error("[OTP] Status error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
