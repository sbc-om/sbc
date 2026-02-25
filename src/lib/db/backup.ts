/**
 * Database Backup Utilities
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as tar from "tar";
import { getUploadsRoot } from "@/lib/uploads/storage";

const execFileAsync = promisify(execFile);

/** Options for creating a backup */
export interface BackupOptions {
  /** Type of backup */
  type?: "full" | "database" | "database-only" | "files-only";
  /** Optional description for the backup */
  description?: string;
  /** Include media files (uploads) in backup */
  includeMedia?: boolean;
  /** Include certificate files in backup */
  includeCerts?: boolean;
  /** Include public folder assets in backup */
  includePublic?: boolean;
}

/** Options for restoring from a backup */
export interface RestoreOptions {
  /** ID of the backup to restore */
  backupId: string;
  /** Whether to restore the database */
  restoreDatabase?: boolean;
  /** Whether to restore files (media, certs, etc.) */
  restoreFiles?: boolean;
}

/** Metadata about a backup */
export interface BackupMetadata {
  /** Unique backup identifier */
  id: string;
  /** When the backup was created */
  createdAt: string;
  /** Type of backup */
  type: "full" | "database" | "database-only" | "files-only";
  /** Optional description */
  description?: string;
  /** Size in bytes */
  sizeBytes: number;
  /** Human-readable size */
  sizeFormatted: string;
  /** Filename of the backup archive */
  filename: string;
  /** What was included in the backup */
  includes: {
    database: boolean;
    media: boolean;
    certs: boolean;
    public: boolean;
  };
}

type BackupMetaFile = BackupMetadata & {
  createdBy?: string;
};

