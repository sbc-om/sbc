"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { ensureActiveProgramSubscription } from "@/lib/db/subscriptions";
import { createBusinessRequest } from "@/lib/db/businessRequests";

export async function submitBusinessRequestAction(locale: Locale, formData: FormData) {
  const user = await requireUser(locale);

  // Must have an active Directory subscription to request a listing.
  // (UI also blocks submission, but enforce server-side as well.)
  ensureActiveProgramSubscription(user.id, "directory");

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const website = String(formData.get("website") || "").trim();

  createBusinessRequest({
    userId: user.id,
    name,
    description: description || undefined,
    categoryId: categoryId || undefined,
    city: city || undefined,
    phone: phone || undefined,
    email: email || undefined,
    website: website || undefined,
  });

  revalidatePath(`/${locale}/business-request`);
  redirect(`/${locale}/business-request?success=1`);
}
