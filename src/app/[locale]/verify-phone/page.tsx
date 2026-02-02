import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { isWAHAEnabled } from "@/lib/waha/client";
import { PublicPage } from "@/components/PublicPage";
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

  // If user's phone is already verified, redirect to dashboard
  if (user.isPhoneVerified) {
    redirect(`/${locale}/dashboard`);
  }

  // Check if WAHA is enabled for OTP functionality
  const wahaEnabled = isWAHAEnabled();
  if (!wahaEnabled) {
    // Can't verify without WAHA, redirect to dashboard
    redirect(`/${locale}/dashboard`);
  }

  const dict = await getDictionary(locale);

  return (
    <PublicPage>
      <div className="mx-auto w-full max-w-md">
        <VerifyPhoneClient
          locale={locale}
          dict={dict}
          phone={user.phone || ""}
          userId={user.id}
        />
      </div>
    </PublicPage>
  );
}
