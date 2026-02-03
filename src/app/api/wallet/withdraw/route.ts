/**
 * Wallet Withdraw API
 * POST /api/wallet/withdraw - Create a withdrawal request (users) or directly withdraw (admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { createWithdrawalRequest, getUserWithdrawalRequests, getUserWallet, cancelWithdrawalRequest } from "@/lib/db/wallet";
import { sendText, formatChatId, isWAHAEnabled } from "@/lib/waha/client";

const withdrawSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = withdrawSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount } = validation.data;

    // Check wallet exists
    const wallet = await getUserWallet(user.id);
    if (!wallet) {
      return NextResponse.json(
        { ok: false, error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Check balance
    if (wallet.balance < amount) {
      return NextResponse.json(
        { ok: false, error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawalRequest = await createWithdrawalRequest(user.id, amount);

    // Send WhatsApp notification
    if (isWAHAEnabled() && user.phone) {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-OM", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = `📤 *Withdrawal Request - SBC*

💸 Amount: *${amount.toFixed(3)} OMR*
📋 Status: Pending Review
📅 Date: ${dateStr}

Your withdrawal request has been submitted and is pending admin approval.

https://sbc.om`;
      sendText({ chatId: formatChatId(user.phone), text: message }).catch(console.error);
    }

    return NextResponse.json({
      ok: true,
      request: withdrawalRequest,
      message: "Withdrawal request created. Admin will review it.",
    });
  } catch (error) {
    console.error("Wallet withdraw error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to withdraw" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wallet/withdraw - Get user's withdrawal requests
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const requests = await getUserWithdrawalRequests(user.id);

    return NextResponse.json({
      ok: true,
      requests,
    });
  } catch (error) {
    console.error("Get withdrawal requests error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get withdrawal requests" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wallet/withdraw - Cancel a withdrawal request
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("id");

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    const cancelledRequest = await cancelWithdrawalRequest(requestId, user.id);

    return NextResponse.json({
      ok: true,
      request: cancelledRequest,
      message: "Withdrawal request cancelled",
    });
  } catch (error) {
    console.error("Cancel withdrawal request error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to cancel request" },
      { status: 500 }
    );
  }
}
