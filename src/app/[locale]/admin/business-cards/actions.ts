"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getBusinessById } from "@/lib/db/businesses";
import { getBusinessCardById, setBusinessCardApproved } from "@/lib/db/businessCards";

export async function setBusinessCardApprovalAction(
  locale: Locale,
  cardId: string,
  approved: boolean
) {
  await requireAdmin(locale);

  const card = await getBusinessCardById(cardId);
  if (!card) throw new Error("CARD_NOT_FOUND");

  await setBusinessCardApproved(cardId, approved);

  revalidatePath(`/${locale}/admin/business-cards`);
  revalidatePath(`/${locale}/business-card/${cardId}`);

  const business = await getBusinessById(card.businessId);
  if (business) {
    revalidatePath(`/${locale}/businesses/${business.slug}`);
  }
}