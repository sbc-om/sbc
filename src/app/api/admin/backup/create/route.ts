/**
 * Admin API: Create new backup
 * POST /api/admin/backup/create
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth/jwt";
import { createBackup, type BackupOptions } from "@/lib/db/backup";

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
    const body = await req.json().catch(() => ({}));
    const options: BackupOptions = {
      type: body.type || "full",
      description: body.description,
      includeMedia: body.includeMedia !== false,
      includeCerts: body.includeCerts !== false,
      includePublic: body.includePublic || false,
    };

    // Create backup
    const metadata = await createBackup(options);

    return NextResponse.json({
      success: true,
      backup: metadata,
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    return NextResponse.json(
      {
        error: "Failed to create backup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
