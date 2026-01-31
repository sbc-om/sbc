import { NextRequest, NextResponse } from "next/server";
import { getCategoryById } from "@/lib/db/categories";

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Returns a category by its ID
 *     tags: [Categories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         description: Category not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await getCategoryById(id);

    if (!category) {
      return NextResponse.json({ ok: false, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, category });
  } catch (error) {
    console.error("[GET /api/categories/[id]]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
