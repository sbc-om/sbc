import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/currentUser";
import {
  createLoyaltyStaff,
  listLoyaltyStaffByUser,
  updateLoyaltyStaff,
} from "@/lib/db/loyaltyStaff";

export const runtime = "nodejs";

const createSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(40),
  })
  .strict();

const updateSchema = z
  .object({
    id: z.string().trim().min(1),
    fullName: z.string().trim().min(2).max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const staff = await listLoyaltyStaffByUser(user.id);
  return Response.json({ ok: true, staff });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const json = await req.json();
    const data = createSchema.parse(json);
    const staff = await createLoyaltyStaff({
      userId: user.id,
      fullName: data.fullName,
      phone: data.phone,
    });
    return Response.json({ ok: true, staff });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CREATE_STAFF_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const json = await req.json();
    const data = updateSchema.parse(json);
    const current = await listLoyaltyStaffByUser(user.id);
    const owns = current.some((item) => item.id === data.id);
    if (!owns) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    const staff = await updateLoyaltyStaff(data.id, {
      fullName: data.fullName,
      isActive: data.isActive,
    });
    return Response.json({ ok: true, staff });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPDATE_STAFF_FAILED";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
