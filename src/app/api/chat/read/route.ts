import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { markMessagesAsRead, getConversationById } from "@/lib/db/chats";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { broadcastToConversation } from "../stream/route";
import { broadcastToUsers } from "../user-stream/route";

const schema = z.object({
  conversationId: z.string().min(1),
});

/**
 * @swagger
 * /api/chat/read:
 *   post:
 *     summary: Mark messages as read
 *     description: Mark all unread messages in a conversation as read
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = schema.parse(body);

    // Verify user is part of conversation
    const conv = await getConversationById(data.conversationId);
    if (!conv || !conv.participantIds.includes(user.id)) {
      return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
    }

    const count = await markMessagesAsRead(data.conversationId, user.id);

    if (count > 0) {
      // Broadcast read status to conversation (for sender to see double ticks)
      broadcastToConversation(data.conversationId, {
        type: "messages_read",
        conversationId: data.conversationId,
        readBy: user.id,
        readAt: new Date().toISOString(),
      });

      // Broadcast to user's sidebar to update unread count
      broadcastToUsers(conv.participantIds, {
        type: "messages_read",
        conversationId: data.conversationId,
        readBy: user.id,
      });
    }

    return NextResponse.json({ ok: true, count });
  } catch (error: any) {
    console.error("[POST /api/chat/read]", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to mark as read" },
      { status: 400 }
    );
  }
}
