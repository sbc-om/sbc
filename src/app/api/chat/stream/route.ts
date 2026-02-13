import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getConversationById } from "@/lib/db/chats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Store active SSE connections per conversation
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Broadcast a message to all listeners of a conversation
 */
export function broadcastToConversation(conversationId: string, data: unknown) {
  const listeners = connections.get(conversationId);
  if (!listeners) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  
  for (const controller of listeners) {
    try {
      controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      // Connection closed, will be cleaned up
    }
  }
}

/**
 * @swagger
 * /api/chat/stream:
 *   get:
 *     summary: SSE stream for real-time chat messages
 *     description: Server-Sent Events endpoint for receiving real-time chat updates
 *     tags: [Chat]
 *     parameters:
 *       - name: conversationId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSE stream
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const conversationId = url.searchParams.get("conversationId");

  if (!conversationId) {
    return new Response("Missing conversationId", { status: 400 });
  }

  // Verify user is part of conversation
  const conversation = await getConversationById(conversationId);
  if (!conversation || !conversation.participantIds.includes(user.id)) {
    return new Response("Not authorized for this conversation", { status: 403 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add to connections map
      if (!connections.has(conversationId)) {
        connections.set(conversationId, new Set());
      }
      connections.get(conversationId)!.add(controller);

      // Send initial connection message
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        const listeners = connections.get(conversationId);
        if (listeners) {
          listeners.delete(controller);
          if (listeners.size === 0) {
            connections.delete(conversationId);
          }
        }
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
