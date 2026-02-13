import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getWebsiteById,
  listWebsitePages,
  createWebsitePage,
  countWebsitePages,
} from "@/lib/db/websites";
import { WEBSITE_PACKAGE_LIMITS } from "@/lib/db/types";

/**
 * @swagger
 * /api/websites/{id}/pages:
 *   get:
 *     summary: List pages of a website
 *     tags: [Websites]
 *   post:
 *     summary: Create a new page for a website
 *     tags: [Websites]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const website = await getWebsiteById(id);
  if (!website) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (website.ownerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const pages = await listWebsitePages(id);
  return NextResponse.json({ ok: true, pages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const website = await getWebsiteById(id);
  if (!website) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (website.ownerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // Check page limit
  const limits = WEBSITE_PACKAGE_LIMITS[website.package];
  if (limits.maxPages > 0) {
    const currentCount = await countWebsitePages(id);
    if (currentCount >= limits.maxPages) {
      return NextResponse.json(
        { ok: false, error: "PAGE_LIMIT_REACHED", maxPages: limits.maxPages },
        { status: 403 }
      );
    }
  }

  try {
    const body = await req.json();
    const page = await createWebsitePage(id, body);
    return NextResponse.json({ ok: true, page }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create page error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
