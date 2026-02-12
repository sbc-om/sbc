import { nanoid } from "nanoid";
import { query } from "./postgres";

/* ─── Types ─── */
export type Agent = {
  userId: string;
  commissionRate: number;
  totalEarned: number;
  totalClients: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentWithUser = Agent & {
  userName: string;
  userEmail: string;
  userPhone: string;
  userAvatar: string | null;
};

export type AgentCommission = {
  id: string;
  agentUserId: string;
  clientUserId: string | null;
  orderId: string | null;
  subscriptionId: string | null;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "paid";
  paidAt: string | null;
  createdAt: string;
};

export type AgentClient = {
  agentUserId: string;
  clientUserId: string;
  createdAt: string;
};

export type AgentClientWithUser = AgentClient & {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAvatar: string | null;
};

/* ─── Row mappers ─── */
function rowToAgent(row: any): Agent {
  return {
    userId: row.user_id,
    commissionRate: parseFloat(row.commission_rate) || 0,
    totalEarned: parseFloat(row.total_earned) || 0,
    totalClients: parseInt(row.total_clients, 10) || 0,
    isActive: row.is_active ?? true,
    notes: row.notes || null,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function rowToCommission(row: any): AgentCommission {
  return {
    id: row.id,
    agentUserId: row.agent_user_id,
    clientUserId: row.client_user_id,
    orderId: row.order_id,
    subscriptionId: row.subscription_id,
    amount: parseFloat(row.amount) || 0,
    commissionRate: parseFloat(row.commission_rate) || 0,
    commissionAmount: parseFloat(row.commission_amount) || 0,
    status: row.status || "pending",
    paidAt: row.paid_at?.toISOString() || null,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
  };
}

/* ─── Agent CRUD ─── */

/** Create or update agent profile for a user */
export async function createAgent(
  userId: string,
  commissionRate: number,
  notes?: string
): Promise<Agent> {
  // Set user role to agent
  await query(`UPDATE users SET role = 'agent', updated_at = NOW() WHERE id = $1`, [userId]);

  const result = await query(
    `INSERT INTO agents (user_id, commission_rate, notes, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       commission_rate = $2,
       notes = COALESCE($3, agents.notes),
       updated_at = NOW()
     RETURNING *`,
    [userId, commissionRate, notes || null]
  );
  return rowToAgent(result.rows[0]);
}

/** Get agent by user ID */
export async function getAgentByUserId(userId: string): Promise<Agent | null> {
  const result = await query(`SELECT * FROM agents WHERE user_id = $1`, [userId]);
  return result.rows.length > 0 ? rowToAgent(result.rows[0]) : null;
}

/** Return just the user_ids of all active agents (lightweight) */
export async function listAgentUserIds(): Promise<string[]> {
  const result = await query(`SELECT user_id FROM agents WHERE is_active = true`);
  return result.rows.map((r: any) => r.user_id);
}

/** List all agents with user info */
export async function listAgents(): Promise<AgentWithUser[]> {
  const result = await query(`
    SELECT a.*, u.email as user_email, COALESCE(u.display_name, u.email) as user_name,
           u.phone as user_phone, u.avatar_url as user_avatar
    FROM agents a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
  `);
  return result.rows.map((row: any) => ({
    ...rowToAgent(row),
    userName: row.user_name || "",
    userEmail: row.user_email || "",
    userPhone: row.user_phone || "",
    userAvatar: row.user_avatar || null,
  }));
}

/** Update agent */
export async function updateAgent(
  userId: string,
  updates: { commissionRate?: number; isActive?: boolean; notes?: string }
): Promise<Agent> {
  const sets: string[] = ["updated_at = NOW()"];
  const vals: any[] = [];
  let idx = 1;

  if (updates.commissionRate !== undefined) {
    sets.push(`commission_rate = $${idx++}`);
    vals.push(updates.commissionRate);
  }
  if (updates.isActive !== undefined) {
    sets.push(`is_active = $${idx++}`);
    vals.push(updates.isActive);
  }
  if (updates.notes !== undefined) {
    sets.push(`notes = $${idx++}`);
    vals.push(updates.notes);
  }
  vals.push(userId);

  const result = await query(
    `UPDATE agents SET ${sets.join(", ")} WHERE user_id = $${idx} RETURNING *`,
    vals
  );
  if (result.rows.length === 0) throw new Error("AGENT_NOT_FOUND");
  return rowToAgent(result.rows[0]);
}

/** Remove agent role (soft - deactivate) */
export async function deactivateAgent(userId: string): Promise<Agent> {
  await query(`UPDATE users SET role = 'user', updated_at = NOW() WHERE id = $1`, [userId]);
  return updateAgent(userId, { isActive: false });
}

/* ─── Agent Clients ─── */

/** Add client to agent */
export async function addAgentClient(agentUserId: string, clientUserId: string): Promise<void> {
  await query(
    `INSERT INTO agent_clients (agent_user_id, client_user_id, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (agent_user_id, client_user_id) DO NOTHING`,
    [agentUserId, clientUserId]
  );
  // Update total_clients count
  await query(
    `UPDATE agents SET total_clients = (
       SELECT COUNT(*) FROM agent_clients WHERE agent_user_id = $1
     ), updated_at = NOW() WHERE user_id = $1`,
    [agentUserId]
  );
}

/** Remove client from agent */
export async function removeAgentClient(agentUserId: string, clientUserId: string): Promise<void> {
  await query(
    `DELETE FROM agent_clients WHERE agent_user_id = $1 AND client_user_id = $2`,
    [agentUserId, clientUserId]
  );
  await query(
    `UPDATE agents SET total_clients = (
       SELECT COUNT(*) FROM agent_clients WHERE agent_user_id = $1
     ), updated_at = NOW() WHERE user_id = $1`,
    [agentUserId]
  );
}

/** List agent's clients with user info */
export async function listAgentClients(agentUserId: string): Promise<AgentClientWithUser[]> {
  const result = await query(
    `SELECT ac.*, u.email as client_email, COALESCE(u.display_name, u.email) as client_name,
            u.phone as client_phone, u.avatar_url as client_avatar
     FROM agent_clients ac
     LEFT JOIN users u ON ac.client_user_id = u.id
     WHERE ac.agent_user_id = $1
     ORDER BY ac.created_at DESC`,
    [agentUserId]
  );
  return result.rows.map((row: any) => ({
    agentUserId: row.agent_user_id,
    clientUserId: row.client_user_id,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    clientName: row.client_name || "",
    clientEmail: row.client_email || "",
    clientPhone: row.client_phone || "",
    clientAvatar: row.client_avatar || null,
  }));
}

/** Check if a user is an agent's client */
export async function isAgentClient(agentUserId: string, clientUserId: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM agent_clients WHERE agent_user_id = $1 AND client_user_id = $2`,
    [agentUserId, clientUserId]
  );
  return result.rows.length > 0;
}

/** Get which agent manages a user */
export async function getClientAgent(clientUserId: string): Promise<string | null> {
  const result = await query(
    `SELECT agent_user_id FROM agent_clients WHERE client_user_id = $1 LIMIT 1`,
    [clientUserId]
  );
  return result.rows.length > 0 ? result.rows[0].agent_user_id : null;
}

/* ─── Commissions ─── */

/** Record a commission for an agent */
export async function createCommission(data: {
  agentUserId: string;
  clientUserId: string;
  orderId?: string;
  subscriptionId?: string;
  amount: number;
  commissionRate: number;
}): Promise<AgentCommission> {
  const id = nanoid();
  const commissionAmount = Math.round(data.amount * (data.commissionRate / 100) * 1000) / 1000;

  const result = await query(
    `INSERT INTO agent_commissions (id, agent_user_id, client_user_id, order_id, subscription_id, amount, commission_rate, commission_amount, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
     RETURNING *`,
    [
      id,
      data.agentUserId,
      data.clientUserId,
      data.orderId || null,
      data.subscriptionId || null,
      data.amount,
      data.commissionRate,
      commissionAmount,
    ]
  );

  // Update agent total earned
  await query(
    `UPDATE agents SET total_earned = total_earned + $1, updated_at = NOW() WHERE user_id = $2`,
    [commissionAmount, data.agentUserId]
  );

  return rowToCommission(result.rows[0]);
}

/** List commissions for an agent */
export async function listAgentCommissions(agentUserId: string): Promise<(AgentCommission & { clientName: string })[]> {
  const result = await query(
    `SELECT ac.*, COALESCE(u.display_name, u.email) as client_name
     FROM agent_commissions ac
     LEFT JOIN users u ON ac.client_user_id = u.id
     WHERE ac.agent_user_id = $1
     ORDER BY ac.created_at DESC`,
    [agentUserId]
  );
  return result.rows.map((row: any) => ({
    ...rowToCommission(row),
    clientName: row.client_name || "",
  }));
}

/** List all commissions (admin) */
export async function listAllCommissions(): Promise<(AgentCommission & { agentName: string; clientName: string })[]> {
  const result = await query(
    `SELECT ac.*,
            COALESCE(au.display_name, au.email) as agent_name,
            COALESCE(cu.display_name, cu.email) as client_name
     FROM agent_commissions ac
     LEFT JOIN users au ON ac.agent_user_id = au.id
     LEFT JOIN users cu ON ac.client_user_id = cu.id
     ORDER BY ac.created_at DESC`
  );
  return result.rows.map((row: any) => ({
    ...rowToCommission(row),
    agentName: row.agent_name || "",
    clientName: row.client_name || "",
  }));
}

/** Mark commission as paid */
export async function markCommissionPaid(id: string): Promise<AgentCommission> {
  const result = await query(
    `UPDATE agent_commissions SET status = 'paid', paid_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) throw new Error("COMMISSION_NOT_FOUND");
  return rowToCommission(result.rows[0]);
}

/** Get agent stats summary */
export async function getAgentStats(agentUserId: string) {
  const result = await query(
    `SELECT
       (SELECT COUNT(*) FROM agent_clients WHERE agent_user_id = $1) as total_clients,
       (SELECT COALESCE(SUM(commission_amount), 0) FROM agent_commissions WHERE agent_user_id = $1) as total_earned,
       (SELECT COALESCE(SUM(commission_amount), 0) FROM agent_commissions WHERE agent_user_id = $1 AND status = 'pending') as pending_amount,
       (SELECT COUNT(*) FROM agent_commissions WHERE agent_user_id = $1) as total_transactions`,
    [agentUserId]
  );
  const row = result.rows[0];
  return {
    totalClients: parseInt(row.total_clients, 10) || 0,
    totalEarned: parseFloat(row.total_earned) || 0,
    pendingAmount: parseFloat(row.pending_amount) || 0,
    totalTransactions: parseInt(row.total_transactions, 10) || 0,
  };
}
