"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HiX, HiMenu } from "react-icons/hi";
import { Container } from "@/components/Container";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { logoutAction } from "@/app/[locale]/auth/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonVariants } from "@/components/ui/Button";

interface AnimatedHeaderProps {
  locale: Locale;
  dict: Dictionary;
  user?: { username: string; role: string } | null;
}

export function AnimatedHeader({ locale, dict, user }: AnimatedHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRootRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = 150; // Max scroll distance for full effect
      const progress = Math.min(scrollPosition / maxScroll, 1);
      
      setScrollProgress(progress);
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    // Defer to a microtask to satisfy react-hooks/set-state-in-effect.
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  // Close on Escape, and close when clicking outside.
  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      const root = mobileMenuRootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setMobileOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [mobileOpen]);

  // Prevent background scroll when mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 w-full">
      {mobileOpen ? (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] md:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <div
        className={`w-full transition-all duration-500 ease-out ${
          scrolled ? "py-2" : "py-3"
        }`}
      >
        <Container size="lg">
          <div
            ref={mobileMenuRootRef}
            className={`relative rounded-2xl overflow-visible backdrop-blur-xl shadow-lg border ${
              scrolled ? "py-2 px-4" : "py-3 px-6"
            }`}
            style={{
              background: "rgba(var(--surface-rgb, 255, 255, 255), 0.9)",
              borderColor: "var(--surface-border)",
              transform: `translateY(${-scrollProgress * 2}px) scale(${1 - scrollProgress * 0.1})`,
              transformOrigin: "center top",
              willChange: "transform",
              transition: "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* Subtle gradient overlay */}
            <div
              className="absolute inset-0 -z-10 rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(6, 182, 212, 0.08) 50%, rgba(79, 70, 229, 0.05) 100%)",
                opacity: 1 - scrollProgress,
                transition: "opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />

            <div className="flex items-center justify-between gap-4 md:gap-6">
              {/* Logo Section with SVG */}
              <Link
                href={`/${locale}`}
                className="flex items-center gap-2 group"
                style={{
                  transition: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <div
                  style={{
                    width: `${44 - scrollProgress * 12}px`,
                    height: `${44 - scrollProgress * 12}px`,
                    transition: "all 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <Image
                    src="/images/sbc.svg"
                    alt="SBC Logo"
                    width={44}
                    height={44}
                    className="transition-transform duration-300 group-hover:scale-110"
                    style={{ width: "100%", height: "100%" }}
                    priority
                  />
                </div>
                <span
                  className="font-bold tracking-tight bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent"
                  style={{
                    fontSize: `${18 - scrollProgress * 2}px`,
                    transition: "font-size 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  SBC
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  href={`/${locale}/businesses`}
                  className={buttonVariants({
                    variant: "secondary",
                    size: "sm",
                  })}
                >
                  {dict.nav.businesses}
                </Link>

                <Link
                  href={`/${locale}/map`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  {locale === "ar" ? "الخريطة" : "Map"}
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
                  <Link
                    href={`/${locale}/login`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                    })}
                  >
                    {dict.nav.login}
                  </Link>
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
                  <form action={logoutAction.bind(null, locale)} onSubmit={() => localStorage.removeItem("wa-login-state")}>
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

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center gap-2">
                <ThemeToggle locale={locale} />
                <button
                  type="button"
                  className={buttonVariants({ variant: "secondary", size: "icon", className: "rounded-xl" })}
                  aria-label={locale === "ar" ? "القائمة" : "Menu"}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav"
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  {mobileOpen ? <HiX className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Mobile dropdown */}
            <div
              id="mobile-nav"
              className={
                "md:hidden absolute inset-x-0 top-full mt-2 origin-top rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden transition-all duration-200 ease-out " +
                (mobileOpen
                  ? "opacity-100 translate-y-0 scale-100"
                  : "pointer-events-none opacity-0 -translate-y-1 scale-[0.98]")
              }
              style={{
                background: "rgba(var(--surface-rgb, 255, 255, 255), 0.96)",
                borderColor: "var(--surface-border)",
              }}
              role="dialog"
              aria-label={locale === "ar" ? "قائمة التنقل" : "Navigation"}
            >
              <div className="p-2">
                <div className="grid gap-1">
                  <Link
                    href={`/${locale}/businesses`}
                    onClick={() => setMobileOpen(false)}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "md",
                      className: "w-full justify-start rounded-xl",
                    })}
                  >
                    {dict.nav.businesses}
                  </Link>

                  <Link
                    href={`/${locale}/map`}
                    onClick={() => setMobileOpen(false)}
                    className={buttonVariants({ variant: "ghost", size: "md", className: "w-full justify-start rounded-xl" })}
                  >
                    {locale === "ar" ? "الخريطة" : "Map"}
                  </Link>

                  {user ? (
                    <Link
                      href={`/${locale}/dashboard`}
                      onClick={() => setMobileOpen(false)}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "md",
                        className: "w-full justify-start rounded-xl",
                      })}
                    >
                      {dict.nav.dashboard}
                    </Link>
                  ) : (
                    <Link
                      href={`/${locale}/login`}
                      onClick={() => setMobileOpen(false)}
                      className={buttonVariants({
                        variant: "secondary",
                        size: "md",
                        className: "w-full justify-start rounded-xl",
                      })}
                    >
                      {dict.nav.login}
                    </Link>
                  )}

                  {user?.role === "admin" ? (
                    <Link
                      href={`/${locale}/admin`}
                      onClick={() => setMobileOpen(false)}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "md",
                        className: "w-full justify-start rounded-xl",
                      })}
                    >
                      {dict.nav.admin}
                    </Link>
                  ) : null}

                  {user ? (
                    <form
                      action={logoutAction.bind(null, locale)}
                      onSubmit={() => { setMobileOpen(false); localStorage.removeItem("wa-login-state"); }}
                    >
                      <button
                        type="submit"
                        className={buttonVariants({
                          variant: "ghost",
                          size: "md",
                          className: "w-full justify-start rounded-xl",
                        })}
                      >
                        {dict.nav.logout}
                      </button>
                    </form>
                  ) : null}
                </div>

                <div
                  className="mt-2 pt-2 flex items-center justify-between gap-2"
                  style={{
                    borderTop: "1px solid",
                    borderColor: "rgba(var(--foreground-rgb, 0, 0, 0), 0.1)",
                  }}
                >
                  <span className="text-xs text-(--muted-foreground)">
                    {locale === "ar" ? "الإعدادات" : "Settings"}
                  </span>
                  <LanguageSwitcher locale={locale} />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
}
