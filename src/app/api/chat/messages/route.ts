import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listMessages, sendUserMessage, getOrCreateConversation } from "@/lib/db/chats";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessBySlug } from "@/lib/db/businesses";

const getSchema = z.object({
  conversationId: z.string().min(1),
});

const postSchema = z.object({
  businessSlug: z.string().min(1),
  text: z.string().trim().min(1).max(2000),
});

/**
 * @swagger
 * /api/chat/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     description: Returns all messages in a specific conversation
 *     tags: [Chat]
 *     parameters:
 *       - name: conversationId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const params = getSchema.parse({
      conversationId: url.searchParams.get("conversationId"),
    });

    const messages = listMessages(params.conversationId);
    return NextResponse.json({ ok: true, messages });
  } catch (error: any) {
    console.error("[GET /api/chat/messages]", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch messages" },
      { status: 400 }
    );
  }
}

/**
 * @swagger
 * /api/chat/messages:
 *   post:
 *     summary: Send a message
 *     description: Send a message to a business
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessSlug:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = postSchema.parse(body);

    const business = getBusinessBySlug(data.businessSlug);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    const message = sendUserMessage({
      userId: user.id,
      businessId: business.id,
      businessSlug: business.slug,
      text: data.text,
    });

    const conv = getOrCreateConversation({
      userId: user.id,
      businessId: business.id,
      businessSlug: business.slug,
    });

    return NextResponse.json({ ok: true, message, conversation: conv });
  } catch (error: any) {
    console.error("[POST /api/chat/messages]", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to send message" },
      { status: 400 }
    );
  }
}
