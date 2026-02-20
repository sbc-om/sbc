import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/requireUser";
import { ensureActiveProgramSubscription } from "@/lib/db/subscriptions";
import { createBusinessRequest } from "@/lib/db/businessRequests";
import { checkBusinessUsernameAvailability } from "@/lib/db/businesses";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser("en");

    // Must have an active Directory subscription
    await ensureActiveProgramSubscription(user.id, "directory");

    const body = await req.json();

    const username = String(body?.username || "").trim().toLowerCase();
    if (username) {
      if (username.length <= 5) {
        return NextResponse.json({ error: "USERNAME_TOO_SHORT" }, { status: 400 });
      }
      const availability = await checkBusinessUsernameAvailability(username);
      if (!availability.available) {
        return NextResponse.json(
          { error: availability.reason === "INVALID" ? "USERNAME_INVALID" : "USERNAME_TAKEN" },
          { status: 400 }
        );
      }
    }

    const request = await createBusinessRequest({
      userId: user.id,
      businessName: body.name_en || body.businessName || body.name,
      nameEn: body.name_en || body.nameEn,
      nameAr: body.name_ar || body.nameAr,
      descEn: body.desc_en || body.descEn,
      descAr: body.desc_ar || body.descAr,
      description: body.description,
      categoryId: body.categoryId,
      city: body.city,
      address: body.address,
      phone: body.phone,
      email: body.email,
      website: body.website,
      tags: body.tags,
      latitude: body.latitude,
      longitude: body.longitude,
    });

    return NextResponse.json(request);
  } catch (error: unknown) {
    console.error("Business request error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit request" },
      { status: 400 }
    );
  }
}
