import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { loginAction } from "@/app/[locale]/auth/actions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createHumanChallenge } from "@/lib/auth/humanChallenge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HumanChallenge } from "@/components/auth/HumanChallenge";

export const runtime = "nodejs";

export default async function LoginPage({
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
        <h1 className="text-2xl font-semibold tracking-tight">{dict.nav.login}</h1>

      {error === "invalid" ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {locale === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid email or password."}
        </p>
      ) : null}

      {error === "human" ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {locale === "ar"
            ? "يرجى إكمال التحقق البشري بشكل صحيح."
            : "Please complete the human check correctly."}
        </p>
      ) : null}

      <form action={loginAction} className="mt-6 grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {dict.auth.identifier}
          </span>
          <Input
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder={
              locale === "ar" ? "البريد الإلكتروني أو الهاتف" : "Email or mobile"
            }
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-(--muted-foreground)">
            {dict.auth.password}
          </span>
          <Input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>

        <HumanChallenge locale={locale} challenge={challenge} />

        <Button type="submit" className="mt-2">
          {dict.auth.signIn}
        </Button>

        <p className="mt-2 text-sm text-(--muted-foreground)">
          {locale === "ar" ? "ليس لديك حساب؟" : "No account?"}{" "}
          <Link
            href={`/${locale}/register`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {dict.nav.register}
          </Link>
        </p>
      </form>
      </div>
    </PublicPage>
  );
}
