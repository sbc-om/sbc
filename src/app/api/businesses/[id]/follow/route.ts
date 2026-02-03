import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getBusinessFollowStatus,
  followBusiness,
  unfollowBusiness,
  refollowBusiness,
  getBusinessFollowerCount,
  getUserFollowedCategoryIds,
} from "@/lib/db/follows";
import { getBusinessById } from "@/lib/db/businesses";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/businesses/[id]/follow
 * Get follow status for a business
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: businessId } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: true, status: "guest", followerCount: 0 });
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    // Check if user follows the business's category
    const followedCategoryIds = await getUserFollowedCategoryIds(user.id);
    const followsCategory = business.categoryId ? followedCategoryIds.includes(business.categoryId) : false;

    // Get direct follow status
    const status = await getBusinessFollowStatus(user.id, businessId);
    const followerCount = await getBusinessFollowerCount(businessId);

    return NextResponse.json({
      ok: true,
      status,
      followsCategory,
      followerCount,
    });
  } catch (error) {
    console.error("Error getting follow status:", error);
    return NextResponse.json({ ok: false, error: "Failed to get follow status" }, { status: 500 });
  }
}

/**
 * POST /api/businesses/[id]/follow
 * Follow a business
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: businessId } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    await followBusiness(user.id, businessId);
    const followerCount = await getBusinessFollowerCount(businessId);

    return NextResponse.json({
      ok: true,
      status: "following" as const,
      followerCount,
    });
  } catch (error) {
    console.error("Error following business:", error);
    return NextResponse.json({ ok: false, error: "Failed to follow business" }, { status: 500 });
  }
}

/**
 * DELETE /api/businesses/[id]/follow
 * Unfollow a business
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: businessId } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    await unfollowBusiness(user.id, businessId);
    const followerCount = await getBusinessFollowerCount(businessId);

    return NextResponse.json({
      ok: true,
      status: "unfollowed" as const,
      followerCount,
    });
  } catch (error) {
    console.error("Error unfollowing business:", error);
    return NextResponse.json({ ok: false, error: "Failed to unfollow business" }, { status: 500 });
  }
}

/**
 * PATCH /api/businesses/[id]/follow
 * Re-follow a business (remove from unfollowed list)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: businessId } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const business = await getBusinessById(businessId);
    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    await refollowBusiness(user.id, businessId);
    const followerCount = await getBusinessFollowerCount(businessId);

    return NextResponse.json({
      ok: true,
      status: "neutral" as const,
      followerCount,
    });
  } catch (error) {
    console.error("Error re-following business:", error);
    return NextResponse.json({ ok: false, error: "Failed to re-follow business" }, { status: 500 });
  }
}
