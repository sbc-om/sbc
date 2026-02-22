import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  countExplorerBusinesses,
  listExplorerBusinessesPaginated,
  type ExplorerBusinessSort,
} from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import {
  getBusinessEngagementCounts,
  getUserLikedBusinessIds,
  getUserSavedBusinessIds,
} from "@/lib/db/businessEngagement";
import { getBusinessIdsWithActiveStories } from "@/lib/db/stories";

export const runtime = "nodejs";

function matchesIfNoneMatch(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  if (ifNoneMatch.trim() === "*") return true;
  return ifNoneMatch
    .split(",")
    .map((value) => value.trim())
    .includes(etag);
}

const SORT_VALUES: ExplorerBusinessSort[] = [
  "relevance",
  "name-asc",
  "name-desc",
  "city-asc",
  "created-desc",
  "created-asc",
  "updated-desc",
  "verified-first",
  "special-first",
  "featured-first",
];

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const perPage = Math.min(36, Math.max(6, parseInt(sp.get("perPage") || "12", 10)));
  const offset = (page - 1) * perPage;
  const locale = sp.get("locale") === "ar" ? "ar" : "en";

  const sortByParam = sp.get("sortBy") || "relevance";
  const sortBy = SORT_VALUES.includes(sortByParam as ExplorerBusinessSort)
    ? (sortByParam as ExplorerBusinessSort)
    : "relevance";

  const options = {
    search: sp.get("q") || undefined,
    city: sp.get("city") || undefined,
    tags: sp.get("tags") || undefined,
    categoryId: sp.get("categoryId") || undefined,
    sortBy,
    limit: perPage,
    offset,
  };

  const [businesses, total] = await Promise.all([
    listExplorerBusinessesPaginated(options),
    countExplorerBusinesses(options),
  ]);

  const ids = businesses.map((business) => business.id);
  const [categories, engagementCounts, likedBusinessIds, savedBusinessIds, storyBusinessIds] = await Promise.all([
    listCategories(),
    getBusinessEngagementCounts(ids),
    getUserLikedBusinessIds(user.id),
    getUserSavedBusinessIds(user.id),
    getBusinessIdsWithActiveStories(ids),
  ]);

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const likedSet = new Set(likedBusinessIds);
  const savedSet = new Set(savedBusinessIds);

  const engagementByBusiness = businesses.reduce<
    Record<
      string,
      {
        categoryName?: string;
        categoryIconId?: string;
        initialLikeCount: number;
        initialLiked: boolean;
        initialSaved: boolean;
        commentCount: number;
      }
    >
  >((acc, business) => {
    const category = business.categoryId ? categoryById.get(business.categoryId) : undefined;
    const counts = engagementCounts[business.id] ?? { likes: 0, comments: 0 };

    acc[business.id] = {
      categoryName: category ? (locale === "ar" ? category.name.ar : category.name.en) : undefined,
      categoryIconId: category?.iconId,
      initialLikeCount: counts.likes,
      initialLiked: likedSet.has(business.id),
      initialSaved: savedSet.has(business.id),
      commentCount: counts.comments,
    };

    return acc;
  }, {});

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const firstId = businesses[0]?.id ?? "";
  const lastId = businesses[businesses.length - 1]?.id ?? "";
  const etag = `W/"${createHash("sha1")
    .update(
      `${user.id}|${locale}|${page}|${perPage}|${sortBy}|${options.search ?? ""}|${options.city ?? ""}|${options.tags ?? ""}|${options.categoryId ?? ""}|${total}|${totalPages}|${firstId}|${lastId}`,
    )
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
      engagementByBusiness,
      storyBusinessIds: Array.from(storyBusinessIds),
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
