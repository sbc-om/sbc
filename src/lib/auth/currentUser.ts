import { cookies } from "next/headers";

import { getAuthCookieName, verifyAuthToken } from "./jwt";
import { getUserById } from "@/lib/db/users";

export async function getCurrentUser() {
  const cookieName = getAuthCookieName();
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  try {
    const payload = await verifyAuthToken(token);
    const user = await getUserById(payload.sub);
    if (!user) return null;
    if (user.approvalStatus && user.approvalStatus !== "approved") return null;
    if (user.isActive === false) return null;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      displayName: user.displayName ?? user.email.split("@")[0],
      avatarUrl: user.avatarUrl ?? null,
      isVerified: user.isVerified ?? false,
      username: user.username,
    };
  } catch {
    return null;
  }
}
