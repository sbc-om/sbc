import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getUserById } from "@/lib/db/users";
import { sendText, sendImage, formatChatId, isWAHAEnabled } from "@/lib/waha/client";

export const runtime = "nodejs";

const broadcastTextSchema = z.object({
  userIds: z.array(z.string()).min(1),
  message: z.string().min(1).max(4096),
});

const broadcastImageSchema = z.object({
  userIds: z.array(z.string()).min(1),
  imageUrl: z.string().url(),
  caption: z.string().max(1024).optional(),
});

/**
 * @swagger
 * /api/admin/whatsapp/broadcast:
 *   post:
 *     summary: Send WhatsApp broadcast message to selected users
 *     tags: [Admin, WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [userIds, message]
 *                 properties:
 *                   userIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                   message:
 *                     type: string
 *               - type: object
 *                 required: [userIds, imageUrl]
 *                 properties:
 *                   userIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                   imageUrl:
 *                     type: string
 *                   caption:
 *                     type: string
 *     responses:
 *       200:
 *         description: Broadcast sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin
    if (auth.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    // Check if WAHA is enabled
    if (!isWAHAEnabled()) {
      return NextResponse.json({ ok: false, error: "WhatsApp is not configured" }, { status: 400 });
    }

    const body = await request.json();
    
    // Determine message type
    const isTextMessage = "message" in body;
    const isImageMessage = "imageUrl" in body;

    if (!isTextMessage && !isImageMessage) {
      return NextResponse.json(
        { ok: false, error: "Either message or imageUrl is required" },
        { status: 400 }
      );
    }

    let userIds: string[];
    let message: string | undefined;
    let imageUrl: string | undefined;
    let caption: string | undefined;

    if (isTextMessage) {
      const parsed = broadcastTextSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: "Invalid request", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      userIds = parsed.data.userIds;
      message = parsed.data.message;
    } else {
      const parsed = broadcastImageSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: "Invalid request", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      userIds = parsed.data.userIds;
      imageUrl = parsed.data.imageUrl;
      caption = parsed.data.caption;
    }

    // Get users with phone numbers
    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      try {
        const user = await getUserById(userId);
        if (!user) {
          results.push({ userId, success: false, error: "User not found" });
          continue;
        }

        if (!user.phone) {
          results.push({ userId, success: false, error: "No phone number" });
          continue;
        }

        const chatId = formatChatId(user.phone);

        if (isTextMessage && message) {
          await sendText({ chatId, text: message });
        } else if (isImageMessage && imageUrl) {
          await sendImage({ chatId, imageUrl, caption });
        }

        results.push({ userId, success: true });

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.push({ userId, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      ok: true,
      sent: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error("[WhatsApp Broadcast] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/whatsapp/broadcast:
 *   get:
 *     summary: Get WhatsApp broadcast status
 *     tags: [Admin, WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp status
 */
export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (auth.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      enabled: isWAHAEnabled(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
