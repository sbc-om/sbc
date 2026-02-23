import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  getBusinessAiAgentById,
  updateBusinessAiAgent,
  deleteBusinessAiAgent,
} from "@/lib/db/businessAiAgents";

/**
 * @swagger
 * /api/agent-builder/{id}:
 *   get:
 *     summary: Get an AI agent by ID
 *     tags: [AgentBuilder]
 *   patch:
 *     summary: Update an AI agent
 *     tags: [AgentBuilder]
 *   delete:
 *     summary: Delete an AI agent
 *     tags: [AgentBuilder]
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const agent = await getBusinessAiAgentById(id);
  if (!agent || agent.ownerId !== user.id) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, agent });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const agent = await updateBusinessAiAgent(id, user.id, body);
    return NextResponse.json({ ok: true, agent });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    console.error("Update AI agent error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await deleteBusinessAiAgent(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    console.error("Delete AI agent error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
