import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getStoryById, getStoryStats } from "@/lib/db/stories";
import { getBusinessById } from "@/lib/db/businesses";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/stories/{id}/stats:
 *   get:
 *     summary: Get full stats for a story (viewers, likers, comments) - business owner or admin only
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Story stats with viewers, likers, and comments
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

    const { id: storyId } = await params;
    const story = await getStoryById(storyId);
    
    if (!story) {
      return NextResponse.json({ ok: false, error: "Story not found" }, { status: 404 });
    }

    // Check ownership - only business owner or admin can see full stats
    const business = await getBusinessById(story.businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    if (business.ownerId !== user.id && user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const stats = await getStoryStats(storyId);

    return NextResponse.json({ 
      ok: true, 
      data: {
        story,
        stats,
      }
    });
  } catch (error: any) {
    console.error("[story-stats] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
