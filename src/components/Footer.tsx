import Link from "next/link";
import { Container } from "@/components/Container";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

export function Footer({ locale, dict }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t" style={{ borderColor: "var(--surface-border)" }}>
      <div className="py-6">
        <Container>
          <div
            className="relative rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg py-5 px-6"
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

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}`}
                  className="font-bold text-xl bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                >
                  {dict.appName}
                </Link>
                <span className="text-sm font-medium text-foreground opacity-60">
                  © {currentYear}
                </span>
              </div>

              {/* Links */}
              <nav className="flex items-center gap-6 text-sm font-medium">
                <Link
                  href={`/${locale}/businesses`}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  {dict.nav.businesses}
                </Link>
                <Link
                  href={`/${locale}`}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  {locale === "ar" ? "عن المشروع" : "About"}
                </Link>
                <Link
                  href={`/${locale}`}
                  className="text-foreground hover:text-accent transition-colors"
                >
                  {locale === "ar" ? "تواصل معنا" : "Contact"}
                </Link>
              </nav>

              {/* Social or Additional Info */}
              <div className="text-sm font-medium text-foreground opacity-60">
                {locale === "ar" ? "صنع بـ ❤️" : "Made with ❤️"}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
