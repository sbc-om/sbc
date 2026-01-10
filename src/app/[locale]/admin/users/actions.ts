"use server";

import { revalidatePath } from "next/cache";

import { updateUserRole } from "@/lib/db/users";
import type { Role } from "@/lib/db/types";
import type { Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";

export async function updateUserRoleAction(
  locale: Locale,
  userId: string,
  formData: FormData
) {
  const auth = await getCurrentUser();
  if (!auth || auth.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }

  const newRole = formData.get("role") as Role;
  if (!newRole || (newRole !== "user" && newRole !== "admin")) {
    throw new Error("INVALID_ROLE");
  }

  updateUserRole(userId, newRole);

  revalidatePath(`/${locale}/admin/users`);
  return { success: true };
}
