import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  createWebsite,
  listWebsitesByOwner,
  packageFromProductSlug,
} from "@/lib/db/websites";
import { hasActiveSubscription, getUserActiveSubscriptionForProgram } from "@/lib/db/subscriptions";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal error";
}

/**
 * @swagger
 * /api/websites:
 *   get:
 *     summary: List current user's websites
 *     tags: [Websites]
 *     responses:
 *       200:
 *         description: List of websites
 *   post:
 *     summary: Create a new website
 *     tags: [Websites]
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const websites = await listWebsitesByOwner(user.id);
  return NextResponse.json({ ok: true, websites });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  // Check if user has website subscription
  const hasSub = await hasActiveSubscription(user.id, "website");
  if (!hasSub) {
    return NextResponse.json(
      { ok: false, error: "SUBSCRIPTION_REQUIRED", message: "Active website subscription required" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Derive package from the user's active website subscription
    const sub = await getUserActiveSubscriptionForProgram(user.id, "website");
    if (sub) {
      body.package = packageFromProductSlug(sub.productSlug);
    }

    const website = await createWebsite(user.id, body);
    return NextResponse.json({ ok: true, website }, { status: 201 });
  } catch (error: unknown) {
    if (getErrorMessage(error) === "SLUG_TAKEN") {
      return NextResponse.json({ ok: false, error: "SLUG_TAKEN" }, { status: 409 });
    }
    if (getErrorMessage(error) === "DOMAIN_TAKEN") {
      return NextResponse.json({ ok: false, error: "DOMAIN_TAKEN" }, { status: 409 });
    }
    console.error("Create website error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
