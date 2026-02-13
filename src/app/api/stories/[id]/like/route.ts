import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { 
  getStoryById, 
  likeStory, 
  unlikeStory, 
  getStoryLikers, 
  hasUserLikedStory,
  getStoryLikeCount 
} from "@/lib/db/stories";
import { getBusinessById } from "@/lib/db/businesses";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

/**
 * @swagger
 * /api/stories/{id}/like:
 *   post:
 *     summary: Like a story
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Story liked successfully
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

    const liked = await likeStory(storyId, user.id);
    const likeCount = await getStoryLikeCount(storyId);

    return NextResponse.json({ 
      ok: true, 
      data: { liked, likeCount } 
    });
  } catch (error: unknown) {
    console.error("[story-like] Error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/stories/{id}/like:
 *   delete:
 *     summary: Unlike a story
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Story unliked successfully
 *       401:
 *         description: Unauthorized
 */
export async function DELETE(
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

    await unlikeStory(storyId, user.id);
    const likeCount = await getStoryLikeCount(storyId);

    return NextResponse.json({ 
      ok: true, 
      data: { liked: false, likeCount } 
    });
  } catch (error: unknown) {
    console.error("[story-like] Error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/stories/{id}/like:
 *   get:
 *     summary: Get likers of a story (business owner or admin only)
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of likers
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

    // Check ownership - only business owner or admin can see all likers
    const business = await getBusinessById(story.businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    const isOwnerOrAdmin = business.ownerId === user.id || user.role === "admin";

    if (isOwnerOrAdmin) {
      // Return full list for owner/admin
      const likers = await getStoryLikers(storyId);
      const userLiked = await hasUserLikedStory(storyId, user.id);
      return NextResponse.json({ 
        ok: true, 
        data: { likers, userLiked, likeCount: likers.length } 
      });
    } else {
      // Return only like count and user's like status for regular users
      const [likeCount, userLiked] = await Promise.all([
        getStoryLikeCount(storyId),
        hasUserLikedStory(storyId, user.id),
      ]);
      return NextResponse.json({ 
        ok: true, 
        data: { userLiked, likeCount } 
      });
    }
  } catch (error: unknown) {
    console.error("[story-like] Error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
