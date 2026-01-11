"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getStoreProductBySlug } from "@/lib/store/products";
import { purchaseProgramSubscription } from "@/lib/db/subscriptions";

export async function finalizeCheckoutAction(locale: Locale, slugs: string[]) {
  const user = await requireUser(locale);

  const unique = Array.from(new Set((slugs || []).map((s) => String(s)))).filter(Boolean);
  if (unique.length === 0) return;

  for (const slug of unique) {
    const product = getStoreProductBySlug(slug);
    if (!product) continue;

    purchaseProgramSubscription({
      userId: user.id,
      program: product.program,
      plan: product.plan,
      durationDays: product.durationDays,
    });
  }

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/loyalty`);
  revalidatePath(`/${locale}/marketing-platform`);
  revalidatePath(`/${locale}/directory`);
}