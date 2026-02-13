"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import {
  createBusinessCard,
  updateBusinessCard,
  deleteBusinessCard,
  getBusinessCardById,
} from "@/lib/db/businessCards";

function readBoolean(formData: FormData, key: string): boolean | undefined {
  const raw = String(formData.get(key) ?? "").toLowerCase();
  if (!raw) return undefined;
  return ["1", "true", "on", "yes"].includes(raw);
}

export async function createBusinessCardAction(
  locale: Locale,
  businessId: string,
  formData: FormData
) {
  const user = await requireUser(locale);

  const card = await createBusinessCard({
    ownerId: user.id,
    businessId,
    fullName: String(formData.get("fullName") || "").trim(),
    title: String(formData.get("title") || "").trim() || undefined,
    email: String(formData.get("email") || "").trim() || undefined,
    phone: String(formData.get("phone") || "").trim() || undefined,
    website: String(formData.get("website") || "").trim() || undefined,
    avatarUrl: String(formData.get("avatarUrl") || "").trim() || undefined,
    bio: String(formData.get("bio") || "").trim() || undefined,
    isPublic: readBoolean(formData, "isPublic") ?? true,
  });

  revalidatePath(`/${locale}/directory/businesses/${businessId}/cards`);
  revalidatePath(`/${locale}/business-card/${card.id}`);
}

export async function updateBusinessCardAction(
  locale: Locale,
  businessId: string,
  cardId: string,
  formData: FormData
) {
  await requireUser(locale);

  await updateBusinessCard(cardId, {
    fullName: String(formData.get("fullName") || "").trim(),
    title: String(formData.get("title") || "").trim() || undefined,
    email: String(formData.get("email") || "").trim() || undefined,
    phone: String(formData.get("phone") || "").trim() || undefined,
    website: String(formData.get("website") || "").trim() || undefined,
    avatarUrl: String(formData.get("avatarUrl") || "").trim() || undefined,
    bio: String(formData.get("bio") || "").trim() || undefined,
    isPublic: readBoolean(formData, "isPublic") ?? true,
  });

  revalidatePath(`/${locale}/directory/businesses/${businessId}/cards`);
  revalidatePath(`/${locale}/business-card/${cardId}`);
  redirect(`/${locale}/directory/businesses/${businessId}/cards`);
}

export async function deleteBusinessCardAction(
  locale: Locale,
  businessId: string,
  cardId: string
) {
  await requireUser(locale);
  await deleteBusinessCard(cardId);

  revalidatePath(`/${locale}/directory/businesses/${businessId}/cards`);
  revalidatePath(`/${locale}/business-card/${cardId}`);
  redirect(`/${locale}/directory/businesses/${businessId}/cards`);
}

export async function toggleBusinessCardVisibilityAction(
  locale: Locale,
  businessId: string,
  cardId: string,
  isPublic: boolean
) {
  await requireUser(locale);
  await updateBusinessCard(cardId, { isPublic });

  revalidatePath(`/${locale}/directory/businesses/${businessId}/cards`);
  revalidatePath(`/${locale}/business-card/${cardId}`);
  return { ok: true } as const;
}

export async function editBusinessCardRedirectAction(
  locale: Locale,
  businessId: string,
  cardId: string
) {
  await requireUser(locale);
  const card = await getBusinessCardById(cardId);
  if (!card) return;
  redirect(`/${locale}/directory/businesses/${businessId}/cards/${card.id}`);
}
