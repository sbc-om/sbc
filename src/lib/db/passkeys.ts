import { nanoid } from "nanoid";

import { query } from "./postgres";
import type { PasskeyCredential } from "./types";

export type PasskeyChallenge = {
  id: string;
  challenge: string;
  userId?: string;
  createdAt: string;
  expiresAt: string;
};

function rowToCredential(row: any): PasskeyCredential {
  return {
    id: row.id,
    userId: row.user_id,
    publicKey: row.public_key,
    counter: row.counter ?? 0,
    transports: row.transports,
    deviceType: row.device_type,
    backedUp: row.backed_up ?? false,
    label: row.label,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    lastUsedAt: row.last_used_at?.toISOString(),
  };
}

function rowToChallenge(row: any): PasskeyChallenge {
  return {
    id: row.id,
    challenge: row.challenge,
    userId: row.user_id,
    createdAt: row.created_at?.toISOString() || new Date().toISOString(),
    expiresAt: row.expires_at?.toISOString() || new Date().toISOString(),
  };
}

// ==================== Challenges ====================

export async function createPasskeyChallenge(input: {
  challenge: string;
  userId?: string;
  expiresInMs?: number;
}): Promise<PasskeyChallenge> {
  const id = nanoid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (input.expiresInMs || 5 * 60 * 1000));

  const result = await query(`
    INSERT INTO passkey_challenges (id, challenge, user_id, created_at, expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [id, input.challenge, input.userId, now, expiresAt]);

  return rowToChallenge(result.rows[0]);
}

export async function getPasskeyChallenge(id: string): Promise<PasskeyChallenge | null> {
  const result = await query(`SELECT * FROM passkey_challenges WHERE id = $1`, [id]);
  if (result.rows.length === 0) return null;

  const challenge = rowToChallenge(result.rows[0]);
  
  // Check if expired
  if (new Date(challenge.expiresAt) < new Date()) {
    await query(`DELETE FROM passkey_challenges WHERE id = $1`, [id]);
    return null;
  }

  return challenge;
}

export async function deletePasskeyChallenge(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM passkey_challenges WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// Clean up expired challenges periodically
export async function cleanupExpiredChallenges(): Promise<number> {
  const result = await query(`DELETE FROM passkey_challenges WHERE expires_at < $1`, [new Date()]);
  return result.rowCount ?? 0;
}

// ==================== Credentials ====================

export async function createPasskeyCredential(input: {
  id: string;
  userId: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransport[];
  deviceType?: "singleDevice" | "multiDevice";
  backedUp?: boolean;
  label?: string;
}): Promise<PasskeyCredential> {
  const now = new Date();

  const result = await query(`
    INSERT INTO passkey_credentials (
      id, user_id, public_key, counter, transports, device_type, backed_up, label, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    input.id, input.userId, input.publicKey, input.counter,
    input.transports || [], input.deviceType, input.backedUp ?? false,
    input.label, now
  ]);

  return rowToCredential(result.rows[0]);
}

export async function getPasskeyCredential(id: string): Promise<PasskeyCredential | null> {
  const result = await query(`SELECT * FROM passkey_credentials WHERE id = $1`, [id]);
  return result.rows.length > 0 ? rowToCredential(result.rows[0]) : null;
}

export async function getUserPasskeyCredentials(userId: string): Promise<PasskeyCredential[]> {
  const result = await query(`SELECT * FROM passkey_credentials WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  return result.rows.map(rowToCredential);
}

export async function updatePasskeyCredentialCounter(id: string, counter: number): Promise<PasskeyCredential> {
  const result = await query(`
    UPDATE passkey_credentials SET counter = $1, last_used_at = $2 WHERE id = $3 RETURNING *
  `, [counter, new Date(), id]);

  if (result.rows.length === 0) throw new Error("NOT_FOUND");
  return rowToCredential(result.rows[0]);
}

export async function deletePasskeyCredential(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM passkey_credentials WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function deleteUserPasskeyCredentials(userId: string): Promise<number> {
  const result = await query(`DELETE FROM passkey_credentials WHERE user_id = $1`, [userId]);
  return result.rowCount ?? 0;
}

// ==================== Alias Functions for API Compatibility ====================

/** Alias for getUserPasskeyCredentials */
export const listUserPasskeys = getUserPasskeyCredentials;

/** Alias for createPasskeyCredential */
export const addPasskeyCredential = createPasskeyCredential;

/** Alias for getPasskeyCredential */
export const getPasskeyById = getPasskeyCredential;

/** Alias for updatePasskeyCredentialCounter */
export const updatePasskeyCounter = updatePasskeyCredentialCounter;

/** Consume a challenge (get and delete) */
export async function consumePasskeyChallenge(id: string): Promise<PasskeyChallenge | null> {
  const challenge = await getPasskeyChallenge(id);
  if (challenge) {
    await deletePasskeyChallenge(id);
  }
  return challenge;
}
