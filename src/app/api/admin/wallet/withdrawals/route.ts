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
  countWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  getUserWallet,
  type WithdrawalRequestStatus,
} from "@/lib/db/wallet";
import { broadcastWalletEvent } from "@/app/api/wallet/stream/route";
import { sendText, formatChatId, isWAHAEnabled } from "@/lib/waha/client";
import { getUserById } from "@/lib/db/users";

const PER_PAGE = 20;

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
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const limit = PER_PAGE;
    const offset = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      getAllWithdrawalRequests(status || undefined, limit, offset, search),
      countWithdrawalRequests(status || undefined, search),
    ]);

    return NextResponse.json({
      ok: true,
      requests,
      pagination: {
        page,
        perPage: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

      // Send WhatsApp notification
      if (isWAHAEnabled()) {
        const targetUser = await getUserById(result.request.userId);
        if (targetUser?.phone) {
          const now = new Date();
          const dateStr = now.toLocaleDateString("en-OM", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const whatsappMsg = `✅ *Withdrawal Approved - SBC*

💸 Amount: *${result.request.amount.toFixed(3)} OMR*
💵 New Balance: *${result.transaction.balanceAfter.toFixed(3)} OMR*
📅 Date: ${dateStr}
${message ? `📝 Admin Note: ${message}` : ""}

Your withdrawal has been processed successfully.

https://sbc.om`;
          sendText({ chatId: formatChatId(targetUser.phone), text: whatsappMsg }).catch(console.error);
        }
      }
      
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

      // Send WhatsApp notification
      if (isWAHAEnabled()) {
        const targetUser = await getUserById(result.userId);
        if (targetUser?.phone) {
          const now = new Date();
          const dateStr = now.toLocaleDateString("en-OM", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const whatsappMsg = `❌ *Withdrawal Rejected - SBC*

💸 Amount: *${result.amount.toFixed(3)} OMR*
📅 Date: ${dateStr}
${message ? `📝 Reason: ${message}` : ""}

Your withdrawal request has been rejected. Your balance remains unchanged.

https://sbc.om`;
          sendText({ chatId: formatChatId(targetUser.phone), text: whatsappMsg }).catch(console.error);
        }
      }
      
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
