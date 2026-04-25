import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getMemberBusiness,
  listMemberBusinesses,
  reviewMemberBusinesses,
} from "@/lib/mcp/businessReviewServer";

export const runtime = "nodejs";

const requestSchema = z.object({
  action: z.enum(["list", "get", "review"]),
  approval: z.enum(["all", "approved", "pending"]).optional(),
  search: z.string().trim().optional(),
  limit: z.number().int().min(1).max(50).optional(),
  offset: z.number().int().min(0).max(5000).optional(),
  id: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  businessIds: z.array(z.string().trim().min(1)).max(25).optional(),
  locale: z.enum(["en", "ar"]).optional(),
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
    .optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_REQUEST", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    if (parsed.data.action === "list") {
      const result = await listMemberBusinesses(parsed.data);
      return NextResponse.json({ ok: true, result });
    }

    if (parsed.data.action === "get") {
      const result = await getMemberBusiness({ id: parsed.data.id, slug: parsed.data.slug });
      return NextResponse.json({ ok: true, result });
    }

    const result = await reviewMemberBusinesses({
      businessIds: parsed.data.businessIds,
      search: parsed.data.search,
      approval: parsed.data.approval,
      locale: parsed.data.locale,
      limit: parsed.data.limit,
      useAi: parsed.data.useAi,
      focus: parsed.data.focus,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}