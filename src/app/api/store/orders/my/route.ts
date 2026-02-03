import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { listUserOrders } from "@/lib/db/orders";

/**
 * @swagger
 * /api/store/orders/my:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const orders = await listUserOrders(user.id);

    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("Failed to fetch user orders:", error);
    return NextResponse.json(
      { ok: false, error: "FETCH_FAILED" },
      { status: 500 }
    );
  }
}
