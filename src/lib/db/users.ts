import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createHash } from "node:crypto";

import { query, transaction } from "./postgres";
import type { Role, User, UserPushSubscription } from "./types";

export type UserListItem = Pick<
  User,
  | "id"
  | "email"
  | "phone"
  | "fullName"
  | "role"
  | "isActive"
  | "isVerified"
  | "createdAt"
  | "updatedAt"
  | "approvalStatus"
  | "approvalReason"
  | "approvalRequestedAt"
  | "pendingEmail"
  | "pendingPhone"
  | "approvedAt"
>;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email();

const phoneSchema = z.string().trim().min(6).max(40);
const fullNameSchema = z.string().trim().min(2).max(120);

function normalizePhone(value: string) {
  return value.replace(/[\s\-()]+/g, "");
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone || "",
    fullName: row.full_name,
    passwordHash: row.password_hash,
    role: row.role as Role,
    isActive: row.is_active ?? true,
    isVerified: row.is_verified ?? false,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    approvalStatus: row.approval_status,
    approvalReason: row.approval_reason,
    approvalRequestedAt: row.approval_requested_at?.toISOString(),
    approvedAt: row.approved_at?.toISOString(),
    pendingEmail: row.pending_email,
    pendingPhone: row.pending_phone,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
}

export async function createUser(input: {
  email: string;
  phone: string;
  fullName: string;
  password: string;
  role: Role;
}): Promise<User> {
  const email = emailSchema.parse(input.email);
  const fullName = fullNameSchema.parse(input.fullName);
  const phone = normalizePhone(phoneSchema.parse(input.phone));
  const password = z.string().min(8).parse(input.password);

  // Check if email exists
  const existingEmail = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existingEmail.rows.length > 0) {
    throw new Error("EMAIL_TAKEN");
  }

  // Check if phone exists
  const existingPhone = await query(`SELECT id FROM users WHERE phone = $1`, [phone]);
  if (existingPhone.rows.length > 0) {
    throw new Error("PHONE_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  const id = nanoid();

  const result = await query(`
    INSERT INTO users (id, email, phone, full_name, password_hash, role, is_active, is_verified,
      display_name, approval_status, approval_reason, approval_requested_at, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, true, false, $4, 'pending', 'new', $7, $7, $7)
    RETURNING *
  `, [id, email, phone, fullName, passwordHash, input.role, now]);

  return rowToUser(result.rows[0]);
}

async function ensureUser(id: string): Promise<User> {
  const result = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToUser(result.rows[0]);
}

export async function updateUserProfile(
  id: string,
  patch: { displayName?: string | null; bio?: string | null; fullName?: string | null },
): Promise<User> {
  await ensureUser(id);

  const updates: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (patch.displayName !== undefined) {
    const val = patch.displayName === null ? null : patch.displayName.trim() || null;
    updates.push(`display_name = $${paramIdx++}`);
    values.push(val);
  }

  if (patch.bio !== undefined) {
    const val = patch.bio === null ? null : patch.bio.trim() || null;
    updates.push(`bio = $${paramIdx++}`);
    values.push(val);
  }

  if (patch.fullName !== undefined && patch.fullName !== null) {
    const val = fullNameSchema.parse(patch.fullName);
    updates.push(`full_name = $${paramIdx++}`);
    values.push(val);
  }

  updates.push(`updated_at = $${paramIdx++}`);
  values.push(new Date());

  values.push(id);

  const result = await query(
    `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
    values
  );

  return rowToUser(result.rows[0]);
}

export async function updateUserFullName(id: string, fullName: string | null | undefined): Promise<User> {
  if (typeof fullName === "undefined") return ensureUser(id);

  const nextFullName = fullName === null ? undefined : fullNameSchema.parse(fullName);

  if (nextFullName) {
    const result = await query(`
      UPDATE users SET full_name = $1, updated_at = $2 WHERE id = $3 RETURNING *
    `, [nextFullName, new Date(), id]);
    return rowToUser(result.rows[0]);
  }

  return ensureUser(id);
}

export async function updateUserContact(
  id: string,
  patch: { email?: string | null; phone?: string | null },
): Promise<User> {
  const current = await ensureUser(id);
  const currentEmail = current.email;
  const currentPhone = current.phone ?? "";

  const nextEmail =
    typeof patch.email === "string" ? emailSchema.parse(patch.email) : currentEmail;
  const nextPhone =
    typeof patch.phone === "string"
      ? normalizePhone(phoneSchema.parse(patch.phone))
      : currentPhone;

  if (nextEmail !== currentEmail) {
    const existing = await query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [nextEmail, id]);
    if (existing.rows.length > 0) throw new Error("EMAIL_TAKEN");
  }

  if (nextPhone !== currentPhone) {
    const existing = await query(`SELECT id FROM users WHERE phone = $1 AND id != $2`, [nextPhone, id]);
    if (existing.rows.length > 0) throw new Error("PHONE_TAKEN");
  }

  const hasChange = nextEmail !== currentEmail || nextPhone !== currentPhone;
  if (!hasChange) return current;

  const now = new Date();
  const approvalReason =
    current.approvalStatus === "pending" && current.approvalReason === "new"
      ? "new"
      : "contact_update";

  const result = await query(`
    UPDATE users SET
      pending_email = CASE WHEN $1 != email THEN $1 ELSE pending_email END,
      pending_phone = CASE WHEN $2 != phone THEN $2 ELSE pending_phone END,
      approval_status = 'pending',
      approval_reason = $3,
      approval_requested_at = $4,
      updated_at = $4
    WHERE id = $5
    RETURNING *
  `, [nextEmail, nextPhone, approvalReason, now, id]);

  return rowToUser(result.rows[0]);
}

export async function approveUserAccount(id: string): Promise<User> {
  return transaction(async (client) => {
    const currentRes = await client.query(`SELECT * FROM users WHERE id = $1 FOR UPDATE`, [id]);
    if (currentRes.rows.length === 0) throw new Error("NOT_FOUND");
    const current = rowToUser(currentRes.rows[0]);

    const nextEmail = current.pendingEmail ?? current.email;
    const nextPhone = current.pendingPhone ?? current.phone;

    if (nextEmail !== current.email) {
      const existing = await client.query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [nextEmail, id]);
      if (existing.rows.length > 0) throw new Error("EMAIL_TAKEN");
    }

    if (nextPhone && nextPhone !== current.phone) {
      const existing = await client.query(`SELECT id FROM users WHERE phone = $1 AND id != $2`, [nextPhone, id]);
      if (existing.rows.length > 0) throw new Error("PHONE_TAKEN");
    }

    const now = new Date();
    const result = await client.query(`
      UPDATE users SET
        email = $1,
        phone = $2,
        pending_email = NULL,
        pending_phone = NULL,
        approval_status = 'approved',
        approval_reason = NULL,
        approval_requested_at = NULL,
        approved_at = $3,
        updated_at = $3
      WHERE id = $4
      RETURNING *
    `, [nextEmail, nextPhone, now, id]);

    return rowToUser(result.rows[0]);
  });
}

export async function setUserAvatar(id: string, url: string | null): Promise<User> {
  const result = await query(`
    UPDATE users SET avatar_url = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [url, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToUser(result.rows[0]);
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const e = emailSchema.safeParse(email);
  if (!e.success) return null;

  const result = await query(`SELECT * FROM users WHERE email = $1`, [e.data]);
  return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const p = phoneSchema.safeParse(phone);
  if (!p.success) return null;

  const normalized = normalizePhone(p.data);
  const result = await query(`SELECT * FROM users WHERE phone = $1`, [normalized]);
  return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
}

export async function verifyUserPassword(input: {
  identifier: string;
  password: string;
}): Promise<User | null> {
  const identifier = input.identifier.trim();
  const user = identifier.includes("@")
    ? await getUserByEmail(identifier)
    : await getUserByPhone(identifier);
  if (!user) return null;

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  return ok ? user : null;
}

export async function updateUserRole(id: string, newRole: Role): Promise<User> {
  const result = await query(`
    UPDATE users SET role = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [newRole, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToUser(result.rows[0]);
}

export async function setUserActive(id: string, isActive: boolean): Promise<User> {
  const result = await query(`
    UPDATE users SET is_active = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [isActive, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToUser(result.rows[0]);
}

export async function updateUserAdmin(
  id: string,
  patch: {
    email?: string | null;
    phone?: string | null;
    fullName?: string | null;
    displayName?: string | null;
    bio?: string | null;
    role?: Role | null;
    isVerified?: boolean | null;
    isActive?: boolean | null;
  }
): Promise<User> {
  return transaction(async (client) => {
    const currentRes = await client.query(`SELECT * FROM users WHERE id = $1 FOR UPDATE`, [id]);
    if (currentRes.rows.length === 0) throw new Error("NOT_FOUND");
    const current = rowToUser(currentRes.rows[0]);

    const nextEmail =
      typeof patch.email === "string" ? emailSchema.parse(patch.email) : current.email;
    const nextPhone =
      typeof patch.phone === "string"
        ? normalizePhone(phoneSchema.parse(patch.phone))
        : current.phone;
    const nextFullName =
      typeof patch.fullName === "string" ? fullNameSchema.parse(patch.fullName) : current.fullName;

    if (nextEmail !== current.email) {
      const existing = await client.query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [nextEmail, id]);
      if (existing.rows.length > 0) throw new Error("EMAIL_TAKEN");
    }

    if (nextPhone && nextPhone !== current.phone) {
      const existing = await client.query(`SELECT id FROM users WHERE phone = $1 AND id != $2`, [nextPhone, id]);
      if (existing.rows.length > 0) throw new Error("PHONE_TAKEN");
    }

    const displayName = patch.displayName === null
      ? null
      : typeof patch.displayName === "string"
        ? patch.displayName.trim() || null
        : current.displayName;

    const bio = patch.bio === null
      ? null
      : typeof patch.bio === "string"
        ? patch.bio.trim() || null
        : current.bio;

    const result = await client.query(`
      UPDATE users SET
        email = $1,
        phone = $2,
        full_name = $3,
        display_name = $4,
        bio = $5,
        role = $6,
        is_verified = $7,
        is_active = $8,
        updated_at = $9
      WHERE id = $10
      RETURNING *
    `, [
      nextEmail,
      nextPhone,
      nextFullName,
      displayName,
      bio,
      patch.role ?? current.role,
      typeof patch.isVerified === "boolean" ? patch.isVerified : current.isVerified,
      typeof patch.isActive === "boolean" ? patch.isActive : current.isActive,
      new Date(),
      id
    ]);

    return rowToUser(result.rows[0]);
  });
}

export async function setUserVerified(id: string, isVerified: boolean): Promise<User> {
  const result = await query(`
    UPDATE users SET is_verified = $1, updated_at = $2 WHERE id = $3 RETURNING *
  `, [isVerified, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToUser(result.rows[0]);
}

export async function listUsers(): Promise<UserListItem[]> {
  const result = await query(`
    SELECT id, email, phone, full_name, role, is_active, is_verified, created_at, updated_at,
           approval_status, approval_reason, approval_requested_at, pending_email, pending_phone, approved_at
    FROM users
    ORDER BY created_at DESC
  `);

  return result.rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    phone: row.phone ?? "",
    fullName: row.full_name ?? row.email.split("@")[0],
    role: row.role as Role,
    isActive: row.is_active ?? true,
    isVerified: row.is_verified,
    createdAt: row.created_at?.toISOString() || "",
    updatedAt: row.updated_at?.toISOString(),
    approvalStatus: row.approval_status,
    approvalReason: row.approval_reason,
    approvalRequestedAt: row.approval_requested_at?.toISOString(),
    pendingEmail: row.pending_email,
    pendingPhone: row.pending_phone,
    approvedAt: row.approved_at?.toISOString(),
  }));
}

const userPushSubscriptionSchema = z
  .object({
    endpoint: z.string().trim().min(1).max(4096),
    keys: z
      .object({
        p256dh: z.string().trim().min(1).max(2048),
        auth: z.string().trim().min(1).max(2048),
      })
      .strict(),
  })
  .strict();

export type UserWebPushSubscriptionInput = z.infer<typeof userPushSubscriptionSchema>;

function hashEndpoint(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 16);
}

function userPushSubId(userId: string, endpoint: string) {
  return `${userId}:${hashEndpoint(endpoint)}`;
}

export async function upsertUserPushSubscription(input: {
  userId: string;
  subscription: UserWebPushSubscriptionInput;
  userAgent?: string;
}): Promise<UserPushSubscription> {
  const userId = z.string().trim().min(1).parse(input.userId);
  const sub = userPushSubscriptionSchema.parse(input.subscription);

  const id = userPushSubId(userId, sub.endpoint);
  const now = new Date();

  const result = await query(`
    INSERT INTO user_push_subscriptions (id, user_id, endpoint, keys, user_agent, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $6)
    ON CONFLICT (id) DO UPDATE SET
      endpoint = $3,
      keys = $4,
      user_agent = $5,
      updated_at = $6
    RETURNING *
  `, [id, userId, sub.endpoint, { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, input.userAgent?.slice(0, 300), now]);

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    keys: row.keys,
    userAgent: row.user_agent,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
}

export async function removeUserPushSubscription(input: {
  userId: string;
  endpoint?: string;
}): Promise<number> {
  const userId = z.string().trim().min(1).parse(input.userId);

  if (input.endpoint) {
    const id = userPushSubId(userId, String(input.endpoint));
    const result = await query(`DELETE FROM user_push_subscriptions WHERE id = $1`, [id]);
    return result.rowCount ?? 0;
  }

  const result = await query(`DELETE FROM user_push_subscriptions WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}

export async function listUserPushSubscriptionsByUser(input: {
  userId: string;
}): Promise<UserPushSubscription[]> {
  const userId = z.string().trim().min(1).parse(input.userId);

  const result = await query(`SELECT * FROM user_push_subscriptions WHERE user_id = $1`, [userId]);

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    keys: row.keys,
    userAgent: row.user_agent,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  }));
}

export async function listAllUserPushSubscriptions(): Promise<UserPushSubscription[]> {
  const result = await query(`SELECT * FROM user_push_subscriptions`);

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    endpoint: row.endpoint,
    keys: row.keys,
    userAgent: row.user_agent,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  }));
}
