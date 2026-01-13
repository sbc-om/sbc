import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  diskPathFromMediaUrl,
  storeUserUpload,
  validateUserImageUpload,
} from "@/lib/uploads/storage";
import { getCategoryById, updateCategoryImage } from "@/lib/db/categories";
import fs from "node:fs/promises";

function isValidCategoryImageUrl(userId: string, categoryId: string, url: string) {
  const prefix = `/media/categories/${categoryId}/`;
  return url.startsWith(prefix);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: categoryId } = await context.params;
    const category = getCategoryById(categoryId);
    if (!category) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = (formData.get("image") ?? formData.get("file")) as File | null;
    if (!file) {
      return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
    }

    validateUserImageUpload({ kind: "avatar", file });

    // Store in categories subfolder
    const stored = await storeUserUpload({
      userId: `categories/${categoryId}`,
      kind: "avatar",
      file,
    });

    // Clean up previous image if exists
    if (category.image) {
      try {
        const diskPath = diskPathFromMediaUrl(category.image);
        await fs.unlink(diskPath);
        await fs.unlink(`${diskPath}.json`).catch(() => {});
      } catch {}
    }

    updateCategoryImage(categoryId, stored.url);

    return NextResponse.json({ ok: true, url: stored.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "UPLOAD_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id: categoryId } = await context.params;
    const category = getCategoryById(categoryId);
    if (!category) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Clean up image if exists
    if (category.image) {
      try {
        const diskPath = diskPathFromMediaUrl(category.image);
        await fs.unlink(diskPath);
        await fs.unlink(`${diskPath}.json`).catch(() => {});
      } catch {}
    }

    updateCategoryImage(categoryId, undefined);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DELETE_FAILED";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
