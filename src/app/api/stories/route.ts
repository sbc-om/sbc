import { NextRequest, NextResponse } from "next/server";
import { listBusinessesWithActiveStories } from "@/lib/db/stories";

export const runtime = "nodejs";

/**
 * @swagger
 * /api/stories:
 *   get:
 *     summary: List businesses with active stories
 *     description: Returns all businesses that have active (not expired) stories
 *     tags: [Stories]
 *     responses:
 *       200:
 *         description: List of businesses with their stories
 */
export async function GET(req: NextRequest) {
  try {
    const businessesWithStories = await listBusinessesWithActiveStories();
    return NextResponse.json({ ok: true, data: businessesWithStories });
  } catch (error: any) {
    console.error("[stories] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
