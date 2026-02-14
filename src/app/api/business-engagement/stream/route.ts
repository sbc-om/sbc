import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessEngagementCounts } from "@/lib/db/businessEngagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EngagementCounts = Record<string, { likes: number; comments: number }>;

type EngagementEvent =
  | { type: "connected"; counts: EngagementCounts }
  | { type: "update"; counts: EngagementCounts };

function parseBusinessIds(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get("ids") || "";
  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value.length >= 8 && value.length <= 64)
    .slice(0, 80);

  return Array.from(new Set(ids));
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const ids = parseBusinessIds(request.nextUrl.searchParams);
  if (ids.length === 0) {
    return new Response("Missing ids", { status: 400 });
  }

  const initialCounts = await getBusinessEngagementCounts(ids);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: EngagementEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      send({ type: "connected", counts: initialCounts });

      let lastPayload = JSON.stringify(initialCounts);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      const poll = setInterval(async () => {
        try {
          const counts = await getBusinessEngagementCounts(ids);
          const nextPayload = JSON.stringify(counts);
          if (nextPayload !== lastPayload) {
            send({ type: "update", counts });
            lastPayload = nextPayload;
          }
        } catch {
          // keep stream alive and retry on next interval
        }
      }, 1500);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        clearInterval(poll);
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
