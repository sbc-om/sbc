import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/Container";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

export function Footer({ locale, dict }: FooterProps) {

  const brand = locale === "ar" ? "مركز الأعمال الذكية" : "Smart Business Center";

  const socials = [
    {
      key: "instagram",
      label: "Instagram",
      href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M17.5 6.5h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      key: "github",
      label: "GitHub",
      href: process.env.NEXT_PUBLIC_SOCIAL_GITHUB,
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M9 19c-4 1.5-4-2-5-2m10 4v-3.5c0-1 .1-1.5-.5-2 2-.2 4-.8 4-4.5 0-1-.3-2-1-2.8.1-.3.4-1.3-.1-2.7 0 0-.8-.2-2.8 1a9.6 9.6 0 0 0-5 0c-2-1.2-2.8-1-2.8-1-.5 1.4-.2 2.4-.1 2.7-.7.8-1 1.8-1 2.8 0 3.7 2 4.3 4 4.5-.4.3-.5.8-.5 1.5V21"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ].filter((s) => typeof s.href === "string" && s.href.trim().length > 0);

  return (
    <footer className="mt-auto border-t" style={{ borderColor: "var(--surface-border)" }}>
      <div className="py-8">
        <Container>
          <div
            className="relative rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg py-8 px-6"
            style={{
              background: "rgba(var(--surface-rgb, 255, 255, 255), 0.9)",
              border: "1px solid",
              borderColor: "var(--surface-border)",
            }}
          >
            {/* Subtle gradient overlay */}
            <div
              className="absolute inset-0 -z-10 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(79, 70, 229, 0.03) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(79, 70, 229, 0.03) 100%)",
              }}
            />

            {/* Responsive layout: vertical on mobile, horizontal on desktop */}
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6 md:gap-4">
              {/* Left side: Logo + Brand */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}`}
                  className="transition-transform duration-300 hover:scale-105"
                >
                  <Image
                    src="/images/sbc.svg"
                    alt="SBC Logo"
                    width={48}
                    height={48}
                    className="h-12 w-12"
                    priority
                  />
                </Link>
                <Link
                  href={`/${locale}`}
                  className="font-bold text-lg bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                >
                  {brand}
                </Link>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-4 text-center">
                <nav className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-sm font-medium">
                  <Link
                    href={`/${locale}/businesses`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    {dict.nav.businesses}
                  </Link>
                  <span className="text-(--muted-foreground) opacity-40">•</span>
                  <Link
                    href={`/${locale}/about`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    {locale === "ar" ? "عن المشروع" : "About"}
                  </Link>
                  <span className="text-(--muted-foreground) opacity-40">•</span>
                  <Link
                    href={`/${locale}/contact`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    {locale === "ar" ? "تواصل معنا" : "Contact"}
                  </Link>
                </nav>
              </div>

              {/* Right side: Social Links */}
              {socials.length ? (
                <div className="flex items-center gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) text-(--muted-foreground) shadow-(--shadow) hover:text-foreground hover:scale-110 transition-all"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
