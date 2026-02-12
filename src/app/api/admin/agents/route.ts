import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  createAgent,
  listAgents,
  updateAgent,
  deactivateAgent,
  getAgentByUserId,
  markCommissionPaid,
} from "@/lib/db/agents";
import { query } from "@/lib/db/postgres";

export const runtime = "nodejs";

function isAdmin(user: any) {
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
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "CREATE_FAILED" },
      { status: 400 }
    );
  }
}

/** PATCH /api/admin/agents — update agent */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
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
      const { commissionId } = updates as any;
      if (!commissionId) {
        return NextResponse.json({ ok: false, error: "COMMISSION_ID_REQUIRED" }, { status: 400 });
      }
      const commission = await markCommissionPaid(commissionId);
      return NextResponse.json({ ok: true, commission });
    }

    const updatePayload: Record<string, any> = {};
    if (updates.commissionRate !== undefined) updatePayload.commissionRate = parseFloat(updates.commissionRate);
    if (updates.isActive !== undefined) updatePayload.isActive = updates.isActive;
    if (updates.notes !== undefined) updatePayload.notes = updates.notes;

    const agent = await updateAgent(userId, updatePayload);
    return NextResponse.json({ ok: true, agent });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "UPDATE_FAILED" },
      { status: 400 }
    );
  }
}