function resolveBackupDir(): string {
  const configured = process.env.BACKUP_PATH || process.env.BACKUP_DIR || ".data/backups";
  const abs = path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  fs.mkdirSync(abs, { recursive: true });
  return abs;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[exp]}`;
}

function normalizeType(type?: BackupOptions["type"]): BackupMetadata["type"] {
  if (type === "database-only" || type === "files-only" || type === "database") return type;
  return "full";
}

function includesFromOptions(options: BackupOptions, type: BackupMetadata["type"]) {
  if (type === "database-only" || type === "database") {
    return {
      database: true,
      media: false,
      certs: false,
      public: false,
    };
  }
  if (type === "files-only") {
    return {
      database: false,
      media: options.includeMedia !== false,
      certs: options.includeCerts !== false,
      public: options.includePublic === true,
    };
  }
  return {
    database: true,
    media: options.includeMedia !== false,
    certs: options.includeCerts !== false,
    public: options.includePublic === true,
  };
}

function resolveUploadsDir(): string {
  const configured = process.env.UPLOAD_DIR;
  if (configured && configured.trim()) {
    return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  }
  return getUploadsRoot();
}

function resolveCertsDir(): string {
  const configured = process.env.CERTS_DIR || "/app/certs";
  return path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
}

function resolvePublicDir(): string {
  return path.resolve(process.cwd(), "public");
}

async function createDatabaseDump(outputPath: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_REQUIRED_FOR_BACKUP");
  }

  try {
    await execFileAsync("pg_dump", [
      "--no-owner",
      "--no-privileges",
      "--format=plain",
      "--encoding=UTF8",
      "--file",
      outputPath,
      databaseUrl,
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`PG_DUMP_FAILED: ${message}`);
  }
}

function copyDirIfExists(from: string, to: string): boolean {
  if (!fs.existsSync(from)) return false;
  fs.cpSync(from, to, { recursive: true, force: true });
  return true;
}

function replaceDirContents(from: string, to: string): boolean {
  if (!fs.existsSync(from)) return false;
  fs.mkdirSync(to, { recursive: true });
  fs.cpSync(from, to, { recursive: true, force: true });
  return true;
}

async function restoreDatabaseFromDump(dumpPath: string): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_REQUIRED_FOR_RESTORE");
  }

  try {
    await execFileAsync("psql", [
      "--set",
      "ON_ERROR_STOP=1",
      "--single-transaction",
      "--file",
      dumpPath,
      databaseUrl,
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`PSQL_RESTORE_FAILED: ${message}`);
  }
}

/**
 * Create a new backup
 * @param options - Backup options
 * @returns Metadata about the created backup
 */
export async function createBackup(options: BackupOptions = {}): Promise<BackupMetadata> {
  const id = `backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const type = normalizeType(options.type);
  const filename = `${id}.tar.gz`;
  const backupDir = resolveBackupDir();
  const archivePath = path.join(backupDir, filename);

  const includes = includesFromOptions(options, type);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sbc-backup-"));

  try {
    const includedFiles: string[] = [];
    const warnings: string[] = [];

    if (includes.database) {
      const dbDumpPath = path.join(tmpDir, "database.sql");
      await createDatabaseDump(dbDumpPath);
      includedFiles.push("database.sql");
    }

    if (includes.media) {
      const mediaSource = resolveUploadsDir();
      const copied = copyDirIfExists(mediaSource, path.join(tmpDir, "uploads"));
      if (copied) {
        includedFiles.push("uploads/");
      } else {
        warnings.push(`uploads directory not found: ${mediaSource}`);
      }
    }

    if (includes.certs) {
      const certsSource = resolveCertsDir();
      const copied = copyDirIfExists(certsSource, path.join(tmpDir, "certs"));
      if (copied) {
        includedFiles.push("certs/");
      } else {
        warnings.push(`certs directory not found: ${certsSource}`);
      }
    }

    if (includes.public) {
      const publicSource = resolvePublicDir();
      if (fs.existsSync(publicSource)) {
        fs.mkdirSync(path.join(tmpDir, "public"), { recursive: true });
        fs.cpSync(publicSource, path.join(tmpDir, "public"), {
          recursive: true,
          force: true,
          filter: (src) => !src.includes(`${path.sep}uploads${path.sep}`),
        });
        includedFiles.push("public/");
      } else {
        warnings.push(`public directory not found: ${publicSource}`);
      }
    }

    const manifest = {
      id,
      createdAt,
      type,
      description: options.description,
      includes,
      app: "sbc",
      includedFiles,
      warnings,
    };
    fs.writeFileSync(path.join(tmpDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

    const entries = fs.readdirSync(tmpDir);
    await tar.c(
      {
        gzip: true,
        file: archivePath,
        cwd: tmpDir,
      },
      entries
    );

    const stats = fs.statSync(archivePath);
    const metadata: BackupMetaFile = {
      id,
      createdAt,
      type,
      description: options.description,
      sizeBytes: stats.size,
      sizeFormatted: formatBytes(stats.size),
      filename,
      includes,
      createdBy: "admin",
    };

    fs.writeFileSync(
      path.join(backupDir, `${id}.meta.json`),
      JSON.stringify(metadata, null, 2),
      "utf8"
    );

    return metadata;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * List all available backups
 * @returns Array of backup metadata sorted by creation date (newest first)
 */
export async function listBackups(): Promise<BackupMetadata[]> {
  const backupDir = resolveBackupDir();
  const files = fs
    .readdirSync(backupDir)
    .filter((file) => file.endsWith(".tar.gz"));

  const backups: BackupMetadata[] = files.map((filename) => {
    const id = filename.replace(/\.tar\.gz$/, "");
    const filePath = path.join(backupDir, filename);
    const metaPath = path.join(backupDir, `${id}.meta.json`);
    const stats = fs.statSync(filePath);

    if (fs.existsSync(metaPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(metaPath, "utf8")) as Partial<BackupMetaFile>;
        return {
          id,
          createdAt: parsed.createdAt || stats.mtime.toISOString(),
          type: normalizeType(parsed.type as BackupOptions["type"]),
          description: parsed.description,
          sizeBytes: stats.size,
          sizeFormatted: formatBytes(stats.size),
          filename,
          includes: parsed.includes || {
            database: true,
            media: true,
            certs: true,
            public: false,
          },
        };
      } catch {
      }
    }

    return {
      id,
      createdAt: stats.mtime.toISOString(),
      type: "full",
      sizeBytes: stats.size,
      sizeFormatted: formatBytes(stats.size),
      filename,
      includes: {
        database: true,
        media: true,
        certs: true,
        public: false,
      },
    };
  });

  backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return backups;
}

/**
 * Get the file path for a backup
 * @param backupId - ID of the backup
 * @returns Absolute path to the backup file
 */
export function getBackupFilePath(backupId: string): string {
  // Sanitize backupId to prevent path traversal
  const sanitizedId = backupId.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.resolve(resolveBackupDir(), `${sanitizedId}.tar.gz`);
}

/**
 * Delete a backup
 * @param backupId - ID of the backup to delete
 */
export async function deleteBackup(backupId: string): Promise<void> {
  const sanitizedId = backupId.replace(/[^a-zA-Z0-9_-]/g, "");
  const backupDir = resolveBackupDir();
  const archivePath = path.join(backupDir, `${sanitizedId}.tar.gz`);
  const metaPath = path.join(backupDir, `${sanitizedId}.meta.json`);

  if (!fs.existsSync(archivePath)) {
    throw new Error("BACKUP_NOT_FOUND");
  }

  fs.rmSync(archivePath, { force: true });
  fs.rmSync(metaPath, { force: true });
}

/**
 * Restore from a backup
 * @param options - Restore options
 */
export async function restoreBackup(options: RestoreOptions): Promise<void> {
  if (!options.backupId) {
    throw new Error("backupId is required");
  }

  const filePath = getBackupFilePath(options.backupId);
  if (!fs.existsSync(filePath)) {
    throw new Error("BACKUP_NOT_FOUND");
  }

  const restoreDatabase = options.restoreDatabase !== false;
  const restoreFiles = options.restoreFiles !== false;

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sbc-restore-"));
  try {
    await tar.x({ file: filePath, cwd: tmpDir, gzip: true });

    if (restoreDatabase) {
      const dumpPath = path.join(tmpDir, "database.sql");
      if (!fs.existsSync(dumpPath)) {
        throw new Error("DATABASE_DUMP_NOT_FOUND_IN_BACKUP");
      }
      await restoreDatabaseFromDump(dumpPath);
    }

    if (restoreFiles) {
      const uploadsSource = path.join(tmpDir, "uploads");
      const certsSource = path.join(tmpDir, "certs");
      const publicSource = path.join(tmpDir, "public");

      const uploadsTarget = resolveUploadsDir();
      const certsTarget = resolveCertsDir();
      const publicTarget = resolvePublicDir();

      if (fs.existsSync(uploadsSource)) replaceDirContents(uploadsSource, uploadsTarget);
      if (fs.existsSync(certsSource)) replaceDirContents(certsSource, certsTarget);
      if (fs.existsSync(publicSource)) replaceDirContents(publicSource, publicTarget);
    }

    console.log("[backup] Restore completed:", {
      backupId: options.backupId,
      restoreDatabase,
      restoreFiles,
      filePath,
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
