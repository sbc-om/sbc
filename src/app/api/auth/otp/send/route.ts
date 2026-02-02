/**
 * @swagger
 * /api/auth/otp/send:
 *   post:
 *     summary: Send OTP code via WhatsApp
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [login, registration, phone_verification]
 *               locale:
 *                 type: string
 *                 enum: [en, ar]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid request or rate limited
 *       503:
 *         description: WhatsApp service not available
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOTP, hasRecentOTP, type OTPPurpose } from "@/lib/db/otp";
import { getUserByPhone } from "@/lib/db/users";
import { isWhatsAppLoginEnabled, isWhatsAppVerificationRequired } from "@/lib/db/settings";
import { sendOTP, isWAHAEnabled } from "@/lib/waha/client";

const sendOTPSchema = z.object({
  phone: z.string().min(8).max(15),
  purpose: z.enum(["login", "registration", "phone_verification"]).default("login"),
  locale: z.enum(["en", "ar"]).default("en"),
});

export async function POST(request: NextRequest) {
  try {
    // Check if WAHA is enabled
    if (!isWAHAEnabled()) {
      return NextResponse.json(
        { ok: false, error: "WhatsApp service is not available" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = sendOTPSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { phone, purpose, locale } = parsed.data;

    // Check settings based on purpose
    if (purpose === "login") {
      const loginEnabled = await isWhatsAppLoginEnabled();
      if (!loginEnabled) {
        return NextResponse.json(
          { ok: false, error: "WhatsApp login is disabled" },
          { status: 403 }
        );
      }

      // For login, user must exist
      const user = await getUserByPhone(phone);
      if (!user) {
        return NextResponse.json(
          { ok: false, error: "No account found with this phone number" },
          { status: 404 }
        );
      }

      // Check if user is active and approved
      if (!user.isActive) {
        return NextResponse.json(
          { ok: false, error: "Account is deactivated" },
          { status: 403 }
        );
      }

      if (user.approvalStatus !== "approved") {
        return NextResponse.json(
          { ok: false, error: "Account is pending approval" },
          { status: 403 }
        );
      }
    }

    if (purpose === "registration" || purpose === "phone_verification") {
      const verificationRequired = await isWhatsAppVerificationRequired();
      if (!verificationRequired) {
        return NextResponse.json(
          { ok: false, error: "Phone verification is disabled" },
          { status: 403 }
        );
      }
    }

    // Rate limiting: check if OTP was sent recently
    const hasRecent = await hasRecentOTP(phone, purpose as OTPPurpose);
    if (hasRecent) {
      return NextResponse.json(
        { ok: false, error: "Please wait before requesting another code" },
        { status: 429 }
      );
    }

    // Get user ID if exists (for login purpose)
    let userId: string | undefined;
    if (purpose === "login") {
      const user = await getUserByPhone(phone);
      userId = user?.id;
    }

    // Create OTP
    const otp = await createOTP(phone, purpose as OTPPurpose, userId);

    // Send OTP via WhatsApp
    try {
      await sendOTP(phone, otp.code, locale);
    } catch (error) {
      console.error("[OTP] Failed to send WhatsApp message:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to send WhatsApp message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "OTP sent successfully",
      expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10) * 60,
    });

  } catch (error) {
    console.error("[OTP] Send error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
