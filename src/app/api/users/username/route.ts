import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { isUsernameAvailable, setUserUsername } from "@/lib/db/users";

const setUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    ),
});

/**
 * @swagger
 * /api/users/username:
 *   get:
 *     summary: Get current user's username
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Username retrieved
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    username: user.username || null,
  });
}

/**
 * @swagger
 * /api/users/username:
 *   post:
 *     summary: Set or update username
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: ^[a-z0-9_]+$
 *     responses:
 *       200:
 *         description: Username set successfully
 *       400:
 *         description: Invalid username or username taken
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = setUsernameSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid username", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { username } = parsed.data;

    // Check availability (excluding current user)
    const available = await isUsernameAvailable(username, user.id);
    if (!available) {
      return NextResponse.json(
        { ok: false, error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Set the username
    await setUserUsername(user.id, username);

    return NextResponse.json({
      ok: true,
      username,
    });
  } catch (error) {
    console.error("[POST /api/users/username]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to set username" },
      { status: 500 }
    );
  }
}

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
 *         description: Availability status
 */
