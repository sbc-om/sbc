import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyUserPassword } from '@/lib/db/users';
import { getAuthCookieName, signAuthToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user with email or mobile and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Invalid credentials
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = loginSchema.parse(body);

    const user = await verifyUserPassword({ identifier, password });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email/phone or password' },
        { status: 401 }
      );
    }
    if (user.approvalStatus && user.approvalStatus !== 'approved') {
      return NextResponse.json(
        { ok: false, error: 'ACCOUNT_PENDING_APPROVAL' },
        { status: 403 }
      );
    }
    if (user.isActive === false) {
      return NextResponse.json(
        { ok: false, error: 'ACCOUNT_INACTIVE' },
        { status: 403 }
      );
    }

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const cookieName = getAuthCookieName();
    const secure = process.env.NODE_ENV === 'production';

    (await cookies()).set(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName ?? user.email.split('@')[0],
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { ok: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
