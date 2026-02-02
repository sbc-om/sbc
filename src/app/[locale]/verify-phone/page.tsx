import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { isWhatsAppVerificationRequired } from "@/lib/db/settings";
import { isWAHAEnabled } from "@/lib/waha/client";
import type { Locale } from "@/lib/i18n/locales";
import { VerifyPhoneClient } from "./VerifyPhoneClient";

export default async function VerifyPhonePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check if verification is required
  const wahaEnabled = isWAHAEnabled();
  const verificationRequired = wahaEnabled ? await isWhatsAppVerificationRequired() : false;

  // If user already verified or verification not required, redirect to dashboard
  if (user.isVerified || !verificationRequired) {
    redirect(`/${locale}/dashboard`);
  }

  const dict = await getDictionary(locale);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <VerifyPhoneClient
        locale={locale}
        dict={dict}
        phone={user.phone || ""}
        userId={user.id}
      />
    </div>
  );
}
