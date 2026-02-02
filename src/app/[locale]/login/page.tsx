import { notFound } from "next/navigation";

import { PublicPage } from "@/components/PublicPage";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { isLocale, type Locale } from "@/lib/i18n/locales";
import { createHumanChallenge } from "@/lib/auth/humanChallenge";
import { LoginTabs } from "@/components/auth/LoginTabs";

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
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">{dict.nav.login}</h1>

        <LoginTabs
          locale={locale as Locale}
          challenge={challenge}
          next={next}
          error={error}
          dict={{
            nav: { login: dict.nav.login, register: dict.nav.register },
            auth: {
              identifier: dict.auth.identifier,
              password: dict.auth.password,
              signIn: dict.auth.signIn,
            },
          }}
        />
      </div>
    </PublicPage>
  );
}
