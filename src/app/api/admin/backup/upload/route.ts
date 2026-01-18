/**
 * Admin API: Upload and restore backup
 * POST /api/admin/backup/upload
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth/jwt";
import fs from "node:fs";
import path from "node:path";

function getBackupPath(): string {
  const p = process.env.BACKUP_PATH || ".data/backups";
  const backupPath = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  fs.mkdirSync(backupPath, { recursive: true });
  return backupPath;
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication from cookie
    const cookieName = getAuthCookieName();
    const token = (await cookies()).get(cookieName)?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userRole: string;
    try {
      const decoded = await verifyAuthToken(token);
      userRole = decoded.role;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify admin role
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith(".tar.gz")) {
      return NextResponse.json(
        { error: "Invalid file type. Expected .tar.gz" },
        { status: 400 }
      );
    }

    // Save uploaded file
    const backupPath = getBackupPath();
    const fileName = file.name;
    const filePath = path.join(backupPath, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: "Backup uploaded successfully",
      filename: fileName,
      size: buffer.length,
    });
  } catch (error) {
    console.error("Error uploading backup:", error);
    return NextResponse.json(
      {
        error: "Failed to upload backup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
