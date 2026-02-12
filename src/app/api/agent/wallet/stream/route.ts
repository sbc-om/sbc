import { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Connection = ReadableStreamDefaultController<Uint8Array>;

const adminConnections = new Set<Connection>();
const agentConnections = new Map<string, Set<Connection>>();

type AgentWithdrawalEventType = "connected" | "withdrawal_requested" | "withdrawal_processed";

export type AgentWithdrawalStreamEvent = {
  type: AgentWithdrawalEventType;
  requestId?: string;
  agentUserId?: string;
  agentName?: string;
  amount?: number;
  approvedAmount?: number | null;
  status?: "pending" | "approved" | "rejected";
  adminNote?: string | null;
  payoutReference?: string | null;
  payoutReceiptUrl?: string | null;
  message?: string;
  createdAt?: string;
};

function encodeSSE(data: AgentWithdrawalStreamEvent) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

function emitToConnection(connection: Connection, event: AgentWithdrawalStreamEvent) {
  try {
    connection.enqueue(encodeSSE(event));
  } catch {
    // Closed connection; cleanup happens on abort.
  }
}

export function broadcastAgentWithdrawalToAdmins(event: AgentWithdrawalStreamEvent) {
  for (const connection of adminConnections) {
    emitToConnection(connection, event);
  }
}

export function broadcastAgentWithdrawalToAgent(agentUserId: string, event: AgentWithdrawalStreamEvent) {
  const listeners = agentConnections.get(agentUserId);
  if (!listeners || listeners.size === 0) return;

  for (const connection of listeners) {
    emitToConnection(connection, event);
  }
}

function cleanupConnection(params: { role: "admin" | "agent"; userId: string; connection: Connection }) {
  const { role, userId, connection } = params;

  if (role === "admin") {
    adminConnections.delete(connection);
    return;
  }

  const listeners = agentConnections.get(userId);
  if (!listeners) return;
  listeners.delete(connection);
  if (listeners.size === 0) {
    agentConnections.delete(userId);
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "agent")) {
    return new Response("Forbidden", { status: 403 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (user.role === "admin") {
        adminConnections.add(controller);
      } else {
        if (!agentConnections.has(user.id)) {
          agentConnections.set(user.id, new Set());
        }
        agentConnections.get(user.id)!.add(controller);
      }

      emitToConnection(controller, {
        type: "connected",
        message: "AGENT_WALLET_STREAM_CONNECTED",
      });

      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        cleanupConnection({
          role: user.role === "admin" ? "admin" : "agent",
          userId: user.id,
          connection: controller,
        });
        try {
          controller.close();
        } catch {
          // no-op
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
