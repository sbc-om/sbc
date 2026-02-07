import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessById } from "@/lib/db/businesses";
import { createStory, getActiveStoriesByBusiness, deleteStoryByBusiness } from "@/lib/db/stories";
import { saveUpload } from "@/lib/uploads/storage";

export const runtime = "nodejs";

const storySchema = z.object({
  mediaType: z.enum(["image", "video"]),
  caption: z.string().max(500).optional().nullable(),
});

/**
 * @swagger
 * /api/businesses/{id}/stories:
 *   get:
 *     summary: Get active stories for a business
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of active stories
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stories = await getActiveStoriesByBusiness(id);
    return NextResponse.json({ ok: true, data: stories });
  } catch (error: any) {
    console.error("[business-stories] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/businesses/{id}/stories:
 *   post:
 *     summary: Create a new story for a business
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               mediaType:
 *                 type: string
 *                 enum: [image, video]
 *               caption:
 *                 type: string
 *     responses:
 *       201:
 *         description: Story created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not the business owner
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const business = await getBusinessById(businessId);
    
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    // Check ownership - business owner or admin
    if (business.ownerId !== user.id && user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Check if business is approved
    if (!business.isApproved && user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Business not approved" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mediaType = formData.get("mediaType") as string;
    const caption = formData.get("caption") as string | null;
    const overlaysRaw = formData.get("overlays") as string | null;
    let overlays = undefined;
    if (overlaysRaw) {
      try { overlays = JSON.parse(overlaysRaw); } catch { /* ignore invalid JSON */ }
    }

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // Validate
    const validation = storySchema.safeParse({ mediaType, caption });
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: validation.error.message }, { status: 400 });
    }

    // Check file size (max 50MB for videos, 10MB for images)
    const maxSize = mediaType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        ok: false, 
        error: `File too large. Max size is ${mediaType === "video" ? "50MB" : "10MB"}` 
      }, { status: 400 });
    }

    // Check file type
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const allowedTypes = mediaType === "video" ? allowedVideoTypes : allowedImageTypes;
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        ok: false, 
        error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}` 
      }, { status: 400 });
    }

    // Save the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || (mediaType === "video" ? "mp4" : "jpg");
    const mediaUrl = await saveUpload(buffer, {
      folder: `stories/${businessId}`,
      filename: `story.${ext}`,
    });

    // Create the story
    const story = await createStory({
      businessId,
      mediaUrl,
      mediaType: validation.data.mediaType,
      caption: validation.data.caption ?? undefined,
      overlays,
    });

    return NextResponse.json({ ok: true, data: story }, { status: 201 });
  } catch (error: any) {
    console.error("[business-stories] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/businesses/{id}/stories:
 *   delete:
 *     summary: Delete a story
 *     tags: [Stories]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storyId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Story deleted
 *       401:
 *         description: Unauthorized
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const business = await getBusinessById(businessId);
    
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    // Check ownership
    if (business.ownerId !== user.id && user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json({ ok: false, error: "storyId required" }, { status: 400 });
    }

    const deleted = await deleteStoryByBusiness(storyId, businessId);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[business-stories] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
