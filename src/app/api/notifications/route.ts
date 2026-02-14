import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getUnreadNotificationCount,
  listUserNotifications,
  markAllNotificationsRead,
} from "@/lib/db/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const withItems = url.searchParams.get("withItems") === "1";
  const limit = Number(url.searchParams.get("limit") || "50");

  const unreadCount = await getUnreadNotificationCount(user.id);
  const items = withItems ? await listUserNotifications(user.id, Number.isFinite(limit) ? limit : 50) : [];

  return NextResponse.json({ ok: true, unreadCount, items });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const updated = await markAllNotificationsRead(user.id);
  return NextResponse.json({ ok: true, updated });
}
