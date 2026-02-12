import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/lib/db/users';
import { getAuthCookieName, signAuthToken } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

const registerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  username: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User registration
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: +9647712345678
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: ^[a-z0-9_]+$
 *                 example: john_doe
 *                 description: Optional username (lowercase letters, numbers, and underscores)
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: password123
 *     responses:
 *       201:
 *         description: Registration successful
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
 *         description: Invalid request data or email already taken
 *       500:
 *         description: Server error
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, phone, fullName, username, password } = registerSchema.parse(body);

    let user;
    try {
      user = await createUser({ email, phone, fullName, username, password, role: 'user' });
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_TAKEN') {
        return NextResponse.json(
          { ok: false, error: 'Email already registered' },
          { status: 400 }
        );
      }
      if (error instanceof Error && error.message === 'PHONE_TAKEN') {
        return NextResponse.json(
          { ok: false, error: 'Phone already registered' },
          { status: 400 }
        );
      }
      if (error instanceof Error && error.message === 'USERNAME_TAKEN') {
        return NextResponse.json(
          { ok: false, error: 'Username already taken' },
          { status: 400 }
        );
      }
      if (error instanceof Error && error.message === 'INVALID_USERNAME') {
        return NextResponse.json(
          { ok: false, error: 'Invalid username format' },
          { status: 400 }
        );
      }
      throw error;
    }

    if (user.approvalStatus && user.approvalStatus !== 'approved') {
      return NextResponse.json(
        {
          ok: true,
          pendingApproval: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            displayName: user.displayName ?? user.email.split('@')[0],
          },
        },
        { status: 202 }
      );
    }

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const cookieName = getAuthCookieName();
    const secure = process.env.NODE_ENV === 'production';

    const response = NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName ?? user.email.split('@')[0],
        },
        token,
      },
      { status: 201 }
    );

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { ok: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
