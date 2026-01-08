import Link from "next/link";
import { Container } from "@/components/Container";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { logoutAction } from "@/app/[locale]/auth/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

export async function Header({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const user = await getCurrentUser();

  return (
    <header className="border-b backdrop-blur bg-(--surface) border-(--surface-border)">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href={`/${locale}`}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {dict.appName}
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href={`/${locale}/businesses`}
            className="text-sm font-medium text-(--muted-foreground) hover:text-foreground"
          >
            {dict.nav.businesses}
          </Link>

          {user ? (
            <Link
              href={`/${locale}/dashboard`}
              className="text-sm font-medium text-(--muted-foreground) hover:text-foreground"
            >
              {dict.nav.dashboard}
            </Link>
          ) : (
            <>
              <Link
                href={`/${locale}/login`}
                className="text-sm font-medium text-(--muted-foreground) hover:text-foreground"
              >
                {dict.nav.login}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="text-sm font-medium text-(--muted-foreground) hover:text-foreground"
              >
                {dict.nav.register}
              </Link>
            </>
          )}

          {user?.role === "admin" ? (
            <Link
              href={`/${locale}/admin`}
              className="text-sm font-medium text-(--muted-foreground) hover:text-foreground"
            >
              {dict.nav.admin}
            </Link>
          ) : null}

          {user ? (
            <form action={logoutAction.bind(null, locale)}>
              <button
                type="submit"
                className="text-sm font-medium text-(--muted-foreground) hover:text-foreground"
              >
                {dict.nav.logout}
              </button>
            </form>
          ) : null}

          <ThemeToggle locale={locale} />
          <LanguageSwitcher locale={locale} />
        </nav>
      </Container>
    </header>
  );
}
