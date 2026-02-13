import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getWebsiteById,
  updateWebsite,
  deleteWebsite,
  publishWebsite,
} from "@/lib/db/websites";

/**
 * @swagger
 * /api/websites/{id}:
 *   get:
 *     summary: Get a website by ID
 *     tags: [Websites]
 *   patch:
 *     summary: Update a website
 *     tags: [Websites]
 *   delete:
 *     summary: Delete a website
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

  // Only owner or admin
  if (website.ownerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, website });
}

export async function PATCH(
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

  try {
    const body = await req.json();

    // Handle publish/unpublish shortcut
    if (body.action === "publish") {
      const updated = await publishWebsite(id, true);
      return NextResponse.json({ ok: true, website: updated });
    }
    if (body.action === "unpublish") {
      const updated = await publishWebsite(id, false);
      return NextResponse.json({ ok: true, website: updated });
    }

    const updated = await updateWebsite(id, body);
    return NextResponse.json({ ok: true, website: updated });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage === "SLUG_TAKEN") {
      return NextResponse.json({ ok: false, error: "SLUG_TAKEN" }, { status: 409 });
    }
    if (errorMessage === "DOMAIN_TAKEN") {
      return NextResponse.json({ ok: false, error: "DOMAIN_TAKEN" }, { status: 409 });
    }
    console.error("Update website error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
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

  await deleteWebsite(id);
  return NextResponse.json({ ok: true });
}
