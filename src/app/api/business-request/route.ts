import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/requireUser";
import { ensureActiveProgramSubscription } from "@/lib/db/subscriptions";
import { createBusinessRequest } from "@/lib/db/businessRequests";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await requireUser("en");

    // Must have an active Directory subscription
    ensureActiveProgramSubscription(user.id, "directory");

    const body = await req.json();

    const request = createBusinessRequest({
      userId: user.id,
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      city: body.city,
      address: body.address,
      phone: body.phone,
      email: body.email,
      website: body.website,
      latitude: body.latitude,
      longitude: body.longitude,
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
