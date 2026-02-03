import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getStoryById, recordStoryView, getStoryViewers } from "@/lib/db/stories";
import { getBusinessById } from "@/lib/db/businesses";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/stories/{id}/view:
 *   post:
 *     summary: Record a view for a story
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: View recorded successfully
 *       401:
 *         description: Unauthorized
 */
export async function POST(
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

    // Check if story is expired
    if (new Date(story.expiresAt) < new Date()) {
      return NextResponse.json({ ok: false, error: "Story expired" }, { status: 410 });
    }

    await recordStoryView(storyId, user.id);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[story-view] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/stories/{id}/view:
 *   get:
 *     summary: Get viewers of a story (business owner or admin only)
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of viewers
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

    // Check ownership - only business owner or admin can see viewers
    const business = await getBusinessById(story.businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    if (business.ownerId !== user.id && user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const viewers = await getStoryViewers(storyId);

    return NextResponse.json({ ok: true, data: viewers });
  } catch (error: any) {
    console.error("[story-view] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
