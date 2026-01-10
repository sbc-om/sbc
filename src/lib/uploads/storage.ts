import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { nanoid } from "nanoid";

export type UploadKind = "cover" | "logo" | "banner" | "gallery" | "video";

export type UserUploadKind = "avatar";

const MEDIA_URL_PREFIX = "/media/";

function resolveUploadsRoot() {
  // Required by the user: keep uploads under `.data/`.
  const root = path.join(process.cwd(), ".data", "uploads");
  return root;
}

async function writeUploadMetadata(params: {
  absPath: string;
  businessId: string;
  kind: UploadKind;
  file: File;
  url: string;
}) {
  const meta = {
    businessId: params.businessId,
    kind: params.kind,
    url: params.url,
    originalName: params.file.name,
    contentType: params.file.type || "application/octet-stream",
    size: params.file.size,
    uploadedAt: new Date().toISOString(),
  };

  // Sidecar metadata file next to the upload for traceability/debugging.
  // Example: photo.jpg.json
  await fs.writeFile(`${params.absPath}.json`, JSON.stringify(meta, null, 2));
}

async function writeUserUploadMetadata(params: {
  absPath: string;
  userId: string;
  kind: UserUploadKind;
  file: File;
  url: string;
}) {
  const meta = {
    userId: params.userId,
    kind: params.kind,
    url: params.url,
    originalName: params.file.name,
    contentType: params.file.type || "application/octet-stream",
    size: params.file.size,
    uploadedAt: new Date().toISOString(),
  };

  await fs.writeFile(`${params.absPath}.json`, JSON.stringify(meta, null, 2));
}

function ensureSafeRelative(relPath: string) {
  // Normalize to prevent path traversal.
  const normalized = path.posix.normalize(relPath).replace(/^\/+/, "");
  if (normalized.includes("..")) throw new Error("INVALID_PATH");
  return normalized;
}

function extFromMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "video/mp4":
      return ".mp4";
    case "video/webm":
      return ".webm";
    case "video/quicktime":
      return ".mov";
    default:
      return "";
  }
}

export function contentTypeFromExt(ext: string) {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
}

export function getUploadsRoot() {
  return resolveUploadsRoot();
}

export function mediaUrlFromRelativePath(relPath: string) {
  const safe = ensureSafeRelative(relPath);
  return `${MEDIA_URL_PREFIX}${safe}`;
}

export function relativePathFromMediaUrl(url: string) {
  if (!url.startsWith(MEDIA_URL_PREFIX)) throw new Error("INVALID_MEDIA_URL");
  const rel = url.slice(MEDIA_URL_PREFIX.length);
  return ensureSafeRelative(rel);
}

export function diskPathFromMediaUrl(url: string) {
  const root = resolveUploadsRoot();
  const rel = relativePathFromMediaUrl(url);
  const abs = path.join(root, rel);

  // Ensure final path is still within root
  const resolved = path.resolve(abs);
  const resolvedRoot = path.resolve(root);
  if (!resolved.startsWith(resolvedRoot + path.sep) && resolved !== resolvedRoot) {
    throw new Error("INVALID_PATH");
  }

  return resolved;
}

export async function storeUpload(params: {
  businessId: string;
  kind: UploadKind;
  file: File;
}) {
  const { businessId, kind, file } = params;

  const mime = file.type || "application/octet-stream";
  const originalExt = path.extname(file.name || "");
  const ext = (originalExt && originalExt.length <= 10 ? originalExt : "") || extFromMime(mime);

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  const filename = `${nanoid()}${ext}`;
  const relDir = path.posix.join("businesses", businessId, kind, yyyy, mm);
  const relPath = path.posix.join(relDir, filename);

  const root = resolveUploadsRoot();
  const absDir = path.join(root, relDir);
  const absPath = path.join(root, relPath);

  await fs.mkdir(absDir, { recursive: true });

  // Stream file to disk to avoid buffering large videos in memory.
  const webStream = file.stream();
  const nodeReadable = Readable.fromWeb(webStream as unknown as NodeReadableStream);
  const nodeWritable = fssync.createWriteStream(absPath, { flags: "wx" });

  await pipeline(nodeReadable, nodeWritable);

  const url = mediaUrlFromRelativePath(relPath);
  await writeUploadMetadata({ absPath, businessId, kind, file, url });

  return {
    url,
    relativePath: relPath,
    diskPath: absPath,
    contentType: mime,
    size: file.size,
    originalName: file.name,
  };
}

export function validateUpload(params: {
  kind: UploadKind;
  file: File;
}) {
  const { kind, file } = params;

  const mime = file.type;
  const size = file.size;

  const imageMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const videoMimes = ["video/mp4", "video/webm", "video/quicktime"];

  if (kind === "cover" || kind === "logo" || kind === "banner" || kind === "gallery") {
    if (!imageMimes.includes(mime)) throw new Error("UNSUPPORTED_IMAGE_TYPE");
    if (size > 10 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE");
  } else {
    if (!videoMimes.includes(mime)) throw new Error("UNSUPPORTED_VIDEO_TYPE");
    if (size > 200 * 1024 * 1024) throw new Error("VIDEO_TOO_LARGE");
  }
}

export function validateUserImageUpload(params: {
  kind: UserUploadKind;
  file: File;
}) {
  const { kind, file } = params;

  if (kind !== "avatar") throw new Error("INVALID_KIND");

  const mime = file.type;
  const size = file.size;

  const imageMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!imageMimes.includes(mime)) throw new Error("UNSUPPORTED_IMAGE_TYPE");
  // Slightly stricter for avatars
  if (size > 5 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE");
}

export async function storeUserUpload(params: {
  userId: string;
  kind: UserUploadKind;
  file: File;
}) {
  const { userId, kind, file } = params;

  const mime = file.type || "application/octet-stream";
  const originalExt = path.extname(file.name || "");
  const ext = (originalExt && originalExt.length <= 10 ? originalExt : "") || extFromMime(mime);

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  const filename = `${nanoid()}${ext}`;
  const relDir = path.posix.join("users", userId, kind, yyyy, mm);
  const relPath = path.posix.join(relDir, filename);

  const root = resolveUploadsRoot();
  const absDir = path.join(root, relDir);
  const absPath = path.join(root, relPath);

  await fs.mkdir(absDir, { recursive: true });

  const webStream = file.stream();
  const nodeReadable = Readable.fromWeb(webStream as unknown as NodeReadableStream);
  const nodeWritable = fssync.createWriteStream(absPath, { flags: "wx" });

  await pipeline(nodeReadable, nodeWritable);

  const url = mediaUrlFromRelativePath(relPath);
  await writeUserUploadMetadata({ absPath, userId, kind, file, url });

  return {
    url,
    relativePath: relPath,
    diskPath: absPath,
    contentType: mime,
    size: file.size,
    originalName: file.name,
  };
}
