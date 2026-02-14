import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  createAgent,
  listAgents,
  updateAgent,
  deactivateAgent,
  markCommissionPaid,
} from "@/lib/db/agents";
import { getUserWallet, transferFunds } from "@/lib/db/wallet";
import { broadcastWalletEvent } from "@/app/api/wallet/stream/route";
import { query } from "@/lib/db/postgres";

export const runtime = "nodejs";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function isAdmin(user: { role?: string } | null) {
  return user && user.role === "admin";
}

/** GET /api/admin/agents — list all agents */
export async function GET() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const agents = await listAgents();
  return NextResponse.json({ ok: true, agents });
}

/** POST /api/admin/agents — create or promote user to agent */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { userId, commissionRate, notes } = await request.json();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "USER_ID_REQUIRED" }, { status: 400 });
    }

    // Verify user exists
    const userCheck = await query(`SELECT id, role FROM users WHERE id = $1`, [userId]);
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    const agent = await createAgent(userId, commissionRate || 0, notes);
    return NextResponse.json({ ok: true, agent });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(e, "CREATE_FAILED") },
      { status: 400 }
    );
  }
}

/** PATCH /api/admin/agents — update agent */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { userId, action, ...updates } = await request.json();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "USER_ID_REQUIRED" }, { status: 400 });
    }

    if (action === "deactivate") {
      const agent = await deactivateAgent(userId);
      return NextResponse.json({ ok: true, agent });
    }

    if (action === "activate") {
      await query(`UPDATE users SET role = 'agent', updated_at = NOW() WHERE id = $1`, [userId]);
      const agent = await updateAgent(userId, { isActive: true });
      return NextResponse.json({ ok: true, agent });
    }

    if (action === "mark-paid") {
      const { commissionId } = updates as { commissionId?: string };
      if (!commissionId) {
        return NextResponse.json({ ok: false, error: "COMMISSION_ID_REQUIRED" }, { status: 400 });
      }
      const commission = await markCommissionPaid(commissionId);
      return NextResponse.json({ ok: true, commission });
    }

    if (action === "charge-wallet") {
      const { amount, description } = updates as {
        amount?: number | string;
        description?: string;
      };
      const adminDisplayName =
        user.displayName?.trim() || user.email || "Admin";
      const customDescription = description?.trim();
      const transferDescription = customDescription
        ? `${customDescription} — by ${adminDisplayName}`
        : `Transfer by ${adminDisplayName}`;
      const parsedAmount = typeof amount === "number" ? amount : parseFloat(String(amount ?? ""));
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ ok: false, error: "INVALID_AMOUNT" }, { status: 400 });
      }

      const recipientRes = await query<{ id: string; phone: string | null }>(
        `SELECT id, phone FROM users WHERE id = $1`,
        [userId]
      );
      if (recipientRes.rows.length === 0) {
        return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
      }

      const recipientPhone = (recipientRes.rows[0].phone || "").trim();
      if (!recipientPhone) {
        return NextResponse.json({ ok: false, error: "AGENT_PHONE_REQUIRED" }, { status: 400 });
      }

      const senderWallet = await getUserWallet(user.id);
      if (!senderWallet) {
        return NextResponse.json({ ok: false, error: "ADMIN_WALLET_NOT_FOUND" }, { status: 404 });
      }

      const transfer = await transferFunds(
        user.id,
        recipientPhone,
        parsedAmount,
        transferDescription
      );

      broadcastWalletEvent(user.id, {
        type: "transfer_out",
        amount: parsedAmount,
        balance: transfer.fromWallet.balance,
        toUser: transfer.toWallet.accountNumber,
        description: transferDescription,
      });

      broadcastWalletEvent(userId, {
        type: "transfer_in",
        amount: parsedAmount,
        balance: transfer.toWallet.balance,
        fromUser: transfer.fromWallet.accountNumber,
        description: customDescription
          ? `${customDescription} — from ${adminDisplayName}`
          : `Received from ${adminDisplayName}`,
      });

      return NextResponse.json({
        ok: true,
        transfer: {
          amount: parsedAmount,
          fromAccountNumber: transfer.fromWallet.accountNumber,
          toAccountNumber: transfer.toWallet.accountNumber,
          fromBalance: transfer.fromWallet.balance,
          toBalance: transfer.toWallet.balance,
        },
      });
    }

    const updatePayload: { commissionRate?: number; isActive?: boolean; notes?: string } = {};
    if (updates.commissionRate !== undefined) updatePayload.commissionRate = parseFloat(updates.commissionRate);
    if (updates.isActive !== undefined) updatePayload.isActive = updates.isActive;
    if (updates.notes !== undefined) updatePayload.notes = updates.notes;

    const agent = await updateAgent(userId, updatePayload);
    return NextResponse.json({ ok: true, agent });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: getErrorMessage(e, "UPDATE_FAILED") },
      { status: 400 }
    );
  }
}
