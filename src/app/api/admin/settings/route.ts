/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get all app settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: App settings
 *       401:
 *         description: Unauthorized
 *   patch:
 *     summary: Update app settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               whatsapp_login_enabled:
 *                 type: boolean
 *               whatsapp_registration_verification:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated
 *       401:
 *         description: Unauthorized
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getAllSettings, setSetting, type SettingKey } from "@/lib/db/settings";
import { isWAHAEnabled } from "@/lib/waha/client";

const updateSettingsSchema = z.object({
  whatsapp_login_enabled: z.boolean().optional(),
  whatsapp_registration_verification: z.boolean().optional(),
  whatsapp_login_notification: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const settings = await getAllSettings();
    const wahaEnabled = isWAHAEnabled();

    return NextResponse.json({
      ok: true,
      settings,
      whatsapp: {
        configured: wahaEnabled,
      },
    });
  } catch (error) {
    console.error("[Admin Settings] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    // Update each setting
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await setSetting(key as SettingKey, value);
      }
    }

    const settings = await getAllSettings();

    return NextResponse.json({
      ok: true,
      settings,
    });
  } catch (error) {
    console.error("[Admin Settings] PATCH error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
