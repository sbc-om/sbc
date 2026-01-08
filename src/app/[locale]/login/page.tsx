import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/Container";
import { loginAction } from "@/app/[locale]/auth/actions";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";

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

  const { error, next } = await searchParams;

  return (
    <Container className="max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">{dict.nav.login}</h1>

      {error === "invalid" ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {locale === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid email or password."}
        </p>
      ) : null}

      <form action={loginAction} className="mt-6 grid gap-3">
        <input type="hidden" name="locale" value={locale} />
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {dict.auth.email}
          </span>
          <input
            className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-zinc-300 dark:border-white/15 dark:bg-black"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {dict.auth.password}
          </span>
          <input
            className="h-11 rounded-xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-zinc-300 dark:border-white/15 dark:bg-black"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </label>

        <button className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
          {dict.auth.signIn}
        </button>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          {locale === "ar" ? "ليس لديك حساب؟" : "No account?"}{" "}
          <Link
            href={`/${locale}/register`}
            className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-white"
          >
            {dict.nav.register}
          </Link>
        </p>
      </form>
    </Container>
  );
}
