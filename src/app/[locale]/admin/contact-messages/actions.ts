"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireAdmin } from "@/lib/auth/requireUser";
import { markContactMessageAsRead } from "@/lib/db/contactMessages";

export async function setContactMessageReadAction(
  locale: Locale,
  messageId: string,
  isRead: boolean
) {
  await requireAdmin(locale);
  // Note: currently only supports marking as read
  if (isRead) {
    await markContactMessageAsRead(messageId);
  }

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/contact-messages`);
}
