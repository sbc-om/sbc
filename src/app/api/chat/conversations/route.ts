import { NextRequest, NextResponse } from "next/server";
import { getUserConversations } from "@/lib/db/chats";
import { getCurrentUser } from "@/lib/auth/currentUser";

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: List user conversations
 *     description: Returns all conversations for the authenticated user
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: List of conversations with business details
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await getUserConversations(user.id);
    
    // Return conversations as-is (participantIds-based model)
    return NextResponse.json({ ok: true, conversations });
  } catch (error) {
    console.error("[GET /api/chat/conversations]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
