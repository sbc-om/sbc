import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  countBusinessesWithActiveStories,
  countFollowedBusinessesWithActiveStoriesWithCategory,
  listBusinessesWithActiveStoriesPaginated,
  listFollowedBusinessesWithActiveStoriesWithCategoryPaginated,
} from "@/lib/db/stories";

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
  const scope = sp.get("scope") === "followed" ? "followed" : "all";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const perPage = Math.min(36, Math.max(6, parseInt(sp.get("perPage") || "16", 10)));
  const offset = (page - 1) * perPage;

  const [businesses, total] = await Promise.all(
    scope === "followed"
      ? [
          listFollowedBusinessesWithActiveStoriesWithCategoryPaginated(user.id, perPage, offset),
          countFollowedBusinessesWithActiveStoriesWithCategory(user.id),
        ]
      : [
          listBusinessesWithActiveStoriesPaginated(perPage, offset),
          countBusinessesWithActiveStories(),
        ],
  );

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const firstId = businesses[0]?.businessId ?? "";
  const lastId = businesses[businesses.length - 1]?.businessId ?? "";
  const etag = `W/"${createHash("sha1")
    .update(`${user.id}|${scope}|${page}|${perPage}|${total}|${totalPages}|${firstId}|${lastId}`)
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
      businesses,
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
