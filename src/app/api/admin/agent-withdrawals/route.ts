import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  countAgentWithdrawalRequests,
  listAllAgentWithdrawalRequests,
  processAgentWithdrawalRequest,
} from "@/lib/db/agents";
import {
  broadcastAgentWithdrawalToAdmins,
  broadcastAgentWithdrawalToAgent,
} from "@/app/api/agent/wallet/stream/route";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const perPage = Math.min(50, Math.max(10, parseInt(sp.get("perPage") || "20", 10)));
  const search = sp.get("search") || undefined;
  const agentUserId = sp.get("agentUserId") || undefined;
  const offset = (page - 1) * perPage;

  const filterStatus =
    status === "pending" || status === "approved" || status === "rejected"
      ? status
      : undefined;

  const [requests, total] = await Promise.all([
    listAllAgentWithdrawalRequests(filterStatus, perPage, offset, search, agentUserId),
    countAgentWithdrawalRequests(filterStatus, search, agentUserId),
  ]);

  return NextResponse.json({
    ok: true,
    requests,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await processAgentWithdrawalRequest({
      requestId: body.requestId,
      action: body.action,
      processedBy: user.id,
      approvedAmount: body.approvedAmount,
      adminNote: body.adminNote,
      payoutMethod: body.payoutMethod,
      payoutReference: body.payoutReference,
      payoutReceiptUrl: body.payoutReceiptUrl,
      payoutBankName: body.payoutBankName,
      payoutAccountName: body.payoutAccountName,
      payoutAccountNumber: body.payoutAccountNumber,
      payoutIban: body.payoutIban,
    });

    const eventPayload = {
      type: "withdrawal_processed" as const,
      requestId: result.id,
      agentUserId: result.agentUserId,
      amount: result.requestedAmount,
      approvedAmount: result.approvedAmount,
      status: result.status,
      adminNote: result.adminNote,
      payoutReference: result.payoutReference,
      payoutReceiptUrl: result.payoutReceiptUrl,
      message: "AGENT_WITHDRAWAL_REQUEST_PROCESSED",
      createdAt: result.updatedAt,
    };

    broadcastAgentWithdrawalToAgent(result.agentUserId, eventPayload);
    broadcastAgentWithdrawalToAdmins(eventPayload);

    return NextResponse.json({ ok: true, request: result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "ACTION_FAILED" },
      { status: 400 }
    );
  }
}
