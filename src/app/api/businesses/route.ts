import { NextResponse } from 'next/server';
import { listBusinesses } from '@/lib/db/businesses';

export const runtime = 'nodejs';

/**
 * @swagger
 * /api/businesses:
 *   get:
 *     tags:
 *       - Businesses
 *     summary: List businesses
 *     description: Get a list of all businesses with optional search
 *     parameters:
 *       - name: q
 *         in: query
 *         description: Search query (searches name, category, city, tags)
 *         required: false
 *         schema:
 *           type: string
 *           example: salon
 *       - name: locale
 *         in: query
 *         description: Preferred language for search (en, ar, fa)
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, ar, fa]
 *           example: en
 *     responses:
 *       200:
 *         description: List of businesses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 businesses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Business'
 *                 count:
 *                   type: integer
 *                   example: 42
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || undefined;
    const localeParam = url.searchParams.get('locale') || 'en';
    const locale = (localeParam === 'en' || localeParam === 'ar') ? localeParam : 'en';

    const businesses = listBusinesses({ q, locale });

    return NextResponse.json({
      ok: true,
      businesses,
      count: businesses.length,
    });
  } catch (error) {
    console.error('List businesses error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to list businesses' },
      { status: 500 }
    );
  }
}
