import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { contentTypeFromExt, getUploadsRoot } from "@/lib/uploads/storage";

export const runtime = "nodejs";

function safeJoinUploadsRoot(rel: string) {
  // Normalize using posix because route params are URL segments.
  const normalized = path.posix.normalize(rel).replace(/^\/+/, "");
  if (normalized.includes("..")) throw new Error("INVALID_PATH");

  const root = getUploadsRoot();
  const abs = path.join(root, normalized);

  const resolved = path.resolve(abs);
  const resolvedRoot = path.resolve(root);
  if (!resolved.startsWith(resolvedRoot + path.sep) && resolved !== resolvedRoot) {
    throw new Error("INVALID_PATH");
  }

  return resolved;
}

function parseRange(rangeHeader: string | null, size: number) {
  if (!rangeHeader) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!m) return null;

  const startRaw = m[1];
  const endRaw = m[2];

  let start = startRaw ? Number(startRaw) : 0;
  let end = endRaw ? Number(endRaw) : size - 1;

  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (start < 0) start = 0;
  if (end >= size) end = size - 1;
  if (start > end) return null;

  return { start, end };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: parts } = await params;
    const rel = parts.join("/");
    const absPath = safeJoinUploadsRoot(rel);

    const stat = await fsp.stat(absPath);
    if (!stat.isFile()) return new Response("Not found", { status: 404 });

    const ext = path.extname(absPath);
    const contentType = contentTypeFromExt(ext);

    const range = parseRange(req.headers.get("range"), stat.size);

    if (range) {
      const { start, end } = range;
      const nodeStream = fs.createReadStream(absPath, { start, end });
      const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

      return new Response(webStream, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": String(end - start + 1),
          // Cache aggressively; filenames are content-addressed (nanoid), so safe.
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    const nodeStream = fs.createReadStream(absPath);
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function HEAD(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const res = await GET(req, ctx);
  // Strip body for HEAD.
  return new Response(null, {
    status: res.status,
    headers: res.headers,
  });
}
