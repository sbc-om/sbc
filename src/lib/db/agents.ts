import { nanoid } from "nanoid";
import { query } from "./postgres";

let agentWalletSchemaReady = false;

async function ensureAgentWalletSchema() {
  if (agentWalletSchemaReady) return;

  await query(`
    ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(15, 3) NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS agent_withdrawal_requests (
      id TEXT PRIMARY KEY,
      agent_user_id TEXT NOT NULL REFERENCES agents(user_id) ON DELETE CASCADE,
      requested_amount DECIMAL(15, 3) NOT NULL,
      approved_amount DECIMAL(15, 3),
      status TEXT NOT NULL DEFAULT 'pending',
      agent_note TEXT,
      admin_note TEXT,
      payout_method TEXT,
      payout_reference TEXT,
      payout_receipt_url TEXT,
      payout_bank_name TEXT,
      payout_account_name TEXT,
      payout_account_number TEXT,
      payout_iban TEXT,
      processed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      processed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_agent_withdrawals_agent ON agent_withdrawal_requests(agent_user_id);
    CREATE INDEX IF NOT EXISTS idx_agent_withdrawals_status ON agent_withdrawal_requests(status);
    CREATE INDEX IF NOT EXISTS idx_agent_withdrawals_created ON agent_withdrawal_requests(created_at DESC);
  `);

  agentWalletSchemaReady = true;
}

