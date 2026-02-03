/**
 * Wallet Transfer API
 * POST /api/wallet/transfer - Transfer funds to another wallet
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { transferFunds, getUserWallet, getWalletByAccountNumber, getUserByPhone } from "@/lib/db/wallet";
import { broadcastWalletEvent } from "@/app/api/wallet/stream/route";
import { sendText, formatChatId, isWAHAEnabled } from "@/lib/waha/client";
import { getUserById } from "@/lib/db/users";

const transferSchema = z.object({
  toAccountNumber: z.string().min(1, "Account number required"),
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
    const validation = transferSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { toAccountNumber, amount, description } = validation.data;

    // Check sender wallet exists
    const senderWallet = await getUserWallet(user.id);
    if (!senderWallet) {
      return NextResponse.json(
        { ok: false, error: "Your wallet not found" },
        { status: 404 }
      );
    }

    // Check balance
    if (senderWallet.balance < amount) {
      return NextResponse.json(
        { ok: false, error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Validate receiver exists
    const receiverWallet = await getWalletByAccountNumber(toAccountNumber);
    if (!receiverWallet) {
      const receiverUser = await getUserByPhone(toAccountNumber);
      if (!receiverUser) {
        return NextResponse.json(
          { ok: false, error: "Receiver wallet not found" },
          { status: 404 }
        );
      }
    }

    // Transfer funds
    const result = await transferFunds(user.id, toAccountNumber, amount, description);

    // Broadcast real-time events to both sender and receiver
    broadcastWalletEvent(user.id, {
      type: "transfer_out",
      amount,
      balance: result.fromWallet.balance,
      toUser: result.toWallet.accountNumber,
      description: description || `Transfer to ${result.toWallet.accountNumber}`,
    });

    broadcastWalletEvent(result.toWallet.userId, {
      type: "transfer_in",
      amount,
      balance: result.toWallet.balance,
      fromUser: result.fromWallet.accountNumber,
      description: description || `Received from ${result.fromWallet.accountNumber}`,
    });

    // Send WhatsApp notifications
    if (isWAHAEnabled()) {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-OM", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Notify sender
      if (user.phone) {
        const senderMsg = `💸 *Wallet Transfer - SBC*

📤 Amount Sent: *${amount.toFixed(3)} OMR*
📍 To: ${result.toWallet.accountNumber}
💵 New Balance: *${result.fromWallet.balance.toFixed(3)} OMR*
📅 Date: ${dateStr}
${description ? `📝 Note: ${description}` : ""}

https://sbc.om`;
        sendText({ chatId: formatChatId(user.phone), text: senderMsg }).catch(console.error);
      }

      // Notify receiver
      const receiverUser = await getUserById(result.toWallet.userId);
      if (receiverUser?.phone) {
        const receiverMsg = `💰 *Wallet Received - SBC*

📥 Amount Received: *${amount.toFixed(3)} OMR*
📍 From: ${result.fromWallet.accountNumber}
💵 New Balance: *${result.toWallet.balance.toFixed(3)} OMR*
📅 Date: ${dateStr}
${description ? `📝 Note: ${description}` : ""}

https://sbc.om`;
        sendText({ chatId: formatChatId(receiverUser.phone), text: receiverMsg }).catch(console.error);
      }
    }

    return NextResponse.json({
      ok: true,
      fromWallet: {
        balance: result.fromWallet.balance,
        accountNumber: result.fromWallet.accountNumber,
      },
      toWallet: {
        accountNumber: result.toWallet.accountNumber,
      },
      transaction: result.outTransaction,
    });
  } catch (error) {
    console.error("Wallet transfer error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to transfer" },
      { status: 500 }
    );
  }
}
