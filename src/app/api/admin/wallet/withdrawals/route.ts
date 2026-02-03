/**
 * Admin Wallet Withdrawals API
 * GET /api/admin/wallet/withdrawals - Get all withdrawal requests
 * POST /api/admin/wallet/withdrawals - Approve/reject a withdrawal request
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  getUserWallet,
  type WithdrawalRequestStatus,
} from "@/lib/db/wallet";
import { broadcastWalletEvent } from "@/app/api/wallet/stream/route";

/**
 * GET /api/admin/wallet/withdrawals - Get all withdrawal requests
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get("status") as WithdrawalRequestStatus | null;
    const requests = await getAllWithdrawalRequests(status || undefined);

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

const actionSchema = z.object({
  requestId: z.string().min(1, "Request ID required"),
  action: z.enum(["approve", "reject"]),
  message: z.string().optional(),
});

/**
 * POST /api/admin/wallet/withdrawals - Approve/reject a withdrawal request
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = actionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { requestId, action, message } = validation.data;

    if (action === "approve") {
      const result = await approveWithdrawalRequest(requestId, message);
      
      // Broadcast real-time event to the user
      broadcastWalletEvent(result.request.userId, {
        type: "withdraw_approved",
        amount: result.request.amount,
        balance: result.transaction.balanceAfter,
        message: message || "Withdrawal approved",
      });
      
      return NextResponse.json({
        ok: true,
        request: result.request,
        transaction: result.transaction,
      });
    } else {
      const result = await rejectWithdrawalRequest(requestId, message);
      
      // Get user's current balance
      const wallet = await getUserWallet(result.userId);
      
      // Broadcast real-time event to the user
      broadcastWalletEvent(result.userId, {
        type: "withdraw_rejected",
        amount: result.amount,
        balance: wallet?.balance,
        message: message || "Withdrawal rejected",
      });
      
      return NextResponse.json({
        ok: true,
        request: result,
      });
    }
  } catch (error) {
    console.error("Process withdrawal request error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}
