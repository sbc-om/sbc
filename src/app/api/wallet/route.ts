/**
 * Wallet API - Get wallet info
 * GET /api/wallet - Get current user's wallet
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getUserWallet, ensureWallet, getWalletTransactions } from "@/lib/db/wallet";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!user.phone) {
      return NextResponse.json(
        { ok: false, error: "Phone number required for wallet" },
        { status: 400 }
      );
    }

    // Get or create wallet
    let wallet = await getUserWallet(user.id);
    if (!wallet) {
      wallet = await ensureWallet(user.id, user.phone);
    }

    // Get recent transactions
    const transactions = await getWalletTransactions(user.id, 20, 0);

    return NextResponse.json({
      ok: true,
      wallet: {
        balance: wallet.balance,
        accountNumber: wallet.accountNumber,
        createdAt: wallet.createdAt,
      },
      transactions,
    });
  } catch (error) {
    console.error("Wallet GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}
