import { NextRequest, NextResponse } from "next/server";

import { getInstagramPostsPreview } from "@/lib/social/instagram";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const username = String(req.nextUrl.searchParams.get("username") || "").trim();
    if (!username) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const posts = await getInstagramPostsPreview(username, 6);
    return NextResponse.json({ ok: true, data: posts });
  } catch (error) {
    console.error("[instagram-feed] GET error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch Instagram feed" }, { status: 500 });
  }
}
