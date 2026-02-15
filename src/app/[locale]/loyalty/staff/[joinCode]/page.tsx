import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { getCurrentLoyaltyStaffSession } from "@/lib/auth/loyaltyStaffSession";
import { getLoyaltyProfileByJoinCode } from "@/lib/db/loyalty";
import { getLoyaltyStaffById } from "@/lib/db/loyaltyStaff";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { StaffWorkspaceClient } from "./StaffWorkspaceClient";
import { buttonVariants } from "@/components/ui/Button";

export const runtime = "nodejs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; joinCode: string }>;
}): Promise<Metadata> {
  const { locale, joinCode } = await params;
  if (!isLocale(locale)) return {};

  const profile = await getLoyaltyProfileByJoinCode(joinCode);
  if (!profile) return {};

  const manifestPath = `/${locale}/loyalty/staff/${joinCode}/manifest.webmanifest`;

  return {
    title: `${profile.businessName} Seller`,
    description:
      locale === "ar"
        ? `بوابة البائع الخاصة بـ ${profile.businessName}`
        : `${profile.businessName} seller workspace`,
    manifest: manifestPath,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: profile.businessName,
    },
  };
}

export default async function LoyaltyStaffPortalPage({
  params,
}: {
  params: Promise<{ locale: string; joinCode: string }>;
}) {
  const { locale, joinCode } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);

  const profile = await getLoyaltyProfileByJoinCode(joinCode);
  if (!profile) {
    const ar = locale === "ar";

    return (
      <PublicPage>
        <div className="py-4 sm:py-8">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-(--surface-border) bg-(--surface) p-5 sm:p-6">
            <h1 className="text-xl font-semibold">{ar ? "الرابط غير صحيح" : "Invalid business link"}</h1>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {ar
                ? "كود البزنس غير موجود أو الرابط منتهي. تأكد من الكود ثم جرّب مرة ثانية."
                : "Business code is missing or expired. Please check the code and try again."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href={`/${locale}/loyalty/staff`} className={buttonVariants({ variant: "primary", size: "sm" })}>
                {ar ? "إدخال كود جديد" : "Enter another code"}
              </Link>
              <Link href={`/${locale}/loyalty`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                {ar ? "صفحة الولاء" : "Loyalty page"}
              </Link>
            </div>
          </div>
        </div>
      </PublicPage>
    );
  }

  const session = await getCurrentLoyaltyStaffSession();

  let initialStaff: { id: string; fullName: string; avatarUrl?: string; phone: string } | null = null;

  if (session && session.joinCode === joinCode && session.ownerUserId === profile.userId) {
    const staff = await getLoyaltyStaffById(session.staffId);
    if (staff && staff.isActive && staff.userId === profile.userId) {
      initialStaff = {
        id: staff.id,
        fullName: staff.fullName,
        avatarUrl: staff.avatarUrl,
        phone: staff.phone,
      };
    }
  }

  return (
    <PublicPage>
      <div className="py-4 sm:py-8">
        <StaffWorkspaceClient
          locale={locale as Locale}
          joinCode={joinCode}
          businessName={profile.businessName}
          businessLogoUrl={profile.logoUrl}
          initialStaff={initialStaff}
        />
      </div>
    </PublicPage>
  );
}
