/**
 * Wallet SSE Stream API
 * GET /api/wallet/stream - Real-time wallet updates stream
 */
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Store active SSE connections per user for wallet updates
const walletConnections = new Map<string, Set<ReadableStreamDefaultController>>();

export type WalletEventType = 
  | "connected"
  | "deposit"
  | "withdraw_approved"
  | "withdraw_rejected"
  | "transfer_in"
  | "transfer_out"
  | "balance_update";

export interface WalletEvent {
  type: WalletEventType;
  amount?: number;
  balance?: number;
  description?: string;
  fromUser?: string;
  toUser?: string;
  message?: string;
}

/**
 * Broadcast wallet event to a specific user
 */
export function broadcastWalletEvent(userId: string, event: WalletEvent) {
  const listeners = walletConnections.get(userId);
  if (!listeners) return;

  const payload = `data: ${JSON.stringify(event)}\n\n`;
  
  for (const controller of listeners) {
    try {
      controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      // Connection closed, will be cleaned up
    }
  }
}

/**
 * GET /api/wallet/stream - SSE endpoint for wallet updates
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
      if (!walletConnections.has(userId)) {
        walletConnections.set(userId, new Set());
      }
      walletConnections.get(userId)!.add(controller);

      // Send initial connection message
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        const listeners = walletConnections.get(userId);
        if (listeners) {
          listeners.delete(controller);
          if (listeners.size === 0) {
            walletConnections.delete(userId);
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
