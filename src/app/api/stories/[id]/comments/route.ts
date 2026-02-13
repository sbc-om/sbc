import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { 
  getStoryById, 
  addStoryComment, 
  deleteStoryComment,
  getStoryComments,
  getStoryCommentById,
} from "@/lib/db/stories";
import { getBusinessById } from "@/lib/db/businesses";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

const commentSchema = z.object({
  text: z.string().min(1).max(500),
});

/**
 * @swagger
 * /api/stories/{id}/comments:
 *   post:
 *     summary: Add a comment to a story
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
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

    const body = await req.json();
    const validation = commentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error.message }, { status: 400 });
    }

    const comment = await addStoryComment(storyId, user.id, validation.data.text);

    return NextResponse.json({ ok: true, data: comment }, { status: 201 });
  } catch (error: unknown) {
    console.error("[story-comment] Error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/stories/{id}/comments:
 *   get:
 *     summary: Get comments for a story
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *       401:
 *         description: Unauthorized
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

    const comments = await getStoryComments(storyId);

    return NextResponse.json({ ok: true, data: comments });
  } catch (error: unknown) {
    console.error("[story-comment] Error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/stories/{id}/comments:
 *   delete:
 *     summary: Delete a comment (comment owner, business owner, or admin)
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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

    const body = await req.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json({ ok: false, error: "commentId required" }, { status: 400 });
    }

    // Get the comment to check ownership
    const comment = await getStoryCommentById(commentId);
    if (!comment) {
      return NextResponse.json({ ok: false, error: "Comment not found" }, { status: 404 });
    }

    // Check if comment belongs to this story
    if (comment.storyId !== storyId) {
      return NextResponse.json({ ok: false, error: "Comment not found" }, { status: 404 });
    }

    // Get business to check ownership
    const business = await getBusinessById(story.businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    // Can delete if: comment owner, business owner, or admin
    const canDelete = 
      comment.userId === user.id || 
      business.ownerId === user.id || 
      user.role === "admin";

    if (!canDelete) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await deleteStoryComment(commentId);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[story-comment] Error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
