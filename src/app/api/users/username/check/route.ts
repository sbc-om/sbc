import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { isUsernameAvailable } from "@/lib/db/users";

const checkSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
});

/**
 * @swagger
 * /api/users/username/check:
 *   get:
 *     summary: Check if username is available
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Availability check result
 *       400:
 *         description: Invalid username format
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.toLowerCase();

  if (!username) {
    return NextResponse.json(
      { ok: false, error: "Username is required" },
      { status: 400 }
    );
  }

  const parsed = checkSchema.safeParse({ username });
  if (!parsed.success) {
    return NextResponse.json(
      { 
        ok: false, 
        available: false,
        error: "Invalid username format",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  const available = await isUsernameAvailable(username, user?.id);

  return NextResponse.json({
    ok: true,
    username,
    available,
  });
}
