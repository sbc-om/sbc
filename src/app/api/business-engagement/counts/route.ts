import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessEngagementCounts } from "@/lib/db/businessEngagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const ids = parseBusinessIds(request.nextUrl.searchParams);
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "Missing ids" }, { status: 400 });
  }

  const counts = await getBusinessEngagementCounts(ids);
  return NextResponse.json({ ok: true, counts });
}
