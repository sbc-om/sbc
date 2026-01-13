import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import { getBusinessById, updateBusiness } from "@/lib/db/businesses";

export const runtime = "nodejs";

const bodySchema = z.object({
  avatarMode: z.enum(["icon", "logo"]),
});

function canEditBusiness(user: Awaited<ReturnType<typeof getCurrentUser>>, business: ReturnType<typeof getBusinessById>): boolean {
  if (!user || !business) return false;
  if (user.role === "admin") return true;
  return !!business.ownerId && business.ownerId === user.id;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const business = getBusinessById(id);
  if (!business) return Response.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  if (!canEditBusiness(user, business)) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { avatarMode } = bodySchema.parse(json);

    const next = updateBusiness(id, { avatarMode });
    return Response.json({ ok: true, avatarMode: next.avatarMode ?? "icon" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "INVALID_REQUEST";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
