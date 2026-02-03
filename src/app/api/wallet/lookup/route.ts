/**
 * Lookup User API for transfer
 * GET /api/wallet/lookup?phone=xxx - Lookup user by phone for transfer preview
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getUserByPhone, getWalletByAccountNumber, ensureWallet } from "@/lib/db/wallet";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const phone = request.nextUrl.searchParams.get("phone");
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "Phone number required" },
        { status: 400 }
      );
    }

    // Find user by phone
    const targetUser = await getUserByPhone(phone);
    if (!targetUser) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if it's the same user
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { ok: false, error: "Cannot transfer to yourself" },
        { status: 400 }
      );
    }

    // Check or create wallet for target user
    let wallet = await getWalletByAccountNumber(targetUser.phone);
    if (!wallet) {
      wallet = await ensureWallet(targetUser.id, targetUser.phone);
    }

    return NextResponse.json({
      ok: true,
      user: {
        displayName: targetUser.displayName,
        accountNumber: wallet.accountNumber,
      },
    });
  } catch (error) {
    console.error("Wallet lookup error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to lookup user" },
      { status: 500 }
    );
  }
}
