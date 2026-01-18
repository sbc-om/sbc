/**
 * Admin API: List all backups
 * GET /api/admin/backup/list
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth/jwt";
import { listBackups } from "@/lib/db/backup";

export async function GET(req: NextRequest) {
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

    // List backups
    const backups = await listBackups();

    return NextResponse.json({
      success: true,
      backups,
      count: backups.length,
    });
  } catch (error) {
    console.error("Error listing backups:", error);
    return NextResponse.json(
      {
        error: "Failed to list backups",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
