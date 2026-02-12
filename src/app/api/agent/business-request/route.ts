import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getAgentByUserId } from "@/lib/db/agents";
import { createBusinessRequest } from "@/lib/db/businessRequests";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Must be agent or admin
    if (user.role !== "agent" && user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden — agent access required" },
        { status: 403 }
      );
    }

    // Verify agent record exists
    const agent = await getAgentByUserId(user.id);
    if (!agent && user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Agent profile not found" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const request = await createBusinessRequest({
      userId: body.clientUserId || undefined, // client user id if registering for a specific client
      agentUserId: user.id,
      businessName: body.name_en || body.businessName || body.name || "",
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

    return NextResponse.json({ ok: true, request });
  } catch (error: any) {
    console.error("Agent business request error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to submit request" },
      { status: 400 }
    );
  }
}
