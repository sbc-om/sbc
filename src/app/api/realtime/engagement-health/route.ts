import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { logRealtimeEngagementHealthEvent } from "@/lib/db/realtimeHealthLogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.enum(["idle", "sse", "fallback"]),
  subscribedBusinesses: z.number().int().min(0).max(500),
  reconnectAttempts: z.number().int().min(0).max(10000),
  streamErrors: z.number().int().min(0).max(10000),
  visible: z.boolean(),
  source: z.string().trim().min(1).max(80).optional(),
  path: z.string().trim().min(1).max(512).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let parsedBody: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    parsedBody = bodySchema.parse(json);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  try {
    await logRealtimeEngagementHealthEvent({
      userId: user.id,
      mode: parsedBody.mode,
      subscribedBusinesses: parsedBody.subscribedBusinesses,
      reconnectAttempts: parsedBody.reconnectAttempts,
      streamErrors: parsedBody.streamErrors,
      visible: parsedBody.visible,
      source: parsedBody.source,
      path: parsedBody.path,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to log" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
