"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { createContactMessage } from "@/lib/db/contactMessages";

export async function submitContactMessageAction(locale: Locale, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  try {
    createContactMessage({
      name,
      email,
      subject,
      message,
      locale,
    });
  } catch {
    redirect(`/${locale}/contact?error=validation`);
  }

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/contact-messages`);
  redirect(`/${locale}/contact?sent=1`);
}
