"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import {
  purchaseLoyaltySubscription,
  createLoyaltyCustomer,
  adjustLoyaltyCustomerPoints,
  redeemLoyaltyCustomerPoints,
} from "@/lib/db/loyalty";
import type { LoyaltyPlan } from "@/lib/db/types";

function safeReturnTo(locale: Locale, value: unknown): string | null {
  const v = String(value || "").trim();
  if (!v) return null;
  // Prevent open redirects. Only allow loyalty manage paths.
  if (!v.startsWith(`/${locale}/loyalty/manage`)) return null;
  return v;
}

export async function purchaseLoyaltySubscriptionAction(locale: Locale, formData: FormData) {
  const user = await requireUser(locale);
  const planRaw = String(formData.get("plan") || "").trim();

  if (planRaw !== "starter" && planRaw !== "pro") {
    redirect(`/${locale}/loyalty/manage?error=INVALID_PLAN`);
  }

  const plan: LoyaltyPlan = planRaw;

  purchaseLoyaltySubscription({
    userId: user.id,
    // validated again in db layer
    plan,
  });

  revalidatePath(`/${locale}/loyalty/manage`);
  redirect(`/${locale}/loyalty/manage?success=1`);
}

export async function addLoyaltyCustomerAction(locale: Locale, formData: FormData) {
  const user = await requireUser(locale);

  const returnTo = safeReturnTo(locale, formData.get("returnTo"));

  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!phone) {
    redirect(returnTo ? `${returnTo}?error=PHONE_REQUIRED` : `/${locale}/loyalty/manage?error=PHONE_REQUIRED`);
  }

  createLoyaltyCustomer({
    userId: user.id,
    customer: {
      fullName,
      phone,
      email: email || undefined,
      notes: notes || undefined,
    },
  });

  const target = returnTo ?? `/${locale}/loyalty/manage`;
  revalidatePath(target);
  redirect(target);
}

export async function adjustLoyaltyCustomerPointsAction(locale: Locale, formData: FormData) {
  const user = await requireUser(locale);

  const returnTo = safeReturnTo(locale, formData.get("returnTo"));

  const customerId = String(formData.get("customerId") || "").trim();
  const deltaRaw = String(formData.get("delta") || "").trim();
  const delta = Number(deltaRaw);

  if (!Number.isFinite(delta)) {
    redirect(returnTo ?? `/${locale}/loyalty/manage`);
  }

  adjustLoyaltyCustomerPoints({
    userId: user.id,
    customerId,
    delta: Math.trunc(delta),
  });

  const target = returnTo ?? `/${locale}/loyalty/manage`;
  revalidatePath(target);
  redirect(target);
}

export async function redeemLoyaltyCustomerPointsAction(locale: Locale, formData: FormData) {
  const user = await requireUser(locale);

  const returnTo = safeReturnTo(locale, formData.get("returnTo"));
  const customerId = String(formData.get("customerId") || "").trim();

  try {
    redeemLoyaltyCustomerPoints({
      userId: user.id,
      customerId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "REDEEM_FAILED";
    const target = returnTo ?? `/${locale}/loyalty/manage`;
    revalidatePath(target);
    redirect(`${target}?error=${encodeURIComponent(message)}`);
  }

  const target = returnTo ?? `/${locale}/loyalty/manage`;
  revalidatePath(target);
  redirect(target);
}
