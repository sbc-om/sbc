/**
 * Comprehensive Backup & Restore System
 * Handles database and file backups with encryption support
 */

import fs from "node:fs";
import path from "node:path";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip, createGunzip } from "node:zlib";
import { getLmdb } from "./lmdb";
import { encrypt, decrypt, isEncryptionEnabled } from "./encryption";
import archiver from "archiver";
import * as tar from "tar";

export interface BackupMetadata {
  id: string;
  timestamp: string;
  type: "full" | "database-only" | "files-only";
  size: number;
  encrypted: boolean;
  description?: string;
  version: string;
}

export interface BackupOptions {
  type?: "full" | "database-only" | "files-only";
  description?: string;
  includeMedia?: boolean;
  includeCerts?: boolean;
  includePublic?: boolean;
}

export interface RestoreOptions {
  backupId: string;
  restoreDatabase?: boolean;
  restoreFiles?: boolean;
}

/**
 * Get backup directory path
 */
function getBackupPath(): string {
  const p = process.env.BACKUP_PATH || ".data/backups";
  const backupPath = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  fs.mkdirSync(backupPath, { recursive: true });
  return backupPath;
}

/**
 * Get database path
 */
function getDbPath(): string {
  const p = process.env.LMDB_PATH || ".data/lmdb";
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

/**
 * Export all database content to JSON
 */
async function exportDatabase(): Promise<Record<string, any[]>> {
  const db = getLmdb();
  const data: Record<string, any[]> = {};

  const databases = [
    "businesses",
    "businessSlugs",
    "categories",
    "categorySlugs",
    "users",
    "userEmails",
    "userPhones",
    "userCategoryFollows",
    "userBusinessLikes",
    "userBusinessSaves",
    "businessLikeCounts",
    "businessComments",
    "chatConversations",
    "chatMessages",
    "businessRequests",
    "products",
    "productSlugs",
    "programSubscriptions",
    "loyaltySubscriptions",
    "loyaltyProfiles",
    "loyaltySettings",
    "loyaltyCustomers",
    "loyaltyCards",
    "loyaltyMessages",
    "loyaltyPushSubscriptions",
    "userPushSubscriptions",
    "appleWalletRegistrations",
    "passkeyCredentials",
    "userPasskeys",
    "passkeyChallenges",
  ] as const;

  for (const dbName of databases) {
    const entries: any[] = [];
    try {
      for (const { key, value } of db[dbName].getRange()) {
        entries.push({ key, value });
      }
      data[dbName] = entries;
    } catch (error) {
      console.error(`Error exporting ${dbName}:`, error);
      data[dbName] = [];
    }
  }

  return data;
}

/**
 * Import database content from JSON
 */
async function importDatabase(data: Record<string, any[]>): Promise<void> {
  const db = getLmdb();

  for (const [dbName, entries] of Object.entries(data)) {
    if (!entries || entries.length === 0) continue;

    const dbHandle = (db as any)[dbName];
    if (!dbHandle) {
      console.warn(`Database ${dbName} not found, skipping...`);
      continue;
    }

    try {
      for (const { key, value } of entries) {
        await dbHandle.put(key, value);
      }
      console.log(`Imported ${entries.length} entries to ${dbName}`);
    } catch (error) {
      console.error(`Error importing ${dbName}:`, error);
    }
  }
}

/**
 * Create a comprehensive backup
 */
export async function createBackup(options: BackupOptions = {}): Promise<BackupMetadata> {
  const {
    type = "full",
    description,
    includeMedia = true,
    includeCerts = true,
    includePublic = false,
  } = options;

  const backupId = `backup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const backupPath = getBackupPath();
  const backupDir = path.join(backupPath, backupId);
  fs.mkdirSync(backupDir, { recursive: true });

  const metadata: BackupMetadata = {
    id: backupId,
    timestamp: new Date().toISOString(),
    type,
    size: 0,
    encrypted: isEncryptionEnabled(),
    description,
    version: "1.0.0",
  };

  try {
    // 1. Export database
    if (type === "full" || type === "database-only") {
      console.log("Exporting database...");
      const dbData = await exportDatabase();
      const dbJson = JSON.stringify(dbData, null, 2);
      const dbPath = path.join(backupDir, "database.json");

      // Encrypt if enabled
      if (isEncryptionEnabled()) {
        const encrypted = encrypt(dbJson);
        fs.writeFileSync(dbPath + ".enc", encrypted);
      } else {
        fs.writeFileSync(dbPath, dbJson);
      }
      console.log("Database exported successfully");
    }

    // 2. Copy database files (LMDB raw files)
    if (type === "full" || type === "database-only") {
      const dbSourcePath = getDbPath();
      const dbBackupPath = path.join(backupDir, "lmdb");
      
      if (fs.existsSync(dbSourcePath)) {
        fs.mkdirSync(dbBackupPath, { recursive: true });
        await copyDirectory(dbSourcePath, dbBackupPath);
        console.log("LMDB files copied successfully");
      }
    }

    // 3. Backup files
    if (type === "full" || type === "files-only") {
      const filesBackupPath = path.join(backupDir, "files");
      fs.mkdirSync(filesBackupPath, { recursive: true });

      // Backup media uploads
      if (includeMedia) {
        const uploadsPath = path.join(process.cwd(), ".data/uploads");
        if (fs.existsSync(uploadsPath)) {
          const mediaBackupPath = path.join(filesBackupPath, "uploads");
          await copyDirectory(uploadsPath, mediaBackupPath);
          console.log("Media files backed up");
        }
      }

      // Backup certificates
      if (includeCerts) {
        const certsPath = path.join(process.cwd(), "certs");
        if (fs.existsSync(certsPath)) {
          const certsBackupPath = path.join(filesBackupPath, "certs");
          await copyDirectory(certsPath, certsBackupPath);
          console.log("Certificates backed up");
        }
      }

      // Backup public assets (optional)
      if (includePublic) {
        const publicPath = path.join(process.cwd(), "public");
        if (fs.existsSync(publicPath)) {
          const publicBackupPath = path.join(filesBackupPath, "public");
          await copyDirectory(publicPath, publicBackupPath);
          console.log("Public assets backed up");
        }
      }
    }

    // 4. Save metadata
    fs.writeFileSync(
      path.join(backupDir, "metadata.json"),
      JSON.stringify(metadata, null, 2)
    );

    // 5. Calculate total size
    metadata.size = await getDirectorySize(backupDir);

    // 6. Update metadata with size
    fs.writeFileSync(
      path.join(backupDir, "metadata.json"),
      JSON.stringify(metadata, null, 2)
    );

    // 7. Create compressed archive
    const archivePath = path.join(backupPath, `${backupId}.tar.gz`);
    await createTarGz(backupDir, archivePath);

    // 8. Clean up temporary directory
    fs.rmSync(backupDir, { recursive: true, force: true });

    console.log(`Backup created successfully: ${backupId}`);
    return metadata;
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    throw error;
  }
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<BackupMetadata[]> {
  const backupPath = getBackupPath();
  const backups: BackupMetadata[] = [];

  try {
    const files = fs.readdirSync(backupPath);
    
    for (const file of files) {
      if (file.endsWith(".tar.gz")) {
        const backupId = file.replace(".tar.gz", "");
        const extractPath = path.join(backupPath, `temp-${backupId}`);
        
        try {
          // Extract metadata only
          await extractTarGz(path.join(backupPath, file), extractPath);
          
          const metadataPath = path.join(extractPath, "metadata.json");
          if (fs.existsSync(metadataPath)) {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
            backups.push(metadata);
          }
          
          // Clean up
          fs.rmSync(extractPath, { recursive: true, force: true });
        } catch (error) {
          console.error(`Error reading backup ${file}:`, error);
        }
      }
    }
    
    // Sort by timestamp (newest first)
    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return backups;
  } catch (error) {
    console.error("Error listing backups:", error);
    return [];
  }
}

/**
 * Restore from backup
 */
export async function restoreBackup(options: RestoreOptions): Promise<void> {
  const { backupId, restoreDatabase = true, restoreFiles = true } = options;
  const backupPath = getBackupPath();
  const archivePath = path.join(backupPath, `${backupId}.tar.gz`);

  if (!fs.existsSync(archivePath)) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  const extractPath = path.join(backupPath, `restore-${backupId}`);

  try {
    // Extract backup
    console.log("Extracting backup...");
    await extractTarGz(archivePath, extractPath);

    // Read metadata
    const metadataPath = path.join(extractPath, "metadata.json");
    if (!fs.existsSync(metadataPath)) {
      throw new Error("Invalid backup: metadata.json not found");
    }

    const metadata: BackupMetadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

    // Restore database
    if (restoreDatabase && (metadata.type === "full" || metadata.type === "database-only")) {
      console.log("Restoring database...");

      // Restore from JSON export
      const dbJsonPath = metadata.encrypted
        ? path.join(extractPath, "database.json.enc")
        : path.join(extractPath, "database.json");

      if (fs.existsSync(dbJsonPath)) {
        let dbJson: string;
        
        if (metadata.encrypted) {
          const encryptedData = fs.readFileSync(dbJsonPath);
          dbJson = decrypt(encryptedData).toString("utf-8");
        } else {
          dbJson = fs.readFileSync(dbJsonPath, "utf-8");
        }

        const dbData = JSON.parse(dbJson);
        await importDatabase(dbData);
        console.log("Database restored from JSON export");
      }

      // Optionally restore raw LMDB files (requires app restart)
      const lmdbBackupPath = path.join(extractPath, "lmdb");
      if (fs.existsSync(lmdbBackupPath)) {
        const dbPath = getDbPath();
        console.log(`Raw LMDB files available at: ${lmdbBackupPath}`);
        console.log(`To restore raw files, stop the app and copy them to: ${dbPath}`);
      }
    }

    // Restore files
    if (restoreFiles && (metadata.type === "full" || metadata.type === "files-only")) {
      console.log("Restoring files...");
      const filesBackupPath = path.join(extractPath, "files");

      if (fs.existsSync(filesBackupPath)) {
        // Restore uploads
        const uploadsBackup = path.join(filesBackupPath, "uploads");
        if (fs.existsSync(uploadsBackup)) {
          const uploadsPath = path.join(process.cwd(), ".data/uploads");
          fs.mkdirSync(uploadsPath, { recursive: true });
          await copyDirectory(uploadsBackup, uploadsPath);
          console.log("Media files restored");
        }

        // Restore certs
        const certsBackup = path.join(filesBackupPath, "certs");
        if (fs.existsSync(certsBackup)) {
          const certsPath = path.join(process.cwd(), "certs");
          fs.mkdirSync(certsPath, { recursive: true });
          await copyDirectory(certsBackup, certsPath);
          console.log("Certificates restored");
        }

        // Restore public (if backed up)
        const publicBackup = path.join(filesBackupPath, "public");
        if (fs.existsSync(publicBackup)) {
          const publicPath = path.join(process.cwd(), "public");
          await copyDirectory(publicBackup, publicPath);
          console.log("Public assets restored");
        }
      }
    }

    console.log("Restore completed successfully");
  } catch (error) {
    console.error("Error during restore:", error);
    throw error;
  } finally {
    // Clean up
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
  }
}

/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string): Promise<void> {
  const backupPath = getBackupPath();
  const archivePath = path.join(backupPath, `${backupId}.tar.gz`);

  if (!fs.existsSync(archivePath)) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  fs.unlinkSync(archivePath);
}

/**
 * Get backup file path
 */
export function getBackupFilePath(backupId: string): string {
  return path.join(getBackupPath(), `${backupId}.tar.gz`);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Copy directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Calculate directory size in bytes
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      totalSize += await getDirectorySize(fullPath);
    } else {
      const stats = fs.statSync(fullPath);
      totalSize += stats.size;
    }
  }

  return totalSize;
}

/**
 * Create tar.gz archive
 */
async function createTarGz(sourceDir: string, outputPath: string): Promise<void> {
  const output = createWriteStream(outputPath);
  const gzip = createGzip({ level: 9 });
  const archive = archiver("tar");

  return new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(gzip).pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Extract tar.gz archive
 */
async function extractTarGz(archivePath: string, outputDir: string): Promise<void> {
  fs.mkdirSync(outputDir, { recursive: true });

  await tar.extract({
    file: archivePath,
    cwd: outputDir,
  });
}
