"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { Container } from "@/components/Container";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { logoutAction } from "@/app/[locale]/auth/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonVariants } from "@/components/ui/Button";
import logoAnimation from "../../public/animation/logo.json";

interface AnimatedHeaderProps {
  locale: Locale;
  dict: Dictionary;
  user?: { username: string; role: string } | null;
}

export function AnimatedHeader({ locale, dict, user }: AnimatedHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className={`transition-all duration-700 ease-out ${
          scrolled ? "py-2" : "py-3"
        }`}
      >
        <Container>
          <div
            className={`relative rounded-2xl overflow-hidden transition-all duration-700 ease-out backdrop-blur-xl shadow-lg border ${
              scrolled ? "py-2 px-4" : "py-3 px-6"
            }`}
            style={{
              background: "rgba(var(--surface-rgb, 255, 255, 255), 0.9)",
              borderColor: "var(--surface-border)",
              transform: scrolled ? "scale(0.96)" : "scale(1)",
              transformOrigin: "center top",
            }}
          >
            {/* Subtle gradient overlay */}
            <div
              className={`absolute inset-0 -z-10 transition-opacity duration-700 ${
                scrolled ? "opacity-0" : "opacity-100"
              }`}
              style={{
                background:
                  "linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(79, 70, 229, 0.05) 100%)",
              }}
            />

            <div className="flex items-center justify-between gap-6">
              {/* Logo Section with Lottie */}
              <Link
                href={`/${locale}`}
                className="flex items-center gap-2 transition-all duration-700"
              >
                <div
                  className={`relative transition-all duration-700 ${
                    scrolled ? "w-7 h-7" : "w-9 h-9"
                  }`}
                  onMouseEnter={() => lottieRef.current?.play()}
                  onMouseLeave={() => lottieRef.current?.stop()}
                >
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={logoAnimation}
                    loop={true}
                    autoplay={false}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
                <span
                  className={`font-bold tracking-tight bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent transition-all duration-700 ${
                    scrolled ? "text-base" : "text-lg"
                  }`}
                >
                  {dict.appName}
                </span>
              </Link>

              {/* Navigation */}
              <nav className="flex items-center gap-2">
                <Link
                  href={`/${locale}/businesses`}
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  })}
                >
                  {dict.nav.businesses}
                </Link>

                {user ? (
                  <Link
                    href={`/${locale}/dashboard`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    })}
                  >
                    {dict.nav.dashboard}
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/login`}
                      className={buttonVariants({
                        variant: "secondary",
                        size: "sm",
                      })}
                    >
                      {dict.nav.login}
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      className={buttonVariants({
                        variant: "primary",
                        size: "sm",
                      })}
                    >
                      {dict.nav.register}
                    </Link>
                  </>
                )}

                {user?.role === "admin" ? (
                  <Link
                    href={`/${locale}/admin`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                    })}
                  >
                    {dict.nav.admin}
                  </Link>
                ) : null}

                {user ? (
                  <form action={logoutAction.bind(null, locale)}>
                    <button
                      type="submit"
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      {dict.nav.logout}
                    </button>
                  </form>
                ) : null}

                <div
                  className="flex items-center gap-1 ps-2 ms-1"
                  style={{ 
                    borderInlineStart: "1px solid",
                    borderColor: "rgba(var(--foreground-rgb, 0, 0, 0), 0.1)" 
                  }}
                >
                  <ThemeToggle locale={locale} />
                  <LanguageSwitcher locale={locale} />
                </div>
              </nav>
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
}
