import { NextResponse } from "next/server";

import { checkBusinessUsernameAvailability } from "@/lib/db/businesses";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const url = new URL(req.url);
  const excludeId = url.searchParams.get("excludeId") || undefined;

  const availability = checkBusinessUsernameAvailability(username, {
    excludeBusinessId: excludeId,
  });

  if (!availability.available && availability.reason === "INVALID") {
    return NextResponse.json(
      { ok: false, error: "INVALID_USERNAME" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    available: availability.available,
    normalized: availability.normalized,
  });
}
