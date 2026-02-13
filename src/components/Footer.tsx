import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";
import { Container } from "@/components/Container";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
  homepageOnlyInstagram?: boolean;
}

export function Footer({ locale, dict, homepageOnlyInstagram = true }: FooterProps) {

  const brand = locale === "ar" ? "مركز الأعمال الذكية" : "Smart Business Center";

  const socials = homepageOnlyInstagram
    ? [
      {
        key: "instagram",
        label: "Instagram",
        href: "https://www.instagram.com/sbc._.om/",
        icon: <FaInstagram className="h-4 w-4" />,
      },
    ]
    : [
    {
      key: "instagram",
      label: "Instagram",
      href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM,
      icon: <FaInstagram className="h-4 w-4" />,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
      icon: <FaFacebook className="h-4 w-4" />,
    },
    {
      key: "twitter",
      label: "Twitter",
      href: process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
      icon: <FaTwitter className="h-4 w-4" />,
    },
  ].filter((s) => typeof s.href === "string" && s.href.trim().length > 0);

  return (
    <footer className="mt-auto">
      <div className="py-5">
        <Container size="lg">
          <div
            className="relative rounded-2xl overflow-hidden backdrop-blur-xl py-5 px-5"
            style={{
              background: "rgba(var(--surface-rgb, 255, 255, 255), 0.9)",
              border: "1px solid",
              borderColor: "var(--surface-border)",
              boxShadow: "var(--shadow)",
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
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 md:gap-4">
              {/* Left side: Logo + Brand */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}`}
                  className="transition-transform duration-300 hover:scale-105"
                >
                  <Image
                    src="/images/sbc.svg"
                    alt="SBC Logo"
                    width={40}
                    height={40}
                    className="h-10 w-10"
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
                    href={`/${locale}/loyalty`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    {locale === "ar" ? "بطاقة الولاء" : "Loyalty"}
                  </Link>
                  <span className="text-(--muted-foreground) opacity-40">•</span>
                  <Link
                    href={`/${locale}/marketing-platform`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    {locale === "ar" ? "منصة التسويق" : "Marketing"}
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) text-(--muted-foreground) shadow-(--shadow) hover:text-foreground hover:scale-110 transition-all"
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
