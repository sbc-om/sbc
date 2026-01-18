/**
 * Admin API: Download backup file
 * GET /api/admin/backup/download/[backupId]
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth/jwt";
import { getBackupFilePath } from "@/lib/db/backup";
import fs from "node:fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ backupId: string }> }
) {
  try {
    const { backupId } = await params;

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

    // Get backup file path
    const filePath = getBackupFilePath(backupId);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    // Read file and return as download
    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${backupId}.tar.gz"`,
        "Content-Length": stats.size.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading backup:", error);
    return NextResponse.json(
      {
        error: "Failed to download backup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
