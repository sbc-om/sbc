import { nanoid } from "nanoid";
import { query } from "./postgres";

export type ProgramSubscription = {
  id: string;
  userId: string;
  productId: string;
  productSlug: string;
  program: string;
  /** Same as plan - the plan id */
  plan?: string;
  startDate: string;
  endDate: string;
  /** Alias for endDate - when subscription expires */
  expiresAt: string;
  isActive: boolean;
  paymentId?: string;
  paymentMethod?: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type ProgramSubscriptionInput = {
  userId: string;
  productId: string;
  productSlug: string;
  program: string;
  durationDays: number;
  paymentId?: string;
  paymentMethod?: string;
  amount: number;
  currency: string;
};

function rowToSubscription(row: any): ProgramSubscription {
  const endDateStr = row.end_date?.toISOString() || new Date().toISOString();
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    productSlug: row.product_slug,
    program: row.program,
    plan: row.plan || row.product_slug,
    startDate: row.start_date?.toISOString() || new Date().toISOString(),
    endDate: endDateStr,
    expiresAt: endDateStr,
    isActive: row.is_active ?? true,
    paymentId: row.payment_id,
    paymentMethod: row.payment_method,
    amount: parseFloat(row.amount) || 0,
    currency: row.currency || "OMR",
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createProgramSubscription(input: ProgramSubscriptionInput): Promise<ProgramSubscription> {
  const id = nanoid();
  const now = new Date();
  const startDate = now;
  const durationMs = input.durationDays * 24 * 60 * 60 * 1000;

  // Check if the user already has an active subscription for the same program.
  // If so, stack the new duration on top of the existing end date.
  const existing = await getUserActiveSubscriptionForProgram(input.userId, input.program);
  let baseDate = now;
  if (existing) {
    const existingEnd = new Date(existing.endDate);
    // Use the later of (existing end date, now) as the base for stacking
    if (existingEnd.getTime() > now.getTime()) {
      baseDate = existingEnd;
    }
    // Deactivate the old subscription so it doesn't overlap
    await query(
      `UPDATE program_subscriptions SET is_active = false, updated_at = $1 WHERE id = $2`,
      [now, existing.id]
    );
  }

  const endDate = new Date(baseDate.getTime() + durationMs);

  const result = await query(`
    INSERT INTO program_subscriptions (
      id, user_id, product_id, product_slug, program, start_date, end_date,
      is_active, payment_id, payment_method, amount, currency, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
    RETURNING *
  `, [
    id, input.userId, input.productId, input.productSlug, input.program,
    startDate, endDate, true, input.paymentId, input.paymentMethod,
    input.amount, input.currency, now
  ]);

  return rowToSubscription(result.rows[0]);
}

/**
 * Purchase a program subscription (alias for createProgramSubscription for API compatibility)
 */
export async function purchaseProgramSubscription(input: ProgramSubscriptionInput): Promise<ProgramSubscription> {
  return createProgramSubscription(input);
}

export async function getProgramSubscriptionById(id: string): Promise<ProgramSubscription | null> {
  const result = await query(`SELECT * FROM program_subscriptions WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToSubscription(result.rows[0]) : null;
}

export async function listUserProgramSubscriptions(userId: string): Promise<ProgramSubscription[]> {
  const result = await query(`
    SELECT * FROM program_subscriptions WHERE user_id = $1 ORDER BY created_at DESC
  `, [userId]);
  return result.rows.map(rowToSubscription);
}

export async function listActiveUserProgramSubscriptions(userId: string): Promise<ProgramSubscription[]> {
  const result = await query(`
    SELECT * FROM program_subscriptions 
    WHERE user_id = $1 AND is_active = true AND end_date > NOW()
    ORDER BY created_at DESC
  `, [userId]);
  return result.rows.map(rowToSubscription);
}

export async function getUserActiveSubscriptionForProgram(
  userId: string,
  program: string
): Promise<ProgramSubscription | null> {
  const result = await query(`
    SELECT * FROM program_subscriptions 
    WHERE user_id = $1 AND program = $2 AND is_active = true AND end_date > NOW()
    ORDER BY end_date DESC
    LIMIT 1
  `, [userId, program]);
  return result.rows.length > 0 ? rowToSubscription(result.rows[0]) : null;
}

export async function hasActiveSubscription(userId: string, program: string): Promise<boolean> {
  const result = await query(`
    SELECT 1 FROM program_subscriptions 
    WHERE user_id = $1 AND program = $2 AND is_active = true AND end_date > NOW()
    LIMIT 1
  `, [userId, program]);
  return result.rows.length > 0;
}

export async function cancelProgramSubscription(id: string): Promise<ProgramSubscription> {
  const result = await query(`
    UPDATE program_subscriptions SET is_active = false, updated_at = $1 WHERE id = $2 RETURNING *
  `, [new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToSubscription(result.rows[0]);
}

export async function extendProgramSubscription(id: string, additionalDays: number): Promise<ProgramSubscription> {
  const currentRes = await query(`SELECT * FROM program_subscriptions WHERE id = $1`, [id]);
  if (currentRes.rows.length === 0) throw new Error("NOT_FOUND");
  
  const current = rowToSubscription(currentRes.rows[0]);
  const currentEndDate = new Date(current.endDate);
  const newEndDate = new Date(currentEndDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);

  const result = await query(`
    UPDATE program_subscriptions SET end_date = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [newEndDate, new Date(), id]);

  return rowToSubscription(result.rows[0]);
}

export async function listAllProgramSubscriptions(): Promise<ProgramSubscription[]> {
  const result = await query(`SELECT * FROM program_subscriptions ORDER BY created_at DESC`);
  return result.rows.map(rowToSubscription);
}

export async function listProgramSubscriptionsByProduct(productId: string): Promise<ProgramSubscription[]> {
  const result = await query(`
    SELECT * FROM program_subscriptions WHERE product_id = $1 ORDER BY created_at DESC
  `, [productId]);
  return result.rows.map(rowToSubscription);
}

export async function getProgramSubscriptionStats(program: string): Promise<{
  total: number;
  active: number;
  revenue: number;
}> {
  const result = await query(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_active = true AND end_date > NOW() THEN 1 ELSE 0 END) as active,
      SUM(amount) as revenue
    FROM program_subscriptions
    WHERE program = $1
  `, [program]);

  const row = result.rows[0];
  return {
    total: parseInt(row?.total || "0", 10),
    active: parseInt(row?.active || "0", 10),
    revenue: parseFloat(row?.revenue || "0"),
  };
}

// Expire old subscriptions (can be run periodically)
export async function expireOldSubscriptions(): Promise<number> {
  const result = await query(`
    UPDATE program_subscriptions 
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true AND end_date < NOW()
  `);
  return result.rowCount ?? 0;
}

/**
 * Get program subscription by user for any program
 */
export async function getProgramSubscriptionByUser(userId: string): Promise<ProgramSubscription | null> {
  const result = await query(`
    SELECT * FROM program_subscriptions 
    WHERE user_id = $1 AND is_active = true AND end_date > NOW()
    ORDER BY end_date DESC
    LIMIT 1
  `, [userId]);
  return result.rows.length > 0 ? rowToSubscription(result.rows[0]) : null;
}

/**
 * Check if a user's subscription is currently active
 */
export async function isProgramSubscriptionActive(userId: string): Promise<boolean> {
  const result = await query(`
    SELECT 1 FROM program_subscriptions 
    WHERE user_id = $1 AND is_active = true AND end_date > NOW()
    LIMIT 1
  `, [userId]);
  return result.rows.length > 0;
}

/**
 * Ensure user has an active subscription for a program, throws if not
 */
export async function ensureActiveProgramSubscription(userId: string, program?: string): Promise<void> {
  const hasActive = program 
    ? await hasActiveSubscription(userId, program)
    : await isProgramSubscriptionActive(userId);
  
  if (!hasActive) {
    throw new Error("NO_ACTIVE_SUBSCRIPTION");
  }
}

/**
 * List all program subscriptions for a user (alias for listUserProgramSubscriptions)
 */
export async function listProgramSubscriptionsByUser(userId: string): Promise<ProgramSubscription[]> {
  return listUserProgramSubscriptions(userId);
}
