import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { countUserHomeBusinesses, listUserHomeBusinessesPaginated } from "@/lib/db/follows";
import { buildHomeFeedItems } from "@/lib/home/feed";

export const runtime = "nodejs";

function matchesIfNoneMatch(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  if (ifNoneMatch.trim() === "*") return true;
  return ifNoneMatch
    .split(",")
    .map((value) => value.trim())
    .includes(etag);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const perPage = Math.min(36, Math.max(6, parseInt(sp.get("perPage") || "12", 10)));
  const locale = sp.get("locale") || "en";
  const offset = (page - 1) * perPage;

  const [businesses, total] = await Promise.all([
    listUserHomeBusinessesPaginated(user.id, perPage, offset),
    countUserHomeBusinesses(user.id),
  ]);

  const items = await buildHomeFeedItems(user.id, locale, businesses);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const firstId = items[0]?.business.id ?? "";
  const lastId = items[items.length - 1]?.business.id ?? "";
  const etag = `W/"${createHash("sha1")
    .update(`${user.id}|${locale}|${page}|${perPage}|${total}|${totalPages}|${firstId}|${lastId}`)
    .digest("base64url")}"`;

  const cacheHeaders = new Headers({
    "Cache-Control": "private, no-cache, max-age=0, must-revalidate",
    ETag: etag,
    Vary: "Cookie",
  });

  if (matchesIfNoneMatch(request.headers.get("if-none-match"), etag)) {
    return new NextResponse(null, { status: 304, headers: cacheHeaders });
  }

  return NextResponse.json(
    {
      ok: true,
      items,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
      },
    },
    { headers: cacheHeaders },
  );
}
