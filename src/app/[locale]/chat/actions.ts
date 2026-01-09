"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireUser } from "@/lib/auth/requireUser";
import { getBusinessBySlug } from "@/lib/db/businesses";
import { sendUserMessage } from "@/lib/db/chats";

export async function sendChatMessageAction(locale: Locale, businessSlug: string, formData: FormData) {
  const user = await requireUser(locale);
  const text = String(formData.get("text") || "").trim();
  if (!text) return;

  const business = getBusinessBySlug(businessSlug);
  if (!business) return;

  sendUserMessage({
    userId: user.id,
    businessId: business.id,
    businessSlug: business.slug,
    text,
  });

  revalidatePath(`/${locale}/chat/${business.slug}`);
  revalidatePath(`/${locale}/chat`);
}
