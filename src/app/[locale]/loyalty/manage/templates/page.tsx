import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/AppPage";
import { buttonVariants } from "@/components/ui/Button";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { getLoyaltyProfileByUserId } from "@/lib/db/loyalty";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";
import { listLoyaltyCardTemplates } from "@/lib/db/loyaltyTemplates";

import { TemplateListClient } from "./TemplateListClient";

export const runtime = "nodejs";

export default async function CardTemplatesPage({
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
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/loyalty/manage/templates`)}`);
  }

  const isActive = await isProgramSubscriptionActive(user.id);
  if (!isActive) {
    redirect(`/${locale}/loyalty/manage`);
  }

  const profile = await getLoyaltyProfileByUserId(user.id);
  const templates = await listLoyaltyCardTemplates(user.id);

  return (
    <AppPage>
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
              {ar ? "قوالب البطاقات" : "Card Templates"}
            </h1>
            <p className="mt-2 text-base text-(--muted-foreground)">
              {ar
                ? "قم بتصميم قوالب بطاقات الولاء التي سيحصل عليها عملاؤك في Apple Wallet و Google Wallet"
                : "Design loyalty card templates that your customers will receive in Apple Wallet and Google Wallet"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/${locale}/loyalty/manage`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {ar ? "العودة" : "Back"}
            </Link>
            <Link
              href={`/${locale}/loyalty/manage/templates/new`}
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              {ar ? "إنشاء قالب جديد" : "New Template"}
            </Link>
          </div>
        </div>
      </div>

      <TemplateListClient
        locale={locale as Locale}
        templates={templates}
        businessName={profile?.businessName ?? "Your Business"}
      />
    </AppPage>
  );
}
