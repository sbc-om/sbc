import { NextResponse } from 'next/server';
import { getAuthCookieName } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User logout
 *     description: Clear authentication session
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 */
export async function POST() {
  const cookieName = getAuthCookieName();

  const response = NextResponse.json({
    ok: true,
    message: 'Logged out successfully',
  });

  response.cookies.set(cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });

  return response;
}
