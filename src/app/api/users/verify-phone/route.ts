/**
 * @swagger
 * /api/users/verify-phone:
 *   post:
 *     summary: Mark user phone as verified
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone verified successfully
 */
import { NextResponse, NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { setUserVerified } from "@/lib/db/users";

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    // Only allow users to verify themselves (or admin to verify anyone)
    if (currentUser.id !== userId && currentUser.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await setUserVerified(userId, true);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[VerifyPhone] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
