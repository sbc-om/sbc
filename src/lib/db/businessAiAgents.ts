import { nanoid } from "nanoid";
import { z } from "zod";

import { query } from "./postgres";

/* ── Types ──────────────────────────────────────────────────────── */

export type BusinessAiAgent = {
  id: string;
  businessId: string;
  ownerId: string;
  name: string;
  description: string;
  plan: string;
  workflow: Record<string, unknown>;
  isActive: boolean;
  isDeployed: boolean;
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AgentRow = {
  id: string;
  business_id: string;
  owner_id: string;
  name: string;
  description: string | null;
  plan: string;
  workflow: Record<string, unknown>;
  is_active: boolean;
  is_deployed: boolean;
  execution_count: number;
  last_executed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

/* ── Validation ─────────────────────────────────────────────────── */

export const createAgentSchema = z.object({
  businessId: z.string().min(1),
  ownerId: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  plan: z.enum(["starter", "professional", "enterprise"]).default("starter"),
  workflow: z.record(z.string(), z.unknown()).default({}),
});

export const updateAgentSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  workflow: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
  isDeployed: z.boolean().optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

/* ── Helpers ────────────────────────────────────────────────────── */

function rowToAgent(r: AgentRow): BusinessAiAgent {
  return {
    id: r.id,
    businessId: r.business_id,
    ownerId: r.owner_id,
    name: r.name,
    description: r.description ?? "",
    plan: r.plan,
    workflow: r.workflow ?? {},
    isActive: r.is_active ?? true,
    isDeployed: r.is_deployed ?? false,
    executionCount: r.execution_count ?? 0,
    lastExecutedAt: r.last_executed_at?.toISOString() ?? null,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

/* ── CRUD ───────────────────────────────────────────────────────── */

export async function createBusinessAiAgent(input: CreateAgentInput): Promise<BusinessAiAgent> {
  const data = createAgentSchema.parse(input);
  const id = nanoid();
  const now = new Date();

  const result = await query<AgentRow>(
    `INSERT INTO business_ai_agents
       (id, business_id, owner_id, name, description, plan, workflow, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
     RETURNING *`,
    [id, data.businessId, data.ownerId, data.name, data.description, data.plan, JSON.stringify(data.workflow), now],
  );

  return rowToAgent(result.rows[0]);
}

export async function getBusinessAiAgentById(id: string): Promise<BusinessAiAgent | null> {
  const result = await query<AgentRow>(
    `SELECT * FROM business_ai_agents WHERE id = $1`,
    [id],
  );
  return result.rows.length > 0 ? rowToAgent(result.rows[0]) : null;
}

export async function listBusinessAiAgents(businessId: string): Promise<BusinessAiAgent[]> {
  const result = await query<AgentRow>(
    `SELECT * FROM business_ai_agents WHERE business_id = $1 ORDER BY updated_at DESC`,
    [businessId],
  );
  return result.rows.map(rowToAgent);
}

export async function listBusinessAiAgentsByOwner(ownerId: string): Promise<BusinessAiAgent[]> {
  const result = await query<AgentRow>(
    `SELECT * FROM business_ai_agents WHERE owner_id = $1 ORDER BY updated_at DESC`,
    [ownerId],
  );
  return result.rows.map(rowToAgent);
}

export async function updateBusinessAiAgent(
  id: string,
  ownerId: string,
  input: UpdateAgentInput,
): Promise<BusinessAiAgent> {
  const data = updateAgentSchema.parse(input);
  const now = new Date();

  const sets: string[] = ["updated_at = $2"];
  const params: unknown[] = [id, now];
  let idx = 3;

  if (data.name !== undefined) {
    sets.push(`name = $${idx}`);
    params.push(data.name);
    idx++;
  }
  if (data.description !== undefined) {
    sets.push(`description = $${idx}`);
    params.push(data.description);
    idx++;
  }
  if (data.workflow !== undefined) {
    sets.push(`workflow = $${idx}`);
    params.push(JSON.stringify(data.workflow));
    idx++;
  }
  if (data.isActive !== undefined) {
    sets.push(`is_active = $${idx}`);
    params.push(data.isActive);
    idx++;
  }
  if (data.isDeployed !== undefined) {
    sets.push(`is_deployed = $${idx}`);
    params.push(data.isDeployed);
    idx++;
  }

  const result = await query<AgentRow>(
    `UPDATE business_ai_agents SET ${sets.join(", ")} WHERE id = $1 AND owner_id = $${idx} RETURNING *`,
    [...params, ownerId],
  );

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToAgent(result.rows[0]);
}

export async function deleteBusinessAiAgent(id: string, ownerId: string): Promise<void> {
  const result = await query(
    `DELETE FROM business_ai_agents WHERE id = $1 AND owner_id = $2`,
    [id, ownerId],
  );
  if (result.rowCount === 0) throw new Error("NOT_FOUND");
}

export async function countBusinessAiAgents(businessId: string): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM business_ai_agents WHERE business_id = $1`,
    [businessId],
  );
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

export async function incrementAgentExecution(id: string): Promise<void> {
  await query(
    `UPDATE business_ai_agents SET execution_count = execution_count + 1, last_executed_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [id],
  );
}

/** Max agents per plan */
export const PLAN_LIMITS = {
  starter: { maxAgents: 1, maxNodes: 8 },
  professional: { maxAgents: 5, maxNodes: 25 },
  enterprise: { maxAgents: 999, maxNodes: 999 },
} as const;
