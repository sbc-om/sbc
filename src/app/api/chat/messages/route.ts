import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConversationMessages, sendMessage, getOrCreateConversation, markMessagesAsRead, type MessageType } from "@/lib/db/chats";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessBySlug, getBusinessByUsername, getBusinessById } from "@/lib/db/businesses";
import { getUserByUsername, getUserById, getUserByUsernameOrId } from "@/lib/db/users";
import { broadcastToConversation } from "../stream/route";
import { broadcastToUsers } from "../user-stream/route";

const getSchema = z.object({
  conversationId: z.string().min(1),
});

const postSchema = z.object({
  // Legacy: business chat by slug
  businessSlug: z.string().min(1).optional(),
  // New: direct chat with any participant (user or business) by their ID or username
  participantId: z.string().min(1).optional(),
  participantType: z.enum(["user", "business"]).optional(),
  // Direct conversation ID
  conversationId: z.string().min(1).optional(),
  // Message content
  text: z.string().trim().max(2000).optional(),
  messageType: z.enum(["text", "image", "file", "voice", "location"]).optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
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

    const messages = await getConversationMessages(params.conversationId);
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

    let conv;
    let participantIds: string[] = [];

    // If conversationId is provided, use it directly
    if (data.conversationId) {
      const { getConversationById } = await import("@/lib/db/chats");
      conv = await getConversationById(data.conversationId);
      if (!conv || !conv.participantIds.includes(user.id)) {
        return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
      }
      participantIds = conv.participantIds;
    } 
    // New: Direct participant chat (user-to-user, user-to-business, etc.)
    else if (data.participantId) {
      let targetId: string | null = null;
      
      if (data.participantType === "user") {
        // Find user by username or ID
        const targetUser = await getUserByUsernameOrId(data.participantId);
        if (!targetUser) {
          return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
        }
        if (targetUser.id === user.id) {
          return NextResponse.json({ ok: false, error: "Cannot chat with yourself" }, { status: 400 });
        }
        targetId = targetUser.id;
      } else if (data.participantType === "business") {
        // Find business by slug, username, or ID
        let business = await getBusinessBySlug(data.participantId);
        if (!business) {
          business = await getBusinessByUsername(data.participantId);
        }
        if (!business) {
          business = await getBusinessById(data.participantId);
        }
        if (!business) {
          return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
        }
        // Use business owner if available, otherwise business ID
        targetId = business.ownerId || business.id;
      } else {
        // Try to detect participant type automatically
        // First check if it's a user
        const targetUser = await getUserByUsernameOrId(data.participantId);
        if (targetUser) {
          if (targetUser.id === user.id) {
            return NextResponse.json({ ok: false, error: "Cannot chat with yourself" }, { status: 400 });
          }
          targetId = targetUser.id;
        } else {
          // Try as business
          let business = await getBusinessBySlug(data.participantId);
          if (!business) {
            business = await getBusinessByUsername(data.participantId);
          }
          if (!business) {
            business = await getBusinessById(data.participantId);
          }
          if (business) {
            targetId = business.ownerId || business.id;
          }
        }
      }
      
      if (!targetId) {
        return NextResponse.json({ ok: false, error: "Participant not found" }, { status: 404 });
      }
      
      participantIds = [user.id, targetId];
      conv = await getOrCreateConversation(participantIds);
    }
    // Legacy: business chat by slug
    else if (data.businessSlug) {
      // Try to find business by slug or username
      let business = await getBusinessBySlug(data.businessSlug);
      if (!business) {
        business = await getBusinessByUsername(data.businessSlug);
      }
      if (!business) {
        return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
      }

      // Get or create conversation between user and business owner
      participantIds = business.ownerId 
        ? [user.id, business.ownerId]
        : [user.id, business.id];
      conv = await getOrCreateConversation(participantIds);
    } else {
      return NextResponse.json({ ok: false, error: "businessSlug, participantId, or conversationId required" }, { status: 400 });
    }

    // Validate message content
    if (!data.text && !data.mediaUrl && data.messageType !== "location") {
      return NextResponse.json({ ok: false, error: "Message content required" }, { status: 400 });
    }

    const message = await sendMessage({
      conversationId: conv.id,
      senderId: user.id,
      text: data.text,
      messageType: data.messageType as MessageType,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
    });

    // Broadcast to conversation (for open chat windows)
    broadcastToConversation(conv.id, {
      type: "message",
      message,
    });

    // Broadcast to all participants (for sidebar updates)
    broadcastToUsers(participantIds, {
      type: "new_message",
      conversationId: conv.id,
      message: {
        id: message.id,
        text: message.text,
        senderId: message.senderId,
        messageType: message.messageType,
        createdAt: message.createdAt,
      },
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
