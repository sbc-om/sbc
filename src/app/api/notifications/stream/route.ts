import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getLatestUserNotification, getUnreadNotificationCount } from "@/lib/db/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notificationConnections = new Map<string, Set<ReadableStreamDefaultController>>();

export type NotificationStreamEvent =
  | { type: "connected"; unreadCount: number }
  | { type: "read"; unreadCount: number }
  | { type: "new"; unreadCount: number; title: string; body: string; href?: string };

export function broadcastNotificationEvent(userId: string, event: NotificationStreamEvent) {
  const listeners = notificationConnections.get(userId);
  if (!listeners) return;

  const payload = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = new TextEncoder().encode(payload);

  for (const controller of listeners) {
    try {
      controller.enqueue(encoded);
    } catch {
      // closed connection; cleanup happens on abort
    }
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const userId = user.id;
  const initialUnread = await getUnreadNotificationCount(userId);
  const latestInitial = await getLatestUserNotification(userId);

  const stream = new ReadableStream({
    start(controller) {
      if (!notificationConnections.has(userId)) {
        notificationConnections.set(userId, new Set());
      }
      notificationConnections.get(userId)!.add(controller);

      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ type: "connected", unreadCount: initialUnread })}\n\n`
        )
      );

      let lastUnread = initialUnread;
      let lastLatestId = latestInitial?.id ?? null;

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      const pollInterval = setInterval(async () => {
        try {
          const [unreadCount, latest] = await Promise.all([
            getUnreadNotificationCount(userId),
            getLatestUserNotification(userId),
          ]);

          const latestId = latest?.id ?? null;

          if (latest && latestId !== lastLatestId && unreadCount >= lastUnread) {
            const payload: NotificationStreamEvent = {
              type: "new",
              unreadCount,
              title: latest.title,
              body: latest.body,
              href: latest.href,
            };
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
            lastLatestId = latestId;
            lastUnread = unreadCount;
            return;
          }

          if (unreadCount !== lastUnread) {
            const payload: NotificationStreamEvent = {
              type: unreadCount < lastUnread ? "read" : "connected",
              unreadCount,
            };
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
            lastUnread = unreadCount;
          }

          lastLatestId = latestId;
        } catch {
          // keep stream alive; next tick will retry
        }
      }, 1500);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clearInterval(pollInterval);
        const listeners = notificationConnections.get(userId);
        if (listeners) {
          listeners.delete(controller);
          if (listeners.size === 0) notificationConnections.delete(userId);
        }
        try {
          controller.close();
        } catch {
          // already closed
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
