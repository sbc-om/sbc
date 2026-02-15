import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getUserNotificationSettings,
  upsertUserNotificationSettings,
} from "@/lib/db/notificationSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const putSchema = z
  .object({
    notificationsEnabled: z.boolean(),
    marketingUpdates: z.boolean(),
    soundsEnabled: z.boolean(),
  })
  .strict();

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const settings = await getUserNotificationSettings(user.id);
  return Response.json({ ok: true, settings });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const json = await req.json();
    const parsed = putSchema.parse(json);
    const settings = await upsertUserNotificationSettings(user.id, parsed);
    return Response.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INVALID_PAYLOAD";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
