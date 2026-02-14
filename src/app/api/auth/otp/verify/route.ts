/**
 * @swagger
 * /api/auth/otp/verify:
 *   post:
 *     summary: Verify OTP code and login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:
 *                 type: string
 *               code:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [login, registration, phone_verification]
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid code or request
 *       401:
 *         description: OTP verification failed
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOTP, type OTPPurpose } from "@/lib/db/otp";
import { getUserByPhone, setUserPhoneVerified } from "@/lib/db/users";
import { signAuthToken, getAuthCookieName } from "@/lib/auth/jwt";
import { isWhatsAppLoginEnabled } from "@/lib/db/settings";
import { sendLoginNotification, isWAHAEnabled } from "@/lib/waha/client";

const verifyOTPSchema = z.object({
  phone: z.string().min(8).max(15),
  code: z.string().length(6),
  purpose: z.enum(["login", "registration", "phone_verification"]).default("login"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyOTPSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { phone, code, purpose } = parsed.data;

    // Check if login via OTP is enabled
    if (purpose === "login") {
      const loginEnabled = await isWhatsAppLoginEnabled();
      if (!loginEnabled) {
        return NextResponse.json(
          { ok: false, error: "WhatsApp login is disabled" },
          { status: 403 }
        );
      }
    }

    // Verify OTP
    const result = await verifyOTP(phone, code, purpose as OTPPurpose);
    
    if (!result.success) {
      const errorMessages: Record<string, string> = {
        OTP_NOT_FOUND: "No valid OTP found. Please request a new code.",
        MAX_ATTEMPTS_EXCEEDED: "Too many failed attempts. Please request a new code.",
        INVALID_CODE: "Invalid code. Please try again.",
      };

      return NextResponse.json(
        { ok: false, error: errorMessages[result.error!] || "Verification failed" },
        { status: 401 }
      );
    }

    // For login purpose, create session
    if (purpose === "login") {
      const user = await getUserByPhone(phone);
      
      if (!user) {
        return NextResponse.json(
          { ok: false, error: "User not found" },
          { status: 404 }
        );
      }

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

      // If user logged in via WhatsApp OTP, mark their phone as verified
      if (!user.isPhoneVerified) {
        await setUserPhoneVerified(user.id, true);
      }

      // Create JWT token
      const token = await signAuthToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      // Send login notification (non-blocking)
      if (isWAHAEnabled() && user.phone) {
        sendLoginNotification(user.phone, "en", "whatsapp").catch(console.error);
      }

      // Phone is now verified since user logged in with WhatsApp OTP
      const cookieName = getAuthCookieName();
      const response = NextResponse.json({
        ok: true,
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName || user.fullName,
          role: user.role,
          isVerified: user.isVerified,
          isPhoneVerified: true,
        },
        needsVerification: false,
      });

      // Set cookie directly on the response so the Set-Cookie header is sent
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }

    // For other purposes, just return success
    if (purpose === "phone_verification") {
      const user = await getUserByPhone(phone);
      if (user && !user.isPhoneVerified) {
        await setUserPhoneVerified(user.id, true);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "OTP verified successfully",
      verified: true,
    });

  } catch (error) {
    console.error("[OTP] Verify error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
