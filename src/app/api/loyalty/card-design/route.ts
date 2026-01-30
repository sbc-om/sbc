import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getLoyaltySettingsByUserId, upsertLoyaltySettings } from "@/lib/db/loyalty";

export const runtime = "nodejs";

const cardDesignSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  backgroundStyle: z.enum(["solid", "gradient", "pattern"]),
  logoPosition: z.enum(["top", "center", "corner"]),
  showBusinessName: z.boolean(),
  showCustomerName: z.boolean(),
  cornerRadius: z.number().int().min(0).max(32),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = cardDesignSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid card design data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Use upsertLoyaltySettings with cardDesign
    const updatedSettings = await upsertLoyaltySettings(user.id, {
      cardDesign: parsed.data,
    });

    return NextResponse.json({ success: true, cardDesign: updatedSettings.cardDesign });
  } catch (error) {
    console.error("Error saving card design:", error);
    return NextResponse.json(
      { error: "Failed to save card design" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getLoyaltySettingsByUserId(user.id);
    if (!settings) {
      return NextResponse.json(
        { error: "Loyalty settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cardDesign: settings.cardDesign || null,
    });
  } catch (error) {
    console.error("Error fetching card design:", error);
    return NextResponse.json(
      { error: "Failed to fetch card design" },
      { status: 500 }
    );
  }
}
