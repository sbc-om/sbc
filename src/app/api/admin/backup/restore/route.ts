/**
 * Admin API: Restore from backup
 * POST /api/admin/backup/restore
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth/jwt";
import { restoreBackup, type RestoreOptions } from "@/lib/db/backup";

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

    // Parse request body
    const body = await req.json();
    if (!body.backupId) {
      return NextResponse.json({ error: "backupId is required" }, { status: 400 });
    }

    const options: RestoreOptions = {
      backupId: body.backupId,
      restoreDatabase: body.restoreDatabase !== false,
      restoreFiles: body.restoreFiles !== false,
    };

    // Restore backup
    await restoreBackup(options);

    return NextResponse.json({
      success: true,
      message: "Backup restored successfully",
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      {
        error: "Failed to restore backup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
