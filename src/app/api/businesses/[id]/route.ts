import { NextResponse } from 'next/server';
import { getBusinessBySlug, getBusinessById, deleteBusiness } from '@/lib/db/businesses';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { releaseProgramSubscriptionAssignmentByBusiness } from '@/lib/db/subscriptions';

export const runtime = 'nodejs';

/**
 * @swagger
 * /api/businesses/{id}:
 *   get:
 *     tags:
 *       - Businesses
 *     summary: Get business by ID or slug
 *     description: Retrieve a specific business by its ID or URL slug
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Business ID or slug
 *         schema:
 *           type: string
 *           example: pearl-salon-spa
 *     responses:
 *       200:
 *         description: Business found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 business:
 *                   $ref: '#/components/schemas/Business'
 *       404:
 *         description: Business not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try slug first, then ID
    let business = getBusinessBySlug(id);
    if (!business) {
      business = getBusinessById(id);
    }

    if (!business) {
      return NextResponse.json(
        { ok: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      business,
    });
  } catch (error) {
    console.error('Get business error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to get business' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const business = await getBusinessById(id);
    if (!business) {
      return NextResponse.json(
        { ok: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // Only the owner or an admin can delete
    if (business.ownerId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await releaseProgramSubscriptionAssignmentByBusiness(id);
    await deleteBusiness(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete business error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete business' },
      { status: 500 }
    );
  }
}
