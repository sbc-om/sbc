"use server";

import { redirect, notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import {
  createLoyaltyCustomer,
  getLoyaltyProfileByJoinCode,
} from "@/lib/db/loyalty";

export async function joinLoyaltyByCodeAction(
  locale: Locale,
  code: string,
  formData: FormData,
) {
  const profile = await getLoyaltyProfileByJoinCode(code);
  if (!profile) notFound();

  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!phone) {
    redirect(`/${locale}/loyalty/join/${code}?error=PHONE_REQUIRED`);
  }

  let customer;
  try {
    customer = await createLoyaltyCustomer({
      userId: profile.userId,
      fullName,
      memberId: phone, // Use phone as memberId for public join
      phone,
      email: email || undefined,
    });
  } catch {
    redirect(`/${locale}/loyalty/join/${code}?error=INVALID_INPUT`);
  }

  // Flag the first visit so the card page can nudge / auto-enable push if permission is already granted.
  redirect(`/${locale}/loyalty/card/${customer.cardId}?joined=1`);
}