/* ─── Types ─── */
export type Agent = {
  userId: string;
  commissionRate: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalClients: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgentWithdrawalRequest = {
  id: string;
  agentUserId: string;
  requestedAmount: number;
  approvedAmount: number | null;
  status: "pending" | "approved" | "rejected";
  agentNote: string | null;
  adminNote: string | null;
  payoutMethod: string | null;
  payoutReference: string | null;
  payoutReceiptUrl: string | null;
  payoutBankName: string | null;
  payoutAccountName: string | null;
  payoutAccountNumber: string | null;
  payoutIban: string | null;
  processedBy: string | null;
  processedAt: string | null;
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
  clientIsPhoneVerified: boolean;
};

type AgentRow = {
  user_id: string;
  commission_rate: string | number | null;
  total_earned: string | number | null;
  total_withdrawn: string | number | null;
  total_clients: string | number | null;
  is_active: boolean | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type AgentWithUserRow = AgentRow & {
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  user_avatar: string | null;
};

type AgentCommissionRow = {
  id: string;
  agent_user_id: string;
  client_user_id: string | null;
  order_id: string | null;
  subscription_id: string | null;
  amount: string | number | null;
  commission_rate: string | number | null;
  commission_amount: string | number | null;
  status: "pending" | "paid";
  paid_at: Date | null;
  created_at: Date | null;
};

type AgentCommissionWithClientRow = AgentCommissionRow & {
  client_name: string | null;
};

type AgentCommissionWithNamesRow = AgentCommissionRow & {
  agent_name: string | null;
  client_name: string | null;
};

type AgentClientWithUserRow = {
  agent_user_id: string;
  client_user_id: string;
  created_at: Date | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_avatar: string | null;
  client_is_phone_verified: boolean | null;
};

type AgentWithdrawalRequestRow = {
  id: string;
  agent_user_id: string;
  requested_amount: string | number | null;
  approved_amount: string | number | null;
  status: "pending" | "approved" | "rejected";
  agent_note: string | null;
  admin_note: string | null;
  payout_method: string | null;
  payout_reference: string | null;
  payout_receipt_url: string | null;
  payout_bank_name: string | null;
  payout_account_name: string | null;
  payout_account_number: string | null;
  payout_iban: string | null;
  processed_by: string | null;
  processed_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

type AgentWithdrawalWithAgentRow = AgentWithdrawalRequestRow & {
  agent_name: string | null;
  agent_email: string | null;
  agent_phone: string | null;
};

type AgentStatsRow = {
  total_clients: string | number | null;
  total_sales: string | number | null;
  total_earned: string | number | null;
  pending_amount: string | number | null;
  total_withdrawn: string | number | null;
  pending_withdraw_requests: string | number | null;
  total_transactions: string | number | null;
};

type CountRow = { c: string };
type AgentUserIdRow = { user_id: string };
type ClientAgentRow = { agent_user_id: string };
type ClientAgentNameRow = {
  client_user_id: string;
  agent_user_id: string;
  agent_name: string | null;
  agent_avatar: string | null;
};

export type AssignedAgentSummary = {
  agentUserId: string;
  agentName: string;
  agentAvatar: string | null;
};

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return 0;
}

function toInt(value: string | number | null | undefined): number {
  if (typeof value === "number") return Math.trunc(value);
  if (typeof value === "string") return parseInt(value, 10) || 0;
  return 0;
}

/* ─── Row mappers ─── */
function rowToAgent(row: AgentRow): Agent {
  return {
    userId: row.user_id,
    commissionRate: toNumber(row.commission_rate),
    totalEarned: toNumber(row.total_earned),
    totalWithdrawn: toNumber(row.total_withdrawn),
    totalClients: toInt(row.total_clients),
    isActive: row.is_active ?? true,
    notes: row.notes || null,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function rowToAgentWithdrawalRequest(row: AgentWithdrawalRequestRow): AgentWithdrawalRequest {
  return {
    id: row.id,
    agentUserId: row.agent_user_id,
    requestedAmount: toNumber(row.requested_amount),
    approvedAmount: row.approved_amount != null ? toNumber(row.approved_amount) : null,
    status: row.status || "pending",
    agentNote: row.agent_note || null,
    adminNote: row.admin_note || null,
    payoutMethod: row.payout_method || null,
    payoutReference: row.payout_reference || null,
    payoutReceiptUrl: row.payout_receipt_url || null,
    payoutBankName: row.payout_bank_name || null,
    payoutAccountName: row.payout_account_name || null,
    payoutAccountNumber: row.payout_account_number || null,
    payoutIban: row.payout_iban || null,
    processedBy: row.processed_by || null,
    processedAt: row.processed_at?.toISOString() || null,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function rowToCommission(row: AgentCommissionRow): AgentCommission {
  return {
    id: row.id,
    agentUserId: row.agent_user_id,
    clientUserId: row.client_user_id,
    orderId: row.order_id,
    subscriptionId: row.subscription_id,
    amount: toNumber(row.amount),
    commissionRate: toNumber(row.commission_rate),
    commissionAmount: toNumber(row.commission_amount),
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

  const result = await query<AgentRow>(
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
  const result = await query<AgentRow>(`SELECT * FROM agents WHERE user_id = $1`, [userId]);
  return result.rows.length > 0 ? rowToAgent(result.rows[0]) : null;
}

/** Return just the user_ids of all active agents (lightweight) */
export async function listAgentUserIds(): Promise<string[]> {
  const result = await query<AgentUserIdRow>(`SELECT user_id FROM agents WHERE is_active = true`);
  return result.rows.map((r) => r.user_id);
}

/** List all agents with user info */
export async function listAgents(): Promise<AgentWithUser[]> {
  const result = await query<AgentWithUserRow>(`
    SELECT a.*, u.email as user_email, COALESCE(u.display_name, u.email) as user_name,
           u.phone as user_phone, u.avatar_url as user_avatar
    FROM agents a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
  `);
  return result.rows.map((row) => ({
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
  const vals: unknown[] = [];
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

  const result = await query<AgentRow>(
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
  const result = await query<AgentClientWithUserRow>(
    `SELECT ac.*, u.email as client_email, COALESCE(u.display_name, u.email) as client_name,
            u.phone as client_phone, u.avatar_url as client_avatar,
            u.is_phone_verified as client_is_phone_verified
     FROM agent_clients ac
     LEFT JOIN users u ON ac.client_user_id = u.id
     WHERE ac.agent_user_id = $1
     ORDER BY ac.created_at DESC`,
    [agentUserId]
  );
  return result.rows.map((row) => ({
    agentUserId: row.agent_user_id,
    clientUserId: row.client_user_id,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    clientName: row.client_name || "",
    clientEmail: row.client_email || "",
    clientPhone: row.client_phone || "",
    clientAvatar: row.client_avatar || null,
    clientIsPhoneVerified: row.client_is_phone_verified ?? false,
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
  const result = await query<ClientAgentRow>(
    `SELECT agent_user_id FROM agent_clients WHERE client_user_id = $1 LIMIT 1`,
    [clientUserId]
  );
  return result.rows.length > 0 ? result.rows[0].agent_user_id : null;
}

/** Get a map of client user id -> assigned agent summary */
export async function getAgentNamesForClientUsers(
  userIds: string[]
): Promise<Record<string, AssignedAgentSummary>> {
  if (userIds.length === 0) return {};

  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(", ");
  const result = await query<ClientAgentNameRow>(
    `SELECT DISTINCT ON (ac.client_user_id)
        ac.client_user_id,
        ac.agent_user_id,
        COALESCE(au.display_name, au.full_name, au.email) AS agent_name,
        au.avatar_url AS agent_avatar
     FROM agent_clients ac
     LEFT JOIN users au ON au.id = ac.agent_user_id
     WHERE ac.client_user_id IN (${placeholders})
     ORDER BY ac.client_user_id, ac.created_at DESC`,
    userIds
  );

  const out: Record<string, AssignedAgentSummary> = {};
  for (const row of result.rows) {
    if (row.agent_name) {
      out[row.client_user_id] = {
        agentUserId: row.agent_user_id,
        agentName: row.agent_name,
        agentAvatar: row.agent_avatar ?? null,
      };
    }
  }
  return out;
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

  const result = await query<AgentCommissionRow>(
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
  const result = await query<AgentCommissionWithClientRow>(
    `SELECT ac.*, COALESCE(u.display_name, u.email) as client_name
     FROM agent_commissions ac
     LEFT JOIN users u ON ac.client_user_id = u.id
     WHERE ac.agent_user_id = $1
     ORDER BY ac.created_at DESC`,
    [agentUserId]
  );
  return result.rows.map((row) => ({
    ...rowToCommission(row),
    clientName: row.client_name || "",
  }));
}

/** List all commissions (admin) */
export async function listAllCommissions(): Promise<(AgentCommission & { agentName: string; clientName: string })[]> {
  const result = await query<AgentCommissionWithNamesRow>(
    `SELECT ac.*,
            COALESCE(au.display_name, au.email) as agent_name,
            COALESCE(cu.display_name, cu.email) as client_name
     FROM agent_commissions ac
     LEFT JOIN users au ON ac.agent_user_id = au.id
     LEFT JOIN users cu ON ac.client_user_id = cu.id
     ORDER BY ac.created_at DESC`
  );
  return result.rows.map((row) => ({
    ...rowToCommission(row),
    agentName: row.agent_name || "",
    clientName: row.client_name || "",
  }));
}

/** Mark commission as paid */
export async function markCommissionPaid(id: string): Promise<AgentCommission> {
  const result = await query<AgentCommissionRow>(
    `UPDATE agent_commissions SET status = 'paid', paid_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) throw new Error("COMMISSION_NOT_FOUND");
  return rowToCommission(result.rows[0]);
}

/** Get agent stats summary */
export async function getAgentStats(agentUserId: string) {
  await ensureAgentWalletSchema();

  const result = await query<AgentStatsRow>(
    `SELECT
       (SELECT COUNT(*) FROM agent_clients WHERE agent_user_id = $1) as total_clients,
       (SELECT COALESCE(SUM(amount), 0) FROM agent_commissions WHERE agent_user_id = $1) as total_sales,
       (SELECT COALESCE(SUM(commission_amount), 0) FROM agent_commissions WHERE agent_user_id = $1) as total_earned,
       (SELECT COALESCE(SUM(commission_amount), 0) FROM agent_commissions WHERE agent_user_id = $1 AND status = 'pending') as pending_amount,
       (SELECT COALESCE(total_withdrawn, 0) FROM agents WHERE user_id = $1) as total_withdrawn,
       (SELECT COALESCE(SUM(requested_amount), 0) FROM agent_withdrawal_requests WHERE agent_user_id = $1 AND status = 'pending') as pending_withdraw_requests,
       (SELECT COUNT(*) FROM agent_commissions WHERE agent_user_id = $1) as total_transactions`,
    [agentUserId]
  );
  const row = result.rows[0];
  const totalEarned = toNumber(row.total_earned);
  const totalWithdrawn = toNumber(row.total_withdrawn);
  const pendingWithdrawRequests = toNumber(row.pending_withdraw_requests);
  return {
    totalClients: toInt(row.total_clients),
    totalSales: toNumber(row.total_sales),
    totalEarned,
    totalWithdrawn,
    pendingWithdrawRequests,
    availableWallet: Math.max(0, totalEarned - totalWithdrawn - pendingWithdrawRequests),
    pendingAmount: toNumber(row.pending_amount),
    totalTransactions: toInt(row.total_transactions),
  };
}

export async function getAgentWalletSummary(agentUserId: string) {
  await ensureAgentWalletSchema();

  const stats = await getAgentStats(agentUserId);
  const recentRequests = await listAgentWithdrawalRequests(agentUserId, 10, 0);
  return {
    ...stats,
    recentRequests,
  };
}

export async function createAgentWithdrawalRequest(input: {
  agentUserId: string;
  amount: number;
  agentNote?: string;
  payoutMethod?: string;
  payoutBankName?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  payoutIban?: string;
}) {
  await ensureAgentWalletSchema();

  const amount = Math.round(input.amount * 1000) / 1000;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const stats = await getAgentStats(input.agentUserId);
  if (amount > stats.availableWallet) {
    throw new Error("INSUFFICIENT_AGENT_WALLET");
  }

  const id = nanoid();
  const result = await query<AgentWithdrawalRequestRow>(
    `INSERT INTO agent_withdrawal_requests (
      id, agent_user_id, requested_amount, status, agent_note,
      payout_method, payout_bank_name, payout_account_name, payout_account_number, payout_iban,
      created_at, updated_at
    ) VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8,$9,NOW(),NOW())
    RETURNING *`,
    [
      id,
      input.agentUserId,
      amount,
      input.agentNote || null,
      input.payoutMethod || "bank_transfer",
      input.payoutBankName || null,
      input.payoutAccountName || null,
      input.payoutAccountNumber || null,
      input.payoutIban || null,
    ]
  );

  return rowToAgentWithdrawalRequest(result.rows[0]);
}

export async function listAgentWithdrawalRequests(agentUserId: string, limit = 50, offset = 0) {
  await ensureAgentWalletSchema();

  const result = await query<AgentWithdrawalRequestRow>(
    `SELECT * FROM agent_withdrawal_requests
     WHERE agent_user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [agentUserId, limit, offset]
  );
  return result.rows.map(rowToAgentWithdrawalRequest);
}

export async function countAgentWithdrawalRequests(
  status?: "pending" | "approved" | "rejected",
  search?: string,
  agentUserId?: string
) {
  await ensureAgentWalletSchema();

  const clauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status) {
    clauses.push(`awr.status = $${idx++}`);
    params.push(status);
  }
  if (search?.trim()) {
    clauses.push(`(u.email ILIKE $${idx} OR u.full_name ILIKE $${idx} OR u.phone ILIKE $${idx})`);
    params.push(`%${search.trim()}%`);
    idx++;
  }
  if (agentUserId?.trim()) {
    clauses.push(`awr.agent_user_id = $${idx++}`);
    params.push(agentUserId.trim());
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await query<CountRow>(
    `SELECT COUNT(*) as c
     FROM agent_withdrawal_requests awr
     LEFT JOIN users u ON awr.agent_user_id = u.id
     ${where}`,
    params
  );
  return parseInt(result.rows[0]?.c || "0", 10);
}

export async function listAllAgentWithdrawalRequests(
  status?: "pending" | "approved" | "rejected",
  limit = 20,
  offset = 0,
  search?: string,
  agentUserId?: string
) {
  await ensureAgentWalletSchema();

  const clauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status) {
    clauses.push(`awr.status = $${idx++}`);
    params.push(status);
  }
  if (search?.trim()) {
    clauses.push(`(u.email ILIKE $${idx} OR u.full_name ILIKE $${idx} OR u.phone ILIKE $${idx})`);
    params.push(`%${search.trim()}%`);
    idx++;
  }
  if (agentUserId?.trim()) {
    clauses.push(`awr.agent_user_id = $${idx++}`);
    params.push(agentUserId.trim());
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  params.push(limit, offset);

  const result = await query<AgentWithdrawalWithAgentRow>(
    `SELECT awr.*, COALESCE(u.display_name, u.full_name, u.email) as agent_name, u.email as agent_email, u.phone as agent_phone
     FROM agent_withdrawal_requests awr
     LEFT JOIN users u ON awr.agent_user_id = u.id
     ${where}
     ORDER BY awr.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params
  );

  return result.rows.map((row) => ({
    ...rowToAgentWithdrawalRequest(row),
    agentName: row.agent_name || "",
    agentEmail: row.agent_email || "",
    agentPhone: row.agent_phone || "",
  }));
}

export async function processAgentWithdrawalRequest(input: {
  requestId: string;
  action: "approve" | "reject";
  processedBy: string;
  approvedAmount?: number;
  adminNote?: string;
  payoutMethod?: string;
  payoutReference?: string;
  payoutReceiptUrl?: string;
  payoutBankName?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  payoutIban?: string;
}) {
  await ensureAgentWalletSchema();

  const requestRes = await query<AgentWithdrawalRequestRow>(
    `SELECT * FROM agent_withdrawal_requests WHERE id = $1`,
    [input.requestId]
  );
  const reqRow = requestRes.rows[0];
  if (!reqRow) throw new Error("REQUEST_NOT_FOUND");
  if (reqRow.status !== "pending") throw new Error("REQUEST_ALREADY_PROCESSED");

  if (input.action === "reject") {
    const result = await query<AgentWithdrawalRequestRow>(
      `UPDATE agent_withdrawal_requests
       SET status = 'rejected', admin_note = $2, processed_by = $3, processed_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [input.requestId, input.adminNote || null, input.processedBy]
    );
    return rowToAgentWithdrawalRequest(result.rows[0]);
  }

  const approvedAmount = Math.round((input.approvedAmount ?? toNumber(reqRow.requested_amount)) * 1000) / 1000;
  if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) {
    throw new Error("INVALID_APPROVED_AMOUNT");
  }

  const stats = await getAgentStats(reqRow.agent_user_id);
  if (approvedAmount > stats.availableWallet + toNumber(reqRow.requested_amount)) {
    throw new Error("INSUFFICIENT_AGENT_WALLET");
  }

  await query(
    `UPDATE agents
     SET total_withdrawn = total_withdrawn + $1,
         updated_at = NOW()
     WHERE user_id = $2`,
    [approvedAmount, reqRow.agent_user_id]
  );

  const result = await query<AgentWithdrawalRequestRow>(
    `UPDATE agent_withdrawal_requests
     SET status = 'approved',
         approved_amount = $2,
         admin_note = $3,
         payout_method = COALESCE($4, payout_method),
         payout_reference = $5,
         payout_receipt_url = $6,
         payout_bank_name = COALESCE($7, payout_bank_name),
         payout_account_name = COALESCE($8, payout_account_name),
         payout_account_number = COALESCE($9, payout_account_number),
         payout_iban = COALESCE($10, payout_iban),
         processed_by = $11,
         processed_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      input.requestId,
      approvedAmount,
      input.adminNote || null,
      input.payoutMethod || "bank_transfer",
      input.payoutReference || null,
      input.payoutReceiptUrl || null,
      input.payoutBankName || null,
      input.payoutAccountName || null,
      input.payoutAccountNumber || null,
      input.payoutIban || null,
      input.processedBy,
    ]
  );

  return rowToAgentWithdrawalRequest(result.rows[0]);
}
