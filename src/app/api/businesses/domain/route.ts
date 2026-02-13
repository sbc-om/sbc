import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { checkDomainAvailability, getBusinessById, setBusinessCustomDomain } from "@/lib/db/businesses";

/**
 * @openapi
 * /api/businesses/domain:
 *   get:
 *     summary: Check domain availability
 *     tags: [Businesses]
 *     parameters:
 *       - in: query
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain to check
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: string
 *         description: Business ID to exclude from check (for editing)
 *     responses:
 *       200:
 *         description: Domain availability result
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const excludeId = searchParams.get("excludeId") || undefined;

  if (!domain) {
    return NextResponse.json({ ok: false, error: "MISSING_DOMAIN" }, { status: 400 });
  }

  const result = await checkDomainAvailability(domain, excludeId);
  return NextResponse.json({
    ok: true,
    available: result.available,
    reason: result.reason,
    normalized: domain.trim().toLowerCase(),
  });
}

const updateDomainSchema = z.object({
  businessId: z.string().min(1),
  domain: z.string().trim().toLowerCase().nullable(),
});

/**
 * @openapi
 * /api/businesses/domain:
 *   post:
 *     summary: Set custom domain for a business
 *     tags: [Businesses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessId]
 *             properties:
 *               businessId:
 *                 type: string
 *               domain:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Domain updated successfully
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { businessId, domain } = updateDomainSchema.parse(body);

    // Get business and verify ownership
    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    }

    // Only owner or admin can set domain
    if (business.ownerId !== user.id && user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    const updated = await setBusinessCustomDomain(businessId, domain);
    return NextResponse.json({
      ok: true,
      business: {
        id: updated.id,
        customDomain: updated.customDomain,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    if (message === "DOMAIN_TAKEN") {
      return NextResponse.json({ ok: false, error: "DOMAIN_TAKEN" }, { status: 409 });
    }
    if (message === "INVALID_DOMAIN") {
      return NextResponse.json({ ok: false, error: "INVALID_DOMAIN" }, { status: 400 });
    }
    console.error("Failed to update domain:", error);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
