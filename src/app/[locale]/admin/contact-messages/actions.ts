"use server";

import { revalidatePath } from "next/cache";

import type { Locale } from "@/lib/i18n/locales";
import { requireAdmin } from "@/lib/auth/requireUser";
import { setContactMessageRead } from "@/lib/db/contactMessages";

export async function setContactMessageReadAction(
  locale: Locale,
  messageId: string,
  isRead: boolean
) {
  await requireAdmin(locale);
  setContactMessageRead({ messageId, isRead });

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/contact-messages`);
}
