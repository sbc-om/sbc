import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/requireUser";
import { ensureActiveProgramSubscription } from "@/lib/db/subscriptions";
import { createBusinessRequest } from "@/lib/db/businessRequests";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser("en");

    // Must have an active Directory subscription
    await ensureActiveProgramSubscription(user.id, "directory");

    const body = await req.json();

    const request = await createBusinessRequest({
      userId: user.id,
      businessName: body.businessName || body.name,
      nameEn: body.nameEn,
      nameAr: body.nameAr,
      description: body.description,
      categoryId: body.categoryId,
      city: body.city,
      phone: body.phone,
      email: body.email,
      website: body.website,
    });

    return NextResponse.json(request);
  } catch (error: any) {
    console.error("Business request error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit request" },
      { status: 400 }
    );
  }
}
