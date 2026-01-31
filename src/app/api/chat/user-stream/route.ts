import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Store active SSE connections per user
const userConnections = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Broadcast to a specific user (for sidebar updates, notifications, etc.)
 */
export function broadcastToUser(userId: string, data: any) {
  const listeners = userConnections.get(userId);
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
 * Broadcast to multiple users
 */
export function broadcastToUsers(userIds: string[], data: any) {
  for (const userId of userIds) {
    broadcastToUser(userId, data);
  }
}

/**
 * @swagger
 * /api/chat/user-stream:
 *   get:
 *     summary: SSE stream for user-level chat updates
 *     description: Server-Sent Events endpoint for receiving sidebar updates, new conversations, etc.
 *     tags: [Chat]
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

  const userId = user.id;

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add to connections map
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      userConnections.get(userId)!.add(controller);

      // Send initial connection message
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        const listeners = userConnections.get(userId);
        if (listeners) {
          listeners.delete(controller);
          if (listeners.size === 0) {
            userConnections.delete(userId);
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
