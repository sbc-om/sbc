import Image from "next/image";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { getLoyaltyProfileByJoinCode } from "@/lib/db/loyalty";
import { isProgramSubscriptionActive } from "@/lib/db/subscriptions";

import { joinLoyaltyByCodeAction } from "./actions";

export const runtime = "nodejs";

export default async function LoyaltyJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale, code } = await params;
  if (!isLocale(locale)) notFound();

  await getDictionary(locale as Locale);
  const ar = locale === "ar";

  const profile = await getLoyaltyProfileByJoinCode(code);
  if (!profile) notFound();

  const sp = await searchParams;
  const error = sp.error;

  const active = await isProgramSubscriptionActive(profile.userId);

  return (
    <PublicPage>
      <div className="mx-auto w-full max-w-xl">
        <div className="sbc-card rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            {profile.logoUrl ? (
              <Image
                src={profile.logoUrl}
                alt={profile.businessName}
                width={80}
                height={80}
                className="h-20 w-20 rounded-3xl border border-(--surface-border) bg-(--surface) object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-(--surface-border) bg-(--surface)">
                <div className="h-8 w-8 rounded-xl bg-(--surface-border)" />
              </div>
            )}

            <div className="mt-4 text-sm text-(--muted-foreground)">{ar ? "النشاط" : "Business"}</div>
            <div className="mt-1 text-2xl font-semibold leading-tight tracking-tight">
              {profile.businessName}
            </div>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-(--surface-border) bg-(--surface) px-3 py-1 text-xs text-(--muted-foreground)">
              <span>{ar ? "الكود" : "Code"}</span>
              <span className="font-mono text-foreground">{profile.joinCode}</span>
            </div>

            <h1 className="mt-6 text-2xl font-semibold leading-tight tracking-tight">
              {ar ? "الانضمام إلى برنامج الولاء" : "Join loyalty program"}
            </h1>
            <p className="mt-2 text-base text-(--muted-foreground)">
              {ar
                ? "أدخل بياناتك للانضمام والحصول على نقاط الولاء."
                : "Enter your details to join and start earning loyalty points."}
            </p>
          </div>

          {!active ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-300">
              {ar ? "هذا البرنامج غير متاح حالياً." : "This loyalty program is not available right now."}
            </div>
          ) : (
            <form
              action={joinLoyaltyByCodeAction.bind(null, locale as Locale, profile.joinCode)}
              className="mt-6 grid gap-4"
            >
              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
                  {error === "PHONE_REQUIRED"
                    ? ar
                      ? "رقم الهاتف مطلوب."
                      : "Phone number is required."
                    : ar
                      ? "البيانات غير صالحة. حاول مرة أخرى."
                      : "Invalid input. Please try again."}
                </div>
              ) : null}

              <Input name="fullName" required placeholder={ar ? "الاسم الكامل" : "Full name"} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="phone" required placeholder={ar ? "الهاتف" : "Phone"} />
                <Input name="email" placeholder={ar ? "البريد (اختياري)" : "Email (optional)"} />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary">
                  {ar ? "انضم الآن" : "Join now"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PublicPage>
  );
}
