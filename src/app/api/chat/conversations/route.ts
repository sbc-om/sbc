import { NextRequest, NextResponse } from "next/server";
import { getUserConversations, getLastMessageForConversation, getUnreadCount, getOrCreateConversation } from "@/lib/db/chats";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessById, getBusinessByOwnerId, getBusinessBySlug } from "@/lib/db/businesses";
import { getUserById, getUserByUsername } from "@/lib/db/users";
import { z } from "zod";

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: List user conversations
 *     description: Returns all conversations for the authenticated user
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: List of conversations with business details
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversations = await getUserConversations(user.id);
    
    // Enrich conversations with business/user details
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participantIds.find(id => id !== user.id);
        if (!otherParticipantId) return null;

        // Try to find as business first
        let business = await getBusinessById(otherParticipantId);
        
        // If not found, try to find business by owner ID
        if (!business) {
          business = await getBusinessByOwnerId(otherParticipantId);
        }

        if (business) {
          const lastMessage = await getLastMessageForConversation(conv.id);
          const unreadCount = await getUnreadCount(conv.id, user.id);
          return {
            ...conv,
            businessId: business.id,
            businessSlug: business.slug,
            unreadCount,
            lastMessage: lastMessage ? { 
              text: lastMessage.text, 
              senderId: lastMessage.senderId,
              messageType: lastMessage.messageType,
              createdAt: lastMessage.createdAt,
            } : null,
            business: {
              id: business.id,
              slug: business.slug,
              name: business.name,
              category: business.category,
              media: business.media,
            },
          };
        }

        // If still not found, get as user
        const otherUser = await getUserById(otherParticipantId);
        if (otherUser) {
          const lastMessage = await getLastMessageForConversation(conv.id);
          const unreadCount = await getUnreadCount(conv.id, user.id);
          return {
            ...conv,
            businessId: otherParticipantId,
            businessSlug: otherParticipantId,
            unreadCount,
            lastMessage: lastMessage ? { 
              text: lastMessage.text, 
              senderId: lastMessage.senderId,
              messageType: lastMessage.messageType,
              createdAt: lastMessage.createdAt,
            } : null,
            business: {
              id: otherParticipantId,
              slug: otherParticipantId,
              name: { 
                en: otherUser.displayName || otherUser.fullName || otherUser.email,
                ar: otherUser.displayName || otherUser.fullName || otherUser.email,
              },
              category: undefined,
              media: otherUser.avatarUrl ? { logo: otherUser.avatarUrl } : undefined,
            },
          };
        }

        return null;
      })
    );

    const validConversations = enrichedConversations.filter(Boolean);
    
    return NextResponse.json({ ok: true, conversations: validConversations });
  } catch (error) {
    console.error("[GET /api/chat/conversations]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// Schema for starting a new conversation
const startConversationSchema = z.object({
  participantId: z.string().optional(),
  participantType: z.enum(["user", "business"]).optional(),
  participantUsername: z.string().optional(), // Can use username/slug instead of ID
});

/**
 * @swagger
 * /api/chat/conversations:
 *   post:
 *     summary: Start or get a conversation
 *     description: Creates a new conversation or returns existing one with the specified participant
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: ID of the user or business to chat with
 *               participantType:
 *                 type: string
 *                 enum: [user, business]
 *                 description: Type of participant (if not specified, will auto-detect)
 *               participantUsername:
 *                 type: string
 *                 description: Username/slug of the participant (alternative to ID)
 *     responses:
 *       200:
 *         description: Conversation created or retrieved
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Participant not found
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = startConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { participantId, participantType, participantUsername } = parsed.data;
    
    if (!participantId && !participantUsername) {
      return NextResponse.json(
        { ok: false, error: "Either participantId or participantUsername is required" },
        { status: 400 }
      );
    }

    let resolvedParticipantId: string | null = null;
    let participantInfo: {
      type: "user" | "business";
      id: string;
      name: string;
      avatar?: string;
      slug?: string;
    } | null = null;

    // Resolve participant by username/slug
    if (participantUsername) {
      if (participantType === "business" || !participantType) {
        const business = await getBusinessBySlug(participantUsername);
        if (business) {
          resolvedParticipantId = business.id;
          participantInfo = {
            type: "business",
            id: business.id,
            name: typeof business.name === "string" ? business.name : business.name.en || business.name.ar || "",
            avatar: business.media?.logo,
            slug: business.slug,
          };
        }
      }
      
      if (!resolvedParticipantId && (participantType === "user" || !participantType)) {
        const targetUser = await getUserByUsername(participantUsername);
        if (targetUser) {
          resolvedParticipantId = targetUser.id;
          participantInfo = {
            type: "user",
            id: targetUser.id,
            name: targetUser.displayName || targetUser.fullName || targetUser.email,
            avatar: targetUser.avatarUrl || undefined,
            slug: targetUser.username || undefined,
          };
        }
      }
    }

    // Resolve by ID
    if (!resolvedParticipantId && participantId) {
      if (participantType === "business" || !participantType) {
        const business = await getBusinessById(participantId);
        if (business) {
          resolvedParticipantId = business.id;
          participantInfo = {
            type: "business",
            id: business.id,
            name: typeof business.name === "string" ? business.name : business.name.en || business.name.ar || "",
            avatar: business.media?.logo,
            slug: business.slug,
          };
        }
      }
      
      if (!resolvedParticipantId && (participantType === "user" || !participantType)) {
        const targetUser = await getUserById(participantId);
        if (targetUser) {
          resolvedParticipantId = targetUser.id;
          participantInfo = {
            type: "user",
            id: targetUser.id,
            name: targetUser.displayName || targetUser.fullName || targetUser.email,
            avatar: targetUser.avatarUrl || undefined,
            slug: targetUser.username || undefined,
          };
        }
      }
    }

    if (!resolvedParticipantId || !participantInfo) {
      return NextResponse.json(
        { ok: false, error: "Participant not found" },
        { status: 404 }
      );
    }

    // Prevent chatting with self
    if (resolvedParticipantId === user.id) {
      return NextResponse.json(
        { ok: false, error: "Cannot start a conversation with yourself" },
        { status: 400 }
      );
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation([user.id, resolvedParticipantId]);
    
    // Get last message and unread count
    const lastMessage = await getLastMessageForConversation(conversation.id);
    const unreadCount = await getUnreadCount(conversation.id, user.id);

    return NextResponse.json({
      ok: true,
      conversation: {
        ...conversation,
        unreadCount,
        lastMessage: lastMessage ? {
          text: lastMessage.text,
          senderId: lastMessage.senderId,
          messageType: lastMessage.messageType,
          createdAt: lastMessage.createdAt,
        } : null,
        participant: participantInfo,
      },
    });
  } catch (error) {
    console.error("[POST /api/chat/conversations]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
