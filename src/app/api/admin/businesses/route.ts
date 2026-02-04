/**
 * Admin Businesses API
 * GET /api/admin/businesses - Get all businesses with pagination and filtering
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  listBusinessesPaginated,
  countBusinesses,
  type BusinessFilter,
} from "@/lib/db/businesses";

const PER_PAGE = 20;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filterParam = searchParams.get("filter");
    const filter = (["all", "pending", "approved"].includes(filterParam || "") ? filterParam : "all") as BusinessFilter;
    const search = searchParams.get("q") || undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = PER_PAGE;
    const offset = (page - 1) * limit;

    const [businesses, counts] = await Promise.all([
      listBusinessesPaginated({ filter, search, limit, offset }),
      countBusinesses({ search }),
    ]);

    // Calculate total for current filter
    const totalForFilter = filter === "all" ? counts.total : filter === "pending" ? counts.pending : counts.approved;

    return NextResponse.json({
      ok: true,
      businesses,
      counts,
      pagination: {
        page,
        perPage: limit,
        total: totalForFilter,
        totalPages: Math.ceil(totalForFilter / limit),
      },
    });
  } catch (error) {
    console.error("Get businesses error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get businesses" },
      { status: 500 }
    );
  }
}
