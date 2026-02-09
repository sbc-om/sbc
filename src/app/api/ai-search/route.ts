import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { listApprovedBusinesses } from "@/lib/db/businesses";
import { listCategories } from "@/lib/db/categories";
import { smartSearch, generateChatResponse, extractIntent } from "@/lib/ai/smartSearch";
import type { ScoredBusiness } from "@/lib/ai/smartSearch";

const requestSchema = z.object({
  query: z.string().trim().min(1).max(500),
  locale: z.enum(["en", "ar"]).default("en"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

/**
 * @swagger
 * /api/ai-search:
 *   post:
 *     summary: Smart AI search for businesses
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query:
 *                 type: string
 *               locale:
 *                 type: string
 *                 enum: [en, ar]
 *               conversationHistory:
 *                 type: array
 *     responses:
 *       200:
 *         description: Search results with AI-generated response
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query: userQuery, locale, conversationHistory } = parsed.data;

    // Fetch businesses and categories in parallel
    const [businesses, categories] = await Promise.all([
      listApprovedBusinesses(),
      listCategories(),
    ]);

    // Build enhanced query from conversation context
    let enhancedQuery = userQuery;
    if (conversationHistory.length > 0) {
      // Extract context from the last few messages to understand follow-up queries
      const recentContext = conversationHistory.slice(-4);
      const lastUserQuery = recentContext.filter(m => m.role === "user").pop()?.content;

      // If the current query is a short follow-up, combine with previous context
      if (userQuery.split(/\s+/).length <= 3 && lastUserQuery) {
        const prevIntent = extractIntent(lastUserQuery, categories, locale);
        const currentIntent = extractIntent(userQuery, categories, locale);

        // If current query is adding context (like a city or filter), merge
        if (!currentIntent.entities.city && prevIntent.entities.city) {
          // Carry forward city from previous query
        }
        if (currentIntent.coreQuery && prevIntent.coreQuery && currentIntent.coreQuery !== prevIntent.coreQuery) {
          // If it seems like a refinement, combine
          const isRefinement = /أيضا|كمان|وكمان|also|more|else|another|غير|ثاني|بعد/i.test(userQuery);
          if (isRefinement) {
            enhancedQuery = `${lastUserQuery} ${userQuery}`;
          }
        }
      }
    }

    // Perform smart search
    const { results, intent } = smartSearch(enhancedQuery, businesses, categories, locale, 20);

    // Generate chat response
    const message = generateChatResponse(
      userQuery,
      results,
      intent,
      categories,
      locale,
      conversationHistory
    );

    // Return results with business IDs (client maps to full data)
    const resultIds = results.map(r => r.business.id);
    const topResults = results.slice(0, 10).map((r: ScoredBusiness) => ({
      id: r.business.id,
      name: r.business.name,
      city: r.business.city,
      slug: r.business.slug,
      username: r.business.username,
      category: r.business.category,
      isVerified: r.business.isVerified,
      isSpecial: r.business.isSpecial,
      score: Math.round(r.score * 100) / 100,
      matchReasons: r.matchReasons.slice(0, 5),
    }));

    return NextResponse.json({
      ok: true,
      message,
      resultIds,
      topResults,
      intent: {
        type: intent.intentType,
        language: intent.language,
        entities: intent.entities,
        coreQuery: intent.coreQuery,
      },
      totalResults: results.length,
    });
  } catch (error) {
    console.error("AI search error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
