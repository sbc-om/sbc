/**
 * OTP (One-Time Password) Management
 * Handles OTP generation, storage, and verification
 */
import { nanoid } from "nanoid";
import { query } from "./postgres";

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "5", 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "3", 10);

export type OTPPurpose = "login" | "registration" | "phone_verification" | "password_reset";

export interface OTPRecord {
  id: string;
  phone: string;
  code: string;
  purpose: OTPPurpose;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  userId: string | null;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Normalize phone number for consistent storage
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // Remove leading zeros
  return digits.replace(/^0+/, "");
}

/**
 * Create a new OTP record
 */
export async function createOTP(
  phone: string,
  purpose: OTPPurpose = "login",
  userId?: string
): Promise<OTPRecord> {
  const normalizedPhone = normalizePhone(phone);
  const code = generateOTPCode();
  const id = nanoid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any existing unused OTPs for this phone and purpose
  await query(
    `UPDATE otp_codes SET verified = true WHERE phone = $1 AND purpose = $2 AND verified = false`,
    [normalizedPhone, purpose]
  );

  // Create new OTP
  await query(
    `INSERT INTO otp_codes (id, phone, code, purpose, max_attempts, user_id, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, normalizedPhone, code, purpose, OTP_MAX_ATTEMPTS, userId || null, now, expiresAt]
  );

  return {
    id,
    phone: normalizedPhone,
    code,
    purpose,
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    verified: false,
    userId: userId || null,
    createdAt: now,
    expiresAt,
  };
}

/**
 * Verify an OTP code
 */
export async function verifyOTP(
  phone: string,
  code: string,
  purpose: OTPPurpose = "login"
): Promise<{ success: boolean; error?: string; userId?: string }> {
  const normalizedPhone = normalizePhone(phone);
  const now = new Date();

  // Find the latest valid OTP for this phone and purpose
  const result = await query<OTPRow>(
    `SELECT * FROM otp_codes 
     WHERE phone = $1 AND purpose = $2 AND verified = false AND expires_at > $3
     ORDER BY created_at DESC LIMIT 1`,
    [normalizedPhone, purpose, now]
  );

  if (result.rows.length === 0) {
    return { success: false, error: "OTP_NOT_FOUND" };
  }

  const otp = result.rows[0];

  // Check if max attempts exceeded
  if (otp.attempts >= otp.max_attempts) {
    return { success: false, error: "MAX_ATTEMPTS_EXCEEDED" };
  }

  // Increment attempts
  await query(
    `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`,
    [otp.id]
  );

  // Check if code matches
  if (otp.code !== code) {
    const remainingAttempts = otp.max_attempts - otp.attempts - 1;
    return { 
      success: false, 
      error: remainingAttempts > 0 ? "INVALID_CODE" : "MAX_ATTEMPTS_EXCEEDED"
    };
  }

  // Mark as verified
  await query(
    `UPDATE otp_codes SET verified = true WHERE id = $1`,
    [otp.id]
  );

  return { success: true, userId: otp.user_id ?? undefined };
}

/**
 * Get OTP record by ID
 */
export async function getOTPById(id: string): Promise<OTPRecord | null> {
  const result = await query<OTPRow>(`SELECT * FROM otp_codes WHERE id = $1`, [id]);
  if (result.rows.length === 0) return null;
  return rowToOTP(result.rows[0]);
}

/**
 * Check if phone has a pending valid OTP (rate limiting)
 */
export async function hasRecentOTP(phone: string, purpose: OTPPurpose): Promise<boolean> {
  const normalizedPhone = normalizePhone(phone);
  const cooldownTime = new Date(Date.now() - 60 * 1000); // 1 minute cooldown

  const result = await query(
    `SELECT id FROM otp_codes 
     WHERE phone = $1 AND purpose = $2 AND created_at > $3
     LIMIT 1`,
    [normalizedPhone, purpose, cooldownTime]
  );

  return result.rows.length > 0;
}

/**
 * Clean up expired OTPs (can be called periodically)
 */
export async function cleanupExpiredOTPs(): Promise<number> {
  const result = await query(
    `DELETE FROM otp_codes WHERE expires_at < NOW() OR verified = true RETURNING id`
  );
  return result.rowCount || 0;
}

type OTPRow = {
  id: string;
  phone: string;
  code: string;
  purpose: OTPPurpose;
  attempts: number;
  max_attempts: number;
  verified: boolean;
  user_id: string | null;
  created_at: Date | string;
  expires_at: Date | string;
};

function rowToOTP(row: OTPRow): OTPRecord {
  return {
    id: row.id,
    phone: row.phone,
    code: row.code,
    purpose: row.purpose as OTPPurpose,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    verified: row.verified,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
  };
}
