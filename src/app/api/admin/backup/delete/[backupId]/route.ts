/**
 * Admin API: Delete backup
 * DELETE /api/admin/backup/delete/[backupId]
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth/jwt";
import { deleteBackup } from "@/lib/db/backup";

export async function DELETE(
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

    // Delete backup
    await deleteBackup(backupId);

    return NextResponse.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    return NextResponse.json(
      {
        error: "Failed to delete backup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
