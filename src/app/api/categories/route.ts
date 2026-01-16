import { NextResponse } from 'next/server';
import { listCategories } from '@/lib/db/categories';

export const runtime = 'nodejs';

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: List all categories
 *     description: Get all business categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
export async function GET() {
  try {
    const categories = listCategories();

    return NextResponse.json({
      ok: true,
      categories,
    });
  } catch (error) {
    console.error('List categories error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to list categories' },
      { status: 500 }
    );
  }
}
