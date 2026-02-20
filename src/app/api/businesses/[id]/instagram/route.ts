import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessById, setBusinessInstagramUsername } from "@/lib/db/businesses";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Internal server error";
}

const bodySchema = z.object({
  instagramUsername: z
    .string()
    .trim()
    .regex(/^@?([a-z0-9._]{1,30})$/, "Invalid Instagram username")
    .transform((value) => value.replace(/^@/, ""))
    .nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: businessId } = await params;
    const business = await getBusinessById(businessId);

    if (!business) {
      return NextResponse.json({ ok: false, error: "Business not found" }, { status: 404 });
    }

    if (business.ownerId !== user.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const raw = await req.json();
    const parsed = bodySchema.safeParse({
      instagramUsername:
        raw?.instagramUsername === null
          ? null
          : String(raw?.instagramUsername || "").trim() || null,
    });

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
    }

    const updated = await setBusinessInstagramUsername(businessId, parsed.data.instagramUsername);
    return NextResponse.json({
      ok: true,
      data: {
        instagramUsername: updated.instagramUsername || null,
        moderationStatus: updated.instagramModerationStatus || "approved",
      },
    });
  } catch (error: unknown) {
    console.error("[business-instagram] PUT error:", error);
    return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
