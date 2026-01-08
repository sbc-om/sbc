import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { registerAction } from "@/app/[locale]/auth/actions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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

  const { error, next } = await searchParams;

  return (
    <Container className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.nav.register}</h1>

      {error === "taken" ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {locale === "ar" ? "هذا البريد مستخدم بالفعل" : "That email is already in use."}
        </p>
      ) : null}

      <form action={registerAction} className="mt-6 grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {dict.auth.email}
          </span>
          <Input name="email" type="email" required autoComplete="email" />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {dict.auth.password}
          </span>
          <Input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {locale === "ar" ? "8 أحرف على الأقل" : "At least 8 characters"}
          </span>
        </label>

        <Button type="submit" className="mt-2">
          {dict.auth.signUp}
        </Button>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          {locale === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-white"
          >
            {dict.nav.login}
          </Link>
        </p>
      </form>
    </Container>
  );
}
