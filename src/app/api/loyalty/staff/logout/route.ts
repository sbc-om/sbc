import { cookies } from "next/headers";

import { getLoyaltyStaffCookieName } from "@/lib/auth/loyaltyStaffSession";

export const runtime = "nodejs";

export async function POST() {
  (await cookies()).set(getLoyaltyStaffCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return Response.json({ ok: true });
}
