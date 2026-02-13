import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessById } from "@/lib/db/businesses";
import { getBusinessStoriesStats } from "@/lib/db/stories";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/businesses/{id}/stories/stats:
 *   get:
 *     summary: Get stats for all stories of a business (business owner or admin only)
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business stories stats
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the business owner
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const business = await getBusinessById(businessId);
    
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    // Check ownership - only business owner or admin can see stats
    if (business.ownerId !== user.id && user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const stats = await getBusinessStoriesStats(businessId);

    return NextResponse.json({ ok: true, data: stats });
  } catch (error: unknown) {
    console.error("[business-stories-stats] Error:", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
