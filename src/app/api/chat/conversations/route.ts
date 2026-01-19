import { NextRequest, NextResponse } from "next/server";
import { listConversationsByUser } from "@/lib/db/chats";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessById } from "@/lib/db/businesses";

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
    const conversations = listConversationsByUser(user.id);
    
    // Enrich with business data
    const enriched = conversations.map((conv) => {
      const business = getBusinessById(conv.businessId);
      return {
        ...conv,
        business: business
          ? {
              id: business.id,
              slug: business.slug,
              name: business.name,
              category: business.category,
              media: business.media,
            }
          : null,
      };
    });

    return NextResponse.json({ ok: true, conversations: enriched });
  } catch (error) {
    console.error("[GET /api/chat/conversations]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
