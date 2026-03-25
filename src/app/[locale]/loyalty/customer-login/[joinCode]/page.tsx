import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { buttonVariants } from "@/components/ui/Button";
import { getLoyaltyProfileByJoinCode } from "@/lib/db/loyalty";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

import { CustomerCardLoginClient } from "../CustomerCardLoginClient";

export const runtime = "nodejs";

export default async function LoyaltyCustomerBusinessLoginPage({
  params,
}: {
  params: Promise<{ locale: string; joinCode: string }>;
}) {
  const { locale, joinCode } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const profile = await getLoyaltyProfileByJoinCode(joinCode);
  if (!profile) {
    return (
      <PublicPage>
        <div className="py-4 sm:py-8">
          <div className="mx-auto w-full max-w-md rounded-2xl bg-(--surface) p-5 sm:p-6">
            <h1 className="text-xl font-semibold">{ar ? "الرابط غير صحيح" : "Invalid business link"}</h1>
            <p className="mt-2 text-sm text-(--muted-foreground)">
              {ar
                ? "كود البزنس غير موجود أو الرابط غير صحيح."
                : "Business code is missing or the link is invalid."}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href={`/${locale}/loyalty/customer-login`} className={buttonVariants({ variant: "primary", size: "sm" })}>
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

  return (
    <PublicPage>
      <div className="py-4 sm:py-8">
        <CustomerCardLoginClient
          locale={locale as Locale}
          joinCode={joinCode}
          businessName={profile.businessName}
        />
      </div>
    </PublicPage>
  );
}
