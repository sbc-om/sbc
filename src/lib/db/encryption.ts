/**
 * Database encryption/decryption utilities
 * Uses AES-256-GCM for authenticated encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive encryption key from password using scrypt
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH);
}

/**
 * Get encryption password from environment
 */
function getEncryptionPassword(): string {
  const password = process.env.DB_ENCRYPTION_KEY;
  if (!password) {
    throw new Error("DB_ENCRYPTION_KEY environment variable is not set");
  }
  if (password.length < 32) {
    throw new Error("DB_ENCRYPTION_KEY must be at least 32 characters long");
  }
  return password;
}

/**
 * Encrypt data with AES-256-GCM
 * Returns Buffer containing: [salt(32) | iv(16) | authTag(16) | encrypted data]
 */
export function encrypt(data: Buffer | string): Buffer {
  const password = getEncryptionPassword();
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf-8");
  
  const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Concatenate salt, iv, authTag, and encrypted data
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * Expects Buffer in format: [salt(32) | iv(16) | authTag(16) | encrypted data]
 */
export function decrypt(encryptedData: Buffer): Buffer {
  const password = getEncryptionPassword();

  // Extract components
  const salt = encryptedData.subarray(0, SALT_LENGTH);
  const iv = encryptedData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = encryptedData.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(password, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Encrypt JSON data
 */
export function encryptJson(data: any): Buffer {
  const json = JSON.stringify(data);
  return encrypt(json);
}

/**
 * Decrypt JSON data
 */
export function decryptJson<T = any>(encryptedData: Buffer): T {
  const decrypted = decrypt(encryptedData);
  return JSON.parse(decrypted.toString("utf-8"));
}

/**
 * Check if encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
  return !!process.env.DB_ENCRYPTION_KEY && process.env.DB_ENCRYPTION_ENABLED !== "false";
}

/**
 * Encrypt value if encryption is enabled, otherwise return as-is
 */
export function maybeEncrypt(value: any): any {
  if (!isEncryptionEnabled()) {
    return value;
  }
  
  if (value === null || value === undefined) {
    return value;
  }

  // For primitive types, convert to JSON first
  if (typeof value !== "object") {
    return encrypt(JSON.stringify(value));
  }

  // For objects, stringify and encrypt
  return encryptJson(value);
}

/**
 * Decrypt value if it's a Buffer (encrypted), otherwise return as-is
 */
export function maybeDecrypt(value: any): any {
  if (!isEncryptionEnabled()) {
    return value;
  }

  if (!Buffer.isBuffer(value)) {
    return value;
  }

  try {
    // Try to decrypt as JSON first
    return decryptJson(value);
  } catch {
    // If JSON parsing fails, return as decrypted buffer
    try {
      return decrypt(value);
    } catch {
      // If decryption fails, return original value
      return value;
    }
  }
}

/**
 * Generate a secure random encryption key
 */
export function generateEncryptionKey(length: number = 64): string {
  return randomBytes(length).toString("base64url");
}
