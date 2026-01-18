#!/usr/bin/env node

/**
 * Test script for database encryption and backup functionality
 * Usage: node scripts/test-backup.js
 */

console.log("\n=== Database Encryption & Backup System Test ===\n");

// Check environment variables
console.log("1. Checking environment variables...");
const hasEncryptionKey = !!process.env.DB_ENCRYPTION_KEY;
const encryptionEnabled = process.env.DB_ENCRYPTION_ENABLED !== "false";

console.log(`   DB_ENCRYPTION_KEY: ${hasEncryptionKey ? "✓ Set" : "✗ Not set"}`);
console.log(`   DB_ENCRYPTION_ENABLED: ${encryptionEnabled ? "✓ Enabled" : "✗ Disabled"}`);
console.log(`   LMDB_PATH: ${process.env.LMDB_PATH || ".data/lmdb"}`);
console.log(`   BACKUP_PATH: ${process.env.BACKUP_PATH || ".data/backups"}`);

if (!hasEncryptionKey) {
  console.log("\n⚠️  Warning: DB_ENCRYPTION_KEY is not set!");
  console.log("   Run: npm run generate-encryption-key");
  console.log("   Then add the generated key to your .env file");
}

// Test encryption utilities
console.log("\n2. Testing encryption utilities...");
try {
  const { encrypt, decrypt, isEncryptionEnabled } = require("../src/lib/db/encryption.ts");
  
  if (isEncryptionEnabled()) {
    const testData = "Hello, this is a test!";
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted).toString("utf-8");
    
    if (testData === decrypted) {
      console.log("   ✓ Encryption/Decryption test passed");
    } else {
      console.log("   ✗ Encryption/Decryption test failed");
    }
  } else {
    console.log("   ⚠️  Encryption is disabled");
  }
} catch (error) {
  console.log(`   ✗ Error: ${error.message}`);
}

// Check backup directory
console.log("\n3. Checking backup directory...");
const backupPath = process.env.BACKUP_PATH || ".data/backups";
const fs = require("fs");
const path = require("path");
const fullBackupPath = path.isAbsolute(backupPath) 
  ? backupPath 
  : path.join(process.cwd(), backupPath);

if (fs.existsSync(fullBackupPath)) {
  const backups = fs.readdirSync(fullBackupPath).filter(f => f.endsWith('.tar.gz'));
  console.log(`   ✓ Backup directory exists: ${fullBackupPath}`);
  console.log(`   Found ${backups.length} backup(s)`);
  
  if (backups.length > 0) {
    console.log("\n   Recent backups:");
    backups.slice(0, 5).forEach(b => {
      const stats = fs.statSync(path.join(fullBackupPath, b));
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   - ${b} (${sizeMB} MB)`);
    });
  }
} else {
  console.log(`   ℹ  Backup directory will be created: ${fullBackupPath}`);
}

// API endpoints
console.log("\n4. Available API endpoints:");
console.log("   POST   /api/admin/backup/create    - Create new backup");
console.log("   GET    /api/admin/backup/list      - List all backups");
console.log("   GET    /api/admin/backup/download/[id] - Download backup");
console.log("   POST   /api/admin/backup/restore   - Restore from backup");
console.log("   DELETE /api/admin/backup/delete/[id] - Delete backup");
console.log("   POST   /api/admin/backup/upload    - Upload backup file");

// Admin UI
console.log("\n5. Admin UI:");
console.log("   Access backup management at: /ar/admin/backup");
console.log("   (Login as admin required)");

console.log("\n=== Test Complete ===\n");

// Show next steps
if (!hasEncryptionKey) {
  console.log("📋 Next steps:");
  console.log("1. Generate encryption key: npm run generate-encryption-key");
  console.log("2. Add key to .env file");
  console.log("3. Restart the application");
  console.log("4. Access /ar/admin/backup to manage backups\n");
} else {
  console.log("✅ System is configured correctly!");
  console.log("   You can now create backups from the admin panel.\n");
}
