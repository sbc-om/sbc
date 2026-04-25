import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  getBusinessById,
  getBusinessBySlug,
  getBusinessesByIds,
  listBusinessesPaginated,
  searchBusinesses,
} from "@/lib/db/businesses";
import type { Business, Locale } from "@/lib/db/types";

type BusinessHeuristicReview = {
  id: string;
  slug: string;
  displayName: string;
  heuristicScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
  missingFields: string[];
};

type PortfolioAiReview = {
  executiveSummary: string;
  portfolioSignals: string[];
  priorities: string[];
  businesses: Array<{
    id: string;
    slug: string;
    overallScore: number;
    summary: string;
    strengths: string[];
    risks: string[];
    recommendations: string[];
    missingFields: string[];
  }>;
};

export type ListMemberBusinessesInput = {
  approval?: "all" | "approved" | "pending";
  search?: string;
  limit?: number;
  offset?: number;
};

export type GetMemberBusinessInput = {
  id?: string;
  slug?: string;
};

export type ReviewMemberBusinessesInput = {
  businessIds?: string[];
  search?: string;
  approval?: "all" | "approved" | "pending";
  locale?: Locale;
  limit?: number;
  useAi?: boolean;
  focus?: Array<
    "profile_quality" | "contact_readiness" | "discoverability" | "trust_signals" | "content_gaps"
  >;
};

const listBusinessesInputSchema = {
  approval: z.enum(["all", "approved", "pending"]).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).max(5000).optional(),
};

const getBusinessInputSchema = {
  id: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
};

const reviewBusinessesInputSchema = {
  businessIds: z.array(z.string().trim().min(1)).max(25).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  approval: z.enum(["all", "approved", "pending"]).optional(),
  locale: z.enum(["en", "ar"]).optional(),
  limit: z.number().int().min(1).max(10).optional(),
  useAi: z.boolean().optional(),
  focus: z
    .array(
      z.enum([
        "profile_quality",
        "contact_readiness",
        "discoverability",
        "trust_signals",
        "content_gaps",
      ])
    )
    .max(5)
    .optional(),
};

function compactBusiness(business: Business) {
  return {
    id: business.id,
    slug: business.slug,
    username: business.username,
    ownerId: business.ownerId,
    name: business.name,
    description: business.description,
    isApproved: business.isApproved ?? false,
    isVerified: business.isVerified ?? false,
    isSpecial: business.isSpecial ?? false,
    homepageFeatured: business.homepageFeatured ?? false,
    homepageTop: business.homepageTop ?? false,
    category: business.category,
    categoryId: business.categoryId,
    city: business.city,
    address: business.address,
    phone: business.phone,
    website: business.website,
    email: business.email,
    instagramUsername: business.instagramUsername,
    tags: business.tags ?? [],
    customDomain: business.customDomain,
    latitude: business.latitude,
    longitude: business.longitude,
    media: {
      cover: business.media?.cover,
      logo: business.media?.logo,
      banner: business.media?.banner,
      galleryCount: business.media?.gallery?.length ?? 0,
      videoCount: business.media?.videos?.length ?? 0,
    },
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
  };
}

function businessDisplayName(business: Business, locale: Locale) {
  return locale === "ar"
    ? business.name.ar || business.name.en || business.slug
    : business.name.en || business.name.ar || business.slug;
}

