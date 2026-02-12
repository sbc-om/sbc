import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { saveUpload } from "@/lib/uploads/storage";

export const runtime = "nodejs";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_SIZE = 10 * 1024 * 1024;

function sanitizeBaseName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "receipt";
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = (formData.get("file") ?? formData.get("receipt")) as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "NO_FILE" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ ok: false, error: "UNSUPPORTED_FILE_TYPE" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: "FILE_TOO_LARGE" }, { status: 400 });
    }

    const ext = path.extname(file.name || "").toLowerCase() || (file.type === "application/pdf" ? ".pdf" : ".jpg");
    const safeName = sanitizeBaseName(file.name || "receipt");
    const filename = `${safeName}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveUpload(buffer, {
      folder: "admin/agent-withdrawals/receipts",
      filename,
    });

    return NextResponse.json({ ok: true, url });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "UPLOAD_FAILED" },
      { status: 500 }
    );
  }
}
