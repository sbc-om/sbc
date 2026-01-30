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
    const product = await getStoreProductBySlug(slug);
    if (!product) continue;

    await purchaseProgramSubscription({
      userId: user.id,
      productId: product.id,
      productSlug: product.slug,
      program: product.program,
      durationDays: product.durationDays,
      amount: product.price.amount,
      currency: "OMR",
    });
  }

  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/loyalty`);
  revalidatePath(`/${locale}/marketing-platform`);
  revalidatePath(`/${locale}/directory`);
}