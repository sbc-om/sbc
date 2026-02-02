import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createHumanChallenge } from "@/lib/auth/humanChallenge";
import { RegisterForm } from "@/components/auth/RegisterForm";

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

  const { next } = await searchParams;

  return (
    <PublicPage>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">{dict.nav.register}</h1>

        <RegisterForm
          locale={locale as Locale}
          dict={{
            auth: {
              fullName: dict.auth.fullName,
              phone: dict.auth.phone,
              email: dict.auth.email,
              password: dict.auth.password,
              signUp: dict.auth.signUp,
            },
            nav: {
              login: dict.nav.login,
            },
          }}
          next={next}
          challengeQuestion={challenge.question}
          challengeAnswer={challenge.answer}
        />
      </div>
    </PublicPage>
  );
}
