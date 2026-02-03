/**
 * Wallet Balance API
 * GET /api/wallet/balance - Get current user's wallet balance
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getUserWallet, ensureWallet, getPendingWithdrawalsTotal } from "@/lib/db/wallet";

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

    // Get pending withdrawals
    const pendingWithdrawals = await getPendingWithdrawalsTotal(user.id);
    const availableBalance = wallet.balance - pendingWithdrawals;

    return NextResponse.json({
      ok: true,
      balance: wallet.balance,
      availableBalance,
      pendingWithdrawals,
      accountNumber: wallet.accountNumber,
    });
  } catch (error) {
    console.error("Wallet balance GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch wallet balance" },
      { status: 500 }
    );
  }
}
