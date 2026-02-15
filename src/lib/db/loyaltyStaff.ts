import { nanoid } from "nanoid";
import { z } from "zod";

import { query } from "./postgres";
import { normalizePhone } from "./otp";
import type { LoyaltyStaff } from "./types";

type LoyaltyStaffRow = {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string;
  is_active: boolean | null;
  is_verified: boolean | null;
  last_login_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
};

const createSchema = z
  .object({
    userId: z.string().trim().min(1),
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(40),
  })
  .strict();

const updateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    avatarUrl: z.string().trim().min(1).max(800).nullable().optional(),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  })
  .strict();

let ensureTablePromise: Promise<void> | null = null;

function isUndefinedTableError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "42P01";
}

function isMissingAvatarColumnError(error: unknown): boolean {
  const code = (error as { code?: string; message?: string } | null)?.code;
  const message = String((error as { message?: string } | null)?.message || "").toLowerCase();
  return code === "42703" && message.includes("avatar_url");
}

let ensureAvatarColumnPromise: Promise<void> | null = null;

async function ensureAvatarColumn(): Promise<void> {
  if (!ensureAvatarColumnPromise) {
    ensureAvatarColumnPromise = (async () => {
      await query(`ALTER TABLE loyalty_staff ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
    })().finally(() => {
      ensureAvatarColumnPromise = null;
    });
  }

  await ensureAvatarColumnPromise;
}

async function ensureLoyaltyStaffTable(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS loyalty_staff (
          id TEXT PRIMARY KEY,
          user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          full_name TEXT NOT NULL,
          avatar_url TEXT,
          phone TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_verified BOOLEAN NOT NULL DEFAULT false,
          last_login_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, phone)
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS idx_loyalty_staff_user_id ON loyalty_staff(user_id)
      `);

      await query(`ALTER TABLE loyalty_staff ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
    })().finally(() => {
      ensureTablePromise = null;
    });
  }

  await ensureTablePromise;
}

async function queryWithTableGuard(sql: string, params: unknown[] = []) {
  try {
    return await query<LoyaltyStaffRow>(sql, params);
  } catch (error) {
    if (isUndefinedTableError(error)) {
      await ensureLoyaltyStaffTable();
      return await query<LoyaltyStaffRow>(sql, params);
    }
    if (isMissingAvatarColumnError(error)) {
      await ensureAvatarColumn();
      return await query<LoyaltyStaffRow>(sql, params);
    }
    throw error;
  }
}

function rowToStaff(row: LoyaltyStaffRow): LoyaltyStaff {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url ?? undefined,
    phone: row.phone,
    isActive: row.is_active ?? true,
    isVerified: row.is_verified ?? false,
    lastLoginAt: row.last_login_at?.toISOString(),
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
  };
}

export async function createLoyaltyStaff(input: {
  userId: string;
  fullName: string;
  phone: string;
}): Promise<LoyaltyStaff> {
  const parsed = createSchema.parse(input);
  const phone = normalizePhone(parsed.phone);
  const now = new Date();

  const result = await queryWithTableGuard(
    `
    INSERT INTO loyalty_staff (id, user_id, full_name, avatar_url, phone, is_active, is_verified, created_at, updated_at)
    VALUES ($1, $2, $3, NULL, $4, true, false, $5, $5)
    ON CONFLICT (user_id, phone) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      is_active = true,
      updated_at = EXCLUDED.updated_at
    RETURNING *
    `,
    [nanoid(), parsed.userId, parsed.fullName, phone, now],
  );

  return rowToStaff(result.rows[0]);
}

export async function listLoyaltyStaffByUser(userId: string): Promise<LoyaltyStaff[]> {
  const result = await queryWithTableGuard(
    `SELECT * FROM loyalty_staff WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows.map(rowToStaff);
}

export async function getLoyaltyStaffById(id: string): Promise<LoyaltyStaff | null> {
  const result = await queryWithTableGuard(`SELECT * FROM loyalty_staff WHERE id = $1 LIMIT 1`, [id]);
  return result.rows[0] ? rowToStaff(result.rows[0]) : null;
}

export async function getLoyaltyStaffByUserAndPhone(userId: string, phone: string): Promise<LoyaltyStaff | null> {
  const normalized = normalizePhone(phone);

  const exactResult = await queryWithTableGuard(
    `SELECT * FROM loyalty_staff WHERE user_id = $1 AND phone = $2 LIMIT 1`,
    [userId, normalized],
  );
  if (exactResult.rows[0]) return rowToStaff(exactResult.rows[0]);

  if (normalized.length < 8) return null;

  // Fallback matching for numbers entered with/without country code.
  const allByUser = await queryWithTableGuard(
    `SELECT * FROM loyalty_staff WHERE user_id = $1`,
    [userId],
  );

  const matches = allByUser.rows.filter((row) => {
    const stored = String(row.phone || "");
    return stored.endsWith(normalized) || normalized.endsWith(stored);
  });

  if (matches.length !== 1) return null;
  return rowToStaff(matches[0]);
}

export async function updateLoyaltyStaff(
  id: string,
  patch: {
    fullName?: string;
    avatarUrl?: string | null;
    isActive?: boolean;
    isVerified?: boolean;
  },
): Promise<LoyaltyStaff> {
  const parsed = updateSchema.parse({
    fullName: patch.fullName,
    avatarUrl: patch.avatarUrl,
    isActive: patch.isActive,
    isVerified: patch.isVerified,
  });

  const now = new Date();
  const shouldSetAvatar = parsed.avatarUrl !== undefined;
  const result = await queryWithTableGuard(
    `
    UPDATE loyalty_staff
    SET
      full_name = COALESCE($1, full_name),
      is_active = COALESCE($2, is_active),
      is_verified = COALESCE($3, is_verified),
      avatar_url = CASE WHEN $4::boolean THEN $5 ELSE avatar_url END,
      updated_at = $6
    WHERE id = $7
    RETURNING *
    `,
    [
      parsed.fullName ?? null,
      parsed.isActive ?? null,
      parsed.isVerified ?? null,
      shouldSetAvatar,
      parsed.avatarUrl ?? null,
      now,
      id,
    ],
  );

  if (!result.rows[0]) throw new Error("NOT_FOUND");
  return rowToStaff(result.rows[0]);
}

export async function markLoyaltyStaffLogin(staffId: string): Promise<void> {
  await queryWithTableGuard(
    `UPDATE loyalty_staff SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [staffId],
  );
}
