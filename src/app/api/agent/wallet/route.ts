import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  createAgentWithdrawalRequest,
  getAgentByUserId,
  getAgentWalletSummary,
  listAgentWithdrawalRequests,
} from "@/lib/db/agents";
import {
  broadcastAgentWithdrawalToAdmins,
  broadcastAgentWithdrawalToAgent,
} from "@/app/api/agent/wallet/stream/route";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "agent" && user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const agent = await getAgentByUserId(user.id);
  if (!agent) {
    return NextResponse.json({ ok: false, error: "NOT_AGENT" }, { status: 403 });
  }

  const [summary, requests] = await Promise.all([
    getAgentWalletSummary(user.id),
    listAgentWithdrawalRequests(user.id, 50, 0),
  ]);

  return NextResponse.json({ ok: true, summary, requests, agent });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "agent") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const agent = await getAgentByUserId(user.id);
  if (!agent || !agent.isActive) {
    return NextResponse.json({ ok: false, error: "AGENT_INACTIVE" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const amount = Number(body.amount);

    const req = await createAgentWithdrawalRequest({
      agentUserId: user.id,
      amount,
      agentNote: body.agentNote,
      payoutMethod: body.payoutMethod,
      payoutBankName: body.payoutBankName,
      payoutAccountName: body.payoutAccountName,
      payoutAccountNumber: body.payoutAccountNumber,
      payoutIban: body.payoutIban,
    });

    const agentName = user.displayName || user.email || user.phone || "Agent";

    broadcastAgentWithdrawalToAdmins({
      type: "withdrawal_requested",
      requestId: req.id,
      agentUserId: user.id,
      agentName,
      amount: req.requestedAmount,
      status: req.status,
      createdAt: req.createdAt,
      message: "AGENT_WITHDRAWAL_REQUEST_CREATED",
    });

    broadcastAgentWithdrawalToAgent(user.id, {
      type: "withdrawal_requested",
      requestId: req.id,
      agentUserId: user.id,
      agentName,
      amount: req.requestedAmount,
      status: req.status,
      createdAt: req.createdAt,
      message: "AGENT_WITHDRAWAL_REQUEST_CREATED",
    });

    return NextResponse.json({ ok: true, request: req });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "ACTION_FAILED" },
      { status: 400 }
    );
  }
}
