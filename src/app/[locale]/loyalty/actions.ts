"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import {
  purchaseLoyaltySubscription,
  createLoyaltyCustomer,
  adjustLoyaltyCustomerPoints,
} from "@/lib/db/loyalty";

export async function purchaseLoyaltySubscriptionAction(locale: Locale, formData: FormData) {
  const user = await requireUser(locale);
  const plan = String(formData.get("plan") || "").trim();

  purchaseLoyaltySubscription({
    userId: user.id,
    // validated in db layer
    plan: plan as any,
  });

  revalidatePath(`/${locale}/loyalty/manage`);
  redirect(`/${locale}/loyalty/manage?success=1`);
}

export async function addLoyaltyCustomerAction(locale: Locale, formData: FormData) {
  const user = await requireUser(locale);

  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  createLoyaltyCustomer({
    userId: user.id,
    customer: {
      fullName,
      phone: phone || undefined,
      email: email || undefined,
      notes: notes || undefined,
    },
  });

  revalidatePath(`/${locale}/loyalty/manage`);
  redirect(`/${locale}/loyalty/manage`);
}

export async function adjustLoyaltyCustomerPointsAction(locale: Locale, formData: FormData) {
  const user = await requireUser(locale);

  const customerId = String(formData.get("customerId") || "").trim();
  const deltaRaw = String(formData.get("delta") || "").trim();
  const delta = Number(deltaRaw);

  if (!Number.isFinite(delta)) {
    redirect(`/${locale}/loyalty/manage`);
  }

  adjustLoyaltyCustomerPoints({
    userId: user.id,
    customerId,
    delta: Math.trunc(delta),
  });

  revalidatePath(`/${locale}/loyalty/manage`);
  redirect(`/${locale}/loyalty/manage`);
}
