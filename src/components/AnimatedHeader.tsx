"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HiX, HiMenu } from "react-icons/hi";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
  AnimatePresence,
} from "motion/react";
import { Container } from "@/components/Container";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { logoutAction } from "@/app/[locale]/auth/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonVariants } from "@/components/ui/Button";
import { usePrefersReducedMotion } from "@/lib/hooks/usePerformance";

const springConfig = { stiffness: 260, damping: 30, mass: 0.8 };

interface AnimatedHeaderProps {
  locale: Locale;
  dict: Dictionary;
  user?: { username: string; role: string } | null;
}

export function AnimatedHeader({ locale, dict, user }: AnimatedHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopNavHovered, setDesktopNavHovered] = useState(false);
  const mobileMenuRootRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const pathname = usePathname();
  const servicesLabel = locale === "ar" ? "الخدمات" : "Services";
  const topNavStableClass = "hover:translate-y-0 active:scale-100";
  const topNavBlueHoverClass = "hover:bg-accent hover:text-white hover:border-accent";
  const topNavNoShadowClass = "!shadow-none hover:!shadow-none";

  /* ── scroll-linked motion values ── */
  const { scrollY } = useScroll();

  // Raw transforms driven by scroll position (0–150px)
  const rawOuterPy = useTransform(scrollY, [0, 150], [12, 8]);
  const rawCardPy = useTransform(scrollY, [0, 150], [12, 8]);
  const rawCardPx = useTransform(scrollY, [0, 150], [24, 16]);
  const rawCardHorizontalTrim = useTransform(scrollY, [0, 150], [0, 28]);
  const rawLogoSize = useTransform(scrollY, [0, 150], [40, 30]);
  const rawFontSize = useTransform(scrollY, [0, 150], [18, 15]);
  const rawLogoRadius = useTransform(scrollY, [0, 150], [10, 8]);
  const rawGap = useTransform(scrollY, [0, 150], [10, 6]);
  const rawGradientOpacity = useTransform(scrollY, [0, 150], [1, 0]);

  // Smoothed with spring physics for buttery feel
  const outerPy = useSpring(rawOuterPy, springConfig);
  const cardPy = useSpring(rawCardPy, springConfig);
  const cardPx = useSpring(rawCardPx, springConfig);
  const cardHorizontalTrim = useSpring(rawCardHorizontalTrim, springConfig);
  const logoSize = useSpring(rawLogoSize, springConfig);
  const fontSize = useSpring(rawFontSize, springConfig);
  const logoRadius = useSpring(rawLogoRadius, springConfig);
  const logoGap = useSpring(rawGap, springConfig);
  const gradientOpacity = useSpring(rawGradientOpacity, springConfig);
  const cardWidth = useMotionTemplate`calc(100% - ${cardHorizontalTrim}px)`;

  // Close mobile menu on navigation
  useEffect(() => {
    queueMicrotask(() => {
      setMobileOpen(false);
    });
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
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] md:hidden"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        ) : null}
      </AnimatePresence>
      <motion.div
        className="w-full"
        style={{
          paddingTop: outerPy,
          paddingBottom: outerPy,
        }}
      >
        <Container size="lg">
          <motion.div
            ref={mobileMenuRootRef}
            className="sbc-instagram-ring relative rounded-2xl overflow-visible backdrop-blur-md"
            onMouseEnter={() => setDesktopNavHovered(true)}
            onMouseLeave={() => setDesktopNavHovered(false)}
            style={{
              width: prefersReducedMotion ? "100%" : cardWidth,
              marginInline: "auto",
              paddingTop: cardPy,
              paddingBottom: cardPy,
              paddingInlineStart: cardPx,
              paddingInlineEnd: cardPx,
              background:
                "linear-gradient(165deg, rgba(var(--surface-rgb, 255, 255, 255), 0.94), rgba(var(--surface-rgb, 255, 255, 255), 0.84))",
              boxShadow: "none",
            }}
          >
            {/* Subtle gradient overlay */}
            <motion.div
              className="absolute inset-0 -z-10 rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0, 121, 244, 0.12) 0%, rgba(6, 182, 212, 0.14) 52%, rgba(0, 121, 244, 0.1) 100%)",
                opacity: gradientOpacity,
              }}
            />

            <div className="flex items-center justify-between gap-4 md:gap-6">
              {/* Logo Section with SVG */}
              <Link
                href={`/${locale}`}
                className="flex items-center min-w-0"
              >
                <motion.div
                  className="relative shrink-0 overflow-hidden"
                  style={{
                    width: logoSize,
                    height: logoSize,
                    borderRadius: logoRadius,
                    marginInlineEnd: logoGap,
                  }}
                >
                  <Image
                    src="/images/sbc.svg"
                    alt="SBC Logo"
                    width={40}
                    height={40}
                    className="select-none"
                    style={{ width: "100%", height: "100%", display: "block" }}
                    priority
                  />
                </motion.div>
                <motion.span
                  className={`block whitespace-nowrap py-0.5 font-bold leading-none tracking-tight transition-colors duration-200 ${
                    desktopNavHovered ? "text-white" : "text-accent"
                  }`}
                  style={{ fontSize, transformOrigin: "left center" }}
                >
                  SBC
                </motion.span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  href={`/${locale}/services`}
                  className={buttonVariants({
                    variant: "primary",
                    size: "sm",
                    className: `${topNavStableClass} ${topNavNoShadowClass} hover:brightness-[1.02]`,
                  })}
                >
                  {servicesLabel}
                </Link>

                {user ? (
                  <a
                    href={`/${locale}/explorer`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                      className: `${topNavStableClass} ${topNavBlueHoverClass} ${topNavNoShadowClass}`,
                    })}
                  >
                    {dict.nav.businesses}
                  </a>
                ) : (
                  <Link
                    href={`/${locale}/businesses`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                      className: `${topNavStableClass} ${topNavBlueHoverClass} ${topNavNoShadowClass}`,
                    })}
                  >
                    {dict.nav.businesses}
                  </Link>
                )}

                {user ? (
                  <a
                    href={`/${locale}/dashboard`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: `${topNavStableClass} ${topNavNoShadowClass} hover:bg-accent hover:text-white`,
                    })}
                  >
                    {dict.nav.dashboard}
                  </a>
                ) : (
                  <Link
                    href={`/${locale}/login`}
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                      className: `${topNavStableClass} ${topNavBlueHoverClass} ${topNavNoShadowClass}`,
                    })}
                  >
                    {dict.nav.login}
                  </Link>
                )}

                {user?.role === "admin" ? (
                  <a
                    href={`/${locale}/admin`}
                    className={buttonVariants({
                      variant: "ghost",
                      size: "sm",
                      className: `${topNavStableClass} ${topNavNoShadowClass} hover:bg-accent hover:text-white`,
                    })}
                  >
                    {dict.nav.admin}
                  </a>
                ) : null}

                {user ? (
                  <form action={logoutAction.bind(null, locale)} onSubmit={() => localStorage.removeItem("wa-login-state")}>
                    <button
                      type="submit"
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        className: `${topNavStableClass} ${topNavNoShadowClass} hover:bg-accent hover:text-white`,
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
                  <ThemeToggle locale={locale} className={topNavNoShadowClass} />
                  <LanguageSwitcher locale={locale} className={topNavNoShadowClass} />
                </div>
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center gap-2">
                <ThemeToggle locale={locale} className={topNavNoShadowClass} />
                <button
                  type="button"
                  className={buttonVariants({ variant: "secondary", size: "icon", className: `rounded-xl ${topNavNoShadowClass}` })}
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
            <AnimatePresence>
              {mobileOpen ? (
                <motion.div
                  id="mobile-nav"
                  className="md:hidden absolute inset-x-0 top-full mt-2 rounded-2xl backdrop-blur-md overflow-hidden"
                  style={{
                    background: "rgba(var(--surface-rgb, 255, 255, 255), 0.96)",
                    boxShadow: "none",
                  }}
                  role="dialog"
                  aria-label={locale === "ar" ? "قائمة التنقل" : "Navigation"}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                >
                  <div className="p-2">
                    <div className="grid gap-1">
                      <Link
                        href={`/${locale}/services`}
                        onClick={() => setMobileOpen(false)}
                        className={buttonVariants({
                          variant: "primary",
                          size: "md",
                          className: `w-full justify-start rounded-xl ${topNavNoShadowClass}`,
                        })}
                      >
                        {servicesLabel}
                      </Link>

                      {user ? (
                        <a
                          href={`/${locale}/explorer`}
                          onClick={() => setMobileOpen(false)}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "md",
                            className: `w-full justify-start rounded-xl ${topNavNoShadowClass}`,
                          })}
                        >
                          {dict.nav.businesses}
                        </a>
                      ) : (
                        <Link
                          href={`/${locale}/businesses`}
                          onClick={() => setMobileOpen(false)}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "md",
                            className: `w-full justify-start rounded-xl ${topNavNoShadowClass}`,
                          })}
                        >
                          {dict.nav.businesses}
                        </Link>
                      )}

                      {user ? (
                        <a
                          href={`/${locale}/dashboard`}
                          onClick={() => setMobileOpen(false)}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "md",
                            className: `w-full justify-start rounded-xl ${topNavNoShadowClass}`,
                          })}
                        >
                          {dict.nav.dashboard}
                        </a>
                      ) : (
                        <Link
                          href={`/${locale}/login`}
                          onClick={() => setMobileOpen(false)}
                          className={buttonVariants({
                            variant: "secondary",
                            size: "md",
                            className: `w-full justify-start rounded-xl ${topNavNoShadowClass}`,
                          })}
                        >
                          {dict.nav.login}
                        </Link>
                      )}

                      {user?.role === "admin" ? (
                        <a
                          href={`/${locale}/admin`}
                          onClick={() => setMobileOpen(false)}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "md",
                            className: `w-full justify-start rounded-xl ${topNavNoShadowClass}`,
                          })}
                        >
                          {dict.nav.admin}
                        </a>
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
                              className: `w-full justify-start rounded-xl ${topNavNoShadowClass}`,
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
                      <LanguageSwitcher locale={locale} className={topNavNoShadowClass} />
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </Container>
      </motion.div>
    </header>
  );
}
