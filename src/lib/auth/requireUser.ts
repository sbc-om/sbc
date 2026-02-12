import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "./currentUser";

export async function requireUser(locale: Locale) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);
  return user;
}

export async function requireAdmin(locale: Locale) {
  const user = await requireUser(locale);
  if (user.role !== "admin") redirect(`/${locale}/dashboard`);
  return user;
}

export async function requireAgent(locale: Locale) {
  const user = await requireUser(locale);
  if (user.role !== "agent" && user.role !== "admin") redirect(`/${locale}/dashboard`);
  return user;
}
