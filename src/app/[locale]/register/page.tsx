import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { registerAction } from "@/app/[locale]/auth/actions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createHumanChallenge } from "@/lib/auth/humanChallenge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HumanChallenge } from "@/components/auth/HumanChallenge";

export const runtime = "nodejs";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale as Locale);
  const challenge = createHumanChallenge(locale as Locale);

  const { error, next } = await searchParams;

  return (
    <PublicPage>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">{dict.nav.register}</h1>

      {error === "taken" ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {locale === "ar" ? "هذا البريد مستخدم بالفعل" : "That email is already in use."}
        </p>
      ) : null}

      {error === "phone" ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {locale === "ar" ? "رقم الهاتف مستخدم بالفعل" : "That phone number is already in use."}
        </p>
      ) : null}

      {error === "human" ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {locale === "ar"
            ? "يرجى إكمال التحقق البشري بشكل صحيح."
            : "Please complete the human check correctly."}
        </p>
      ) : null}

      {error === "approval" ? (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
          {locale === "ar"
            ? "تم إنشاء الحساب وهو قيد المراجعة من الإدارة."
            : "Your account has been created and is pending admin approval."}
        </p>
      ) : null}

      <form action={registerAction} className="mt-6 grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {dict.auth.fullName}
          </span>
          <Input name="fullName" type="text" required autoComplete="name" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {dict.auth.phone}
          </span>
          <Input name="phone" type="tel" required autoComplete="tel" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {dict.auth.email}
          </span>
          <Input name="email" type="email" required autoComplete="email" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {dict.auth.password}
          </span>
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <span className="text-xs text-(--muted-foreground)">
            {locale === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}
          </span>
        </label>

        <HumanChallenge locale={locale} challenge={challenge} />

        <Button type="submit" className="mt-2">
          {dict.auth.signUp}
        </Button>

        <p className="mt-2 text-sm text-(--muted-foreground)">
          {locale === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {dict.nav.login}
          </Link>
        </p>
      </form>
      </div>
    </PublicPage>
  );
}
