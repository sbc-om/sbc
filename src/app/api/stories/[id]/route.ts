import { NextRequest, NextResponse } from "next/server";
import { getStoryById, incrementStoryViewCount } from "@/lib/db/stories";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

/**
 * @swagger
 * /api/stories/{id}:
 *   get:
 *     summary: Get story by ID
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Story data
 *       404:
 *         description: Story not found
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const story = await getStoryById(id);
    
    if (!story) {
      return NextResponse.json({ ok: false, error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: story });
  } catch (error: unknown) {
    console.error("[stories] Error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/stories/{id}:
 *   post:
 *     summary: Increment story view count
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: View count incremented
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await incrementStoryViewCount(id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[stories] Error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
