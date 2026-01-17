"use server";

import { revalidatePath } from "next/cache";

import { approveUserAccount, setUserActive, setUserVerified, updateUserAdmin, updateUserRole } from "@/lib/db/users";
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

export async function approveUserAction(locale: Locale, userId: string) {
  const auth = await getCurrentUser();
  if (!auth || auth.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }

  approveUserAccount(userId);
  revalidatePath(`/${locale}/admin/users`);
  return { success: true };
}

export async function updateUserVerifiedAction(
  locale: Locale,
  userId: string,
  isVerified: boolean,
) {
  const auth = await getCurrentUser();
  if (!auth || auth.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }

  setUserVerified(userId, isVerified);
  revalidatePath(`/${locale}/admin/users`);
  return { success: true };
}

export async function updateUserActiveAction(
  locale: Locale,
  userId: string,
  isActive: boolean,
) {
  const auth = await getCurrentUser();
  if (!auth || auth.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }

  setUserActive(userId, isActive);
  revalidatePath(`/${locale}/admin/users`);
  return { success: true };
}

export async function updateUserAdminAction(
  locale: Locale,
  userId: string,
  formData: FormData,
) {
  const auth = await getCurrentUser();
  if (!auth || auth.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }

  const email = String(formData.get("email") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const fullName = String(formData.get("fullName") || "").trim() || null;
  const displayName = String(formData.get("displayName") || "").trim() || null;
  const bio = String(formData.get("bio") || "").trim() || null;
  const role = String(formData.get("role") || "").trim() || null;
  const isVerifiedRaw = String(formData.get("isVerified") || "").trim();
  const isActiveRaw = String(formData.get("isActive") || "").trim();

  const isVerified = isVerifiedRaw ? isVerifiedRaw === "true" : null;
  const isActive = isActiveRaw ? isActiveRaw === "true" : null;

  if (role && role !== "admin" && role !== "user") {
    throw new Error("INVALID_ROLE");
  }

  updateUserAdmin(userId, {
    email,
    phone,
    fullName,
    displayName,
    bio,
    role: role as Role | null,
    isVerified,
    isActive,
  });

  revalidatePath(`/${locale}/admin/users`);
  revalidatePath(`/${locale}/admin/users/${userId}`);
  return { success: true };
}
