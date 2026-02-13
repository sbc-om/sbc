import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getWebsiteById,
  getWebsitePageById,
  updateWebsitePage,
  deleteWebsitePage,
} from "@/lib/db/websites";

/**
 * @swagger
 * /api/websites/{id}/pages/{pageId}:
 *   patch:
 *     summary: Update a website page
 *     tags: [Websites]
 *   delete:
 *     summary: Delete a website page
 *     tags: [Websites]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id, pageId } = await params;
  const website = await getWebsiteById(id);
  if (!website) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (website.ownerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const page = await getWebsitePageById(pageId);
  if (!page || page.websiteId !== id) {
    return NextResponse.json({ ok: false, error: "Page not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updated = await updateWebsitePage(pageId, body);
    return NextResponse.json({ ok: true, page: updated });
  } catch (error: unknown) {
    console.error("Update page error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id, pageId } = await params;
  const website = await getWebsiteById(id);
  if (!website) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  if (website.ownerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const page = await getWebsitePageById(pageId);
  if (!page || page.websiteId !== id) {
    return NextResponse.json({ ok: false, error: "Page not found" }, { status: 404 });
  }

  // Don't allow deleting the homepage
  if (page.isHomepage) {
    return NextResponse.json({ ok: false, error: "Cannot delete homepage" }, { status: 400 });
  }

  await deleteWebsitePage(pageId);
  return NextResponse.json({ ok: true });
}
