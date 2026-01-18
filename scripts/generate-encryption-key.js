#!/usr/bin/env node

/**
 * Generate a secure encryption key for database encryption
 * Usage: node scripts/generate-encryption-key.js
 */

import { randomBytes } from "node:crypto";

console.log("\n=== Database Encryption Key Generator ===\n");

const key = randomBytes(64).toString("base64url");

console.log("Generated encryption key (add to .env):\n");
console.log(`DB_ENCRYPTION_KEY=${key}`);
console.log(`DB_ENCRYPTION_ENABLED=true`);

console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
console.log("1. Keep this key SECRET and SECURE");
console.log("2. NEVER commit this key to version control");
console.log("3. Store it safely - losing this key means losing access to encrypted data");
console.log("4. Use the same key across all environments for the same database");
console.log("5. Changing the key requires re-encrypting all data\n");
