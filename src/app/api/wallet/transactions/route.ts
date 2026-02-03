/**
 * Wallet Transactions API
 * GET /api/wallet/transactions - Get wallet transactions with pagination
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getWalletTransactions, getUserWallet } from "@/lib/db/wallet";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Check wallet exists
    const wallet = await getUserWallet(user.id);
    if (!wallet) {
      return NextResponse.json(
        { ok: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    const transactions = await getWalletTransactions(user.id, limit, offset);

    return NextResponse.json({
      ok: true,
      transactions,
      pagination: {
        limit,
        offset,
        hasMore: transactions.length === limit,
      },
    });
  } catch (error) {
    console.error("Wallet transactions error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
