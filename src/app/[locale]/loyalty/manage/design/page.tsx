import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import { getDefaultLoyaltyCardTemplate } from "@/lib/db/loyaltyTemplates";
import { LoyaltyCardStudio } from "@/components/loyalty/LoyaltyCardStudio";

export const runtime = "nodejs";

export default async function LoyaltyCardDesignPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const ar = locale === "ar";
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      `/${locale}/login?next=${encodeURIComponent(`/${locale}/loyalty/manage/design`)}`
    );
  }

  const isActive = await isProgramSubscriptionActive(user.id);
  if (!isActive) {
    redirect(`/${locale}/loyalty/manage`);
  }

  const [profile, template] = await Promise.all([
    getLoyaltyProfileByUserId(user.id),
    getDefaultLoyaltyCardTemplate(user.id),
  ]);

  return (
    <AppPage>
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-(--surface-border) bg-(--surface) p-7 sm:p-8">
        <div
          className="absolute inset-0 -z-10 opacity-80"
          style={{
            background:
              "radial-gradient(900px circle at 20% 0%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(900px circle at 85% 10%, rgba(14,165,233,0.16), transparent 55%)",
          }}
        />

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              {ar ? "تصميم بطاقة الولاء" : "Loyalty Card Design"}
            </h1>
            <p className="mt-2 text-base text-(--muted-foreground)">
              {ar
                ? "صمم بطاقة ولاء احترافية لعملائك تعمل على Apple Wallet و Google Wallet"
                : "Design a professional loyalty card for your customers that works on Apple Wallet & Google Wallet"}
            </p>
          </div>
          <Link
            href={`/${locale}/loyalty/manage`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {ar ? "العودة" : "Back"}
          </Link>
        </div>
      </div>

      {/* Designer */}
      <div className="mt-8">
        <LoyaltyCardStudio
          locale={locale as Locale}
          profile={profile}
          template={template}
        />
      </div>
    </AppPage>
  );
}
