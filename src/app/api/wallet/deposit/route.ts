/**
 * Wallet Deposit API - Admin only
 * POST /api/wallet/deposit - Deposit funds to wallet
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { depositToWallet, ensureWallet, getWalletByAccountNumber, getUserByPhone } from "@/lib/db/wallet";
import { broadcastWalletEvent } from "@/app/api/wallet/stream/route";

const depositSchema = z.object({
  accountNumber: z.string().min(1, "Account number required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can deposit
    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Only admin can deposit funds" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = depositSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { accountNumber, amount, description } = validation.data;

    // Find target wallet by account number
    let wallet = await getWalletByAccountNumber(accountNumber);
    
    if (!wallet) {
      // Check if user exists with this phone
      const targetUser = await getUserByPhone(accountNumber);
      if (!targetUser) {
        return NextResponse.json(
          { ok: false, error: "Wallet not found for this account number" },
          { status: 404 }
        );
      }
      // Create wallet for user
      wallet = await ensureWallet(targetUser.id, targetUser.phone);
    }

    // Deposit to wallet
    const result = await depositToWallet(wallet.userId, amount, description);

    // Broadcast real-time event to the user
    broadcastWalletEvent(wallet.userId, {
      type: "deposit",
      amount,
      balance: result.wallet.balance,
      description: description || "Wallet deposit",
    });

    return NextResponse.json({
      ok: true,
      wallet: {
        balance: result.wallet.balance,
        accountNumber: result.wallet.accountNumber,
      },
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("Wallet deposit error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to deposit" },
      { status: 500 }
    );
  }
}
