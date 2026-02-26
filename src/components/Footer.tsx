import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa";
import { FiInfo, FiMail } from "react-icons/fi";
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
  const instagramUrl = "https://www.instagram.com/sbc._.om";

  const socials = homepageOnlyInstagram
    ? [
      {
        key: "instagram",
        label: "Instagram",
        href: instagramUrl,
        icon: <FaInstagram className="h-4 w-4" />,
        external: true,
      },
    ]
    : [
    {
      key: "instagram",
      label: "Instagram",
      href: instagramUrl,
      icon: <FaInstagram className="h-4 w-4" />,
      external: true,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
      icon: <FaFacebook className="h-4 w-4" />,
      external: true,
    },
    {
      key: "twitter",
      label: "Twitter",
      href: process.env.NEXT_PUBLIC_SOCIAL_TWITTER,
      icon: <FaTwitter className="h-4 w-4" />,
      external: true,
    },
  ].filter((s) => typeof s.href === "string" && s.href.trim().length > 0);

  const footerActionIcons = [
    ...socials.map((s) => ({ ...s, href: s.href as string })),
    {
      key: "about",
      label: locale === "ar" ? "عن المشروع" : "About",
      href: `/${locale}/about`,
      icon: <FiInfo className="h-4 w-4" />,
      external: false,
    },
    {
      key: "contact",
      label: locale === "ar" ? "تواصل معنا" : "Contact",
      href: `/${locale}/contact`,
      icon: <FiMail className="h-4 w-4" />,
      external: false,
    },
  ];

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
                    href={`/${locale}/loyalty`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    {locale === "ar" ? "بطاقة الولاء" : "Loyalty"}
                  </Link>
                  <span className="text-(--muted-foreground) opacity-40">•</span>
                  <Link
                    href={`/${locale}/services`}
                    className="text-foreground hover:text-accent transition-colors"
                  >
                    {locale === "ar" ? "خدمات SBC" : "Services"}
                  </Link>
                </nav>
              </div>

              {/* Right side: Social Links */}
              {footerActionIcons.length ? (
                <div className="flex items-center gap-3">
                  {footerActionIcons.map((s) => (
                    s.external ? (
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
                    ) : (
                      <Link
                        key={s.key}
                        href={s.href}
                        aria-label={s.label}
                        title={s.label}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--surface-border) bg-(--surface) text-(--muted-foreground) shadow-(--shadow) hover:text-foreground hover:scale-110 transition-all"
                      >
                        {s.icon}
                      </Link>
                    )
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
