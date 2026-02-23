import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessByOwnerId } from "@/lib/db/businesses";
import {
  createBusinessAiAgent,
  listBusinessAiAgents,
  countBusinessAiAgents,
  PLAN_LIMITS,
} from "@/lib/db/businessAiAgents";
import { hasActiveSubscription, getUserActiveSubscriptionForProgram } from "@/lib/db/subscriptions";

/**
 * @swagger
 * /api/agent-builder:
 *   get:
 *     summary: List current user's AI agents
 *     tags: [AgentBuilder]
 *     responses:
 *       200:
 *         description: List of AI agents
 *   post:
 *     summary: Create a new AI agent
 *     tags: [AgentBuilder]
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByOwnerId(user.id);
  if (!business) return NextResponse.json({ ok: false, error: "NO_BUSINESS" }, { status: 403 });

  const agents = await listBusinessAiAgents(business.id);
  return NextResponse.json({ ok: true, agents });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByOwnerId(user.id);
  if (!business) {
    return NextResponse.json({ ok: false, error: "NO_BUSINESS" }, { status: 403 });
  }

  // Check subscription
  const hasSub = await hasActiveSubscription(user.id, "agent-builder");
  if (!hasSub) {
    return NextResponse.json(
      { ok: false, error: "SUBSCRIPTION_REQUIRED", message: "Active AI Agent Builder subscription required" },
      { status: 403 },
    );
  }

  // Determine plan from subscription
  const sub = await getUserActiveSubscriptionForProgram(user.id, "agent-builder");
  const planSlug = sub?.productSlug ?? "starter";
  const planKey = planSlug.includes("enterprise")
    ? "enterprise"
    : planSlug.includes("professional")
      ? "professional"
      : "starter";

  // Check limits
  const currentCount = await countBusinessAiAgents(business.id);
  const limits = PLAN_LIMITS[planKey];
  if (currentCount >= limits.maxAgents) {
    return NextResponse.json(
      { ok: false, error: "LIMIT_REACHED", message: `Your plan allows up to ${limits.maxAgents} agent(s)` },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const agent = await createBusinessAiAgent({
      businessId: business.id,
      ownerId: user.id,
      name: body.name ?? "New Agent",
      description: body.description ?? "",
      plan: planKey,
      workflow: body.workflow ?? {},
    });

    return NextResponse.json({ ok: true, agent }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create AI agent error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