function hasText(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function computeHeuristicReview(business: Business, locale: Locale): BusinessHeuristicReview {
  const missingFields: string[] = [];
  const strengths: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  if (!hasText(business.description?.en) || !hasText(business.description?.ar)) {
    missingFields.push("bilingual_description");
    recommendations.push("Add complete Arabic and English descriptions for better search and trust.");
    score -= 12;
  } else {
    strengths.push("Has bilingual description content.");
  }

  if (!hasText(business.phone) && !hasText(business.email) && !hasText(business.website)) {
    missingFields.push("contact_channels");
    risks.push("No direct contact channel is visible on the business profile.");
    recommendations.push("Add at least one direct contact method: phone, email, or website.");
    score -= 15;
  } else {
    strengths.push("Profile exposes at least one direct contact channel.");
  }

  if (!hasText(business.city)) {
    missingFields.push("city");
    recommendations.push("Set the city so directory filters and local discovery work correctly.");
    score -= 8;
  }

  if (!hasText(business.address)) {
    missingFields.push("address");
    score -= 4;
  }

  if (!hasText(business.category) && !hasText(business.categoryId)) {
    missingFields.push("category");
    risks.push("Business may be harder to discover because category metadata is missing.");
    recommendations.push("Assign a category to improve classification and browse relevance.");
    score -= 10;
  } else {
    strengths.push("Business is categorized for discovery.");
  }

  if (!business.tags || business.tags.length === 0) {
    missingFields.push("tags");
    recommendations.push("Add tags describing services, niche, and audience for better search matching.");
    score -= 6;
  } else {
    strengths.push("Tags are present for discoverability.");
  }

  if (!business.media?.logo && !business.media?.cover && !business.media?.banner) {
    missingFields.push("brand_media");
    risks.push("Profile lacks clear visual branding assets.");
    recommendations.push("Upload a logo or cover/banner image to increase profile credibility.");
    score -= 10;
  } else {
    strengths.push("Profile includes at least one branding asset.");
  }

  if (typeof business.latitude !== "number" || typeof business.longitude !== "number") {
    missingFields.push("map_location");
    recommendations.push("Add map coordinates so the business appears correctly in map and proximity flows.");
    score -= 5;
  } else {
    strengths.push("Location coordinates are available.");
  }

  if (business.isApproved) {
    strengths.push("Business is approved for public listing.");
  } else {
    risks.push("Business is not approved yet, which limits public visibility.");
    score -= 10;
  }

  if (business.isVerified) {
    strengths.push("Business carries a verification trust signal.");
  }

  if (business.isSpecial || business.homepageFeatured || business.homepageTop) {
    strengths.push("Business already has elevated visibility flags.");
  }

  if (!hasText(business.instagramUsername)) {
    recommendations.push("Consider linking Instagram if it is part of the acquisition funnel.");
  }

  if (!hasText(business.customDomain) && !hasText(business.website)) {
    risks.push("Business has no owned web destination configured.");
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));
  const displayName = businessDisplayName(business, locale);
  const summary = [
    `${displayName} scored ${score}/100 on heuristic profile readiness.`,
    missingFields.length > 0
      ? `Main gaps: ${missingFields.join(", ")}.`
      : "No major structural profile gaps were detected.",
  ].join(" ");

  return {
    id: business.id,
    slug: business.slug,
    displayName,
    heuristicScore: score,
    summary,
    strengths,
    risks,
    recommendations,
    missingFields,
  };
}

function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function reviewPortfolioWithAi(
  businesses: Business[],
  heuristics: BusinessHeuristicReview[],
  locale: Locale,
  focus: string[]
): Promise<PortfolioAiReview> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const prompt = {
    locale,
    focus,
    businesses: businesses.map(compactBusiness),
    heuristicReviews: heuristics,
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You audit member business profiles for a bilingual business directory. Return strict JSON with keys executiveSummary, portfolioSignals, priorities, businesses. Each business item must include id, slug, overallScore, summary, strengths, risks, recommendations, missingFields. Focus on profile quality, discoverability, trust signals, and growth readiness. Do not wrap JSON in markdown.",
        },
        {
          role: "user",
          content: JSON.stringify(prompt),
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`AI review request failed with ${response.status}: ${details}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI review response did not contain content.");
  }

  const parsed = JSON.parse(content) as PortfolioAiReview;
  return parsed;
}

async function resolveBusinessesForReview(input: {
  businessIds?: string[];
  search?: string;
  approval?: "all" | "approved" | "pending";
  limit: number;
  locale: Locale;
}) {
  if (input.businessIds && input.businessIds.length > 0) {
    return getBusinessesByIds(input.businessIds);
  }

  if (input.search && (input.approval ?? "approved") === "approved") {
    const matched = await searchBusinesses(input.search, input.locale);
    return matched.slice(0, input.limit);
  }

  return listBusinessesPaginated({
    filter: input.approval ?? "approved",
    search: input.search,
    limit: input.limit,
    offset: 0,
  });
}

function jsonText(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function createBusinessReviewMcpServer() {
  const server = new McpServer({
    name: "sbc-business-review",
    version: "0.1.0",
  });

  server.tool(
    "list_member_businesses",
    "List businesses from the SBC database with optional approval and search filters.",
    listBusinessesInputSchema,
    async ({ approval = "approved", search, limit = 20, offset = 0 }) => {
      const businesses = await listBusinessesPaginated({
        filter: approval,
        search,
        limit,
        offset,
      });

      return {
        content: [
          {
            type: "text",
            text: jsonText({
              count: businesses.length,
              businesses: businesses.map((business) => compactBusiness(business)),
            }),
          },
        ],
      };
    }
  );

  server.tool(
    "get_member_business",
    "Fetch one business by id or slug.",
    getBusinessInputSchema,
    async ({ id, slug }) => {
      if (!id && !slug) {
        throw new Error("Provide either id or slug.");
      }

      const business = id ? await getBusinessById(id) : await getBusinessBySlug(slug!);
      if (!business) {
        throw new Error("Business not found.");
      }

      return {
        content: [
          {
            type: "text",
            text: jsonText(compactBusiness(business)),
          },
        ],
      };
    }
  );

  server.tool(
    "review_member_businesses",
    "Review a set of member businesses with heuristic checks and optional AI analysis.",
    reviewBusinessesInputSchema,
    async ({
      businessIds,
      search,
      approval = "approved",
      locale = "en",
      limit = 5,
      useAi = true,
      focus = ["profile_quality", "discoverability", "trust_signals"],
    }) => {
      const businesses = await resolveBusinessesForReview({
        businessIds,
        search,
        approval,
        limit,
        locale,
      });

      if (businesses.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: jsonText({
                ok: true,
                message: "No businesses matched the requested review scope.",
              }),
            },
          ],
        };
      }

      const heuristics = businesses.map((business) => computeHeuristicReview(business, locale));
      let aiReview: PortfolioAiReview | null = null;
      let aiStatus: "disabled" | "skipped" | "completed" | "failed" = "disabled";
      let aiError: string | null = null;

      if (useAi && isAiConfigured()) {
        try {
          aiReview = await reviewPortfolioWithAi(businesses, heuristics, locale, focus);
          aiStatus = "completed";
        } catch (error) {
          aiStatus = "failed";
          aiError = error instanceof Error ? error.message : "Unknown AI review error.";
        }
      } else if (useAi) {
        aiStatus = "skipped";
        aiError = "OPENAI_API_KEY is not configured, so only heuristic review was returned.";
      }

      return {
        content: [
          {
            type: "text",
            text: jsonText({
              ok: true,
              reviewedCount: businesses.length,
              focus,
              aiStatus,
              aiError,
              heuristicReviews: heuristics,
              aiReview,
            }),
          },
        ],
      };
    }
  );

  return server;
}

export async function listMemberBusinesses(input: ListMemberBusinessesInput = {}) {
  const {
    approval = "approved",
    search,
    limit = 20,
    offset = 0,
  } = input;

  const businesses = await listBusinessesPaginated({
    filter: approval,
    search,
    limit,
    offset,
  });

  return {
    count: businesses.length,
    businesses: businesses.map((business) => compactBusiness(business)),
  };
}

export async function getMemberBusiness(input: GetMemberBusinessInput) {
  const { id, slug } = input;
  if (!id && !slug) {
    throw new Error("Provide either id or slug.");
  }

  const business = id ? await getBusinessById(id) : await getBusinessBySlug(slug!);
  if (!business) {
    throw new Error("Business not found.");
  }

  return compactBusiness(business);
}

export async function reviewMemberBusinesses(input: ReviewMemberBusinessesInput = {}) {
  const {
    businessIds,
    search,
    approval = "approved",
    locale = "en",
    limit = 5,
    useAi = true,
    focus = ["profile_quality", "discoverability", "trust_signals"],
  } = input;

  const businesses = await resolveBusinessesForReview({
    businessIds,
    search,
    approval,
    limit,
    locale,
  });

  if (businesses.length === 0) {
    return {
      ok: true,
      message: "No businesses matched the requested review scope.",
    };
  }

  const heuristics = businesses.map((business) => computeHeuristicReview(business, locale));
  let aiReview: PortfolioAiReview | null = null;
  let aiStatus: "disabled" | "skipped" | "completed" | "failed" = "disabled";
  let aiError: string | null = null;

  if (useAi && isAiConfigured()) {
    try {
      aiReview = await reviewPortfolioWithAi(businesses, heuristics, locale, focus);
      aiStatus = "completed";
    } catch (error) {
      aiStatus = "failed";
      aiError = error instanceof Error ? error.message : "Unknown AI review error.";
    }
  } else if (useAi) {
    aiStatus = "skipped";
    aiError = "OPENAI_API_KEY is not configured, so only heuristic review was returned.";
  }

  return {
    ok: true,
    reviewedCount: businesses.length,
    focus,
    aiStatus,
    aiError,
    heuristicReviews: heuristics,
    aiReview,
  };
}