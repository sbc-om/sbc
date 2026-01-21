"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n/locales";
import { buttonVariants } from "@/components/ui/Button";

function nextLocale(current: Locale): Locale {
  return current === "en" ? "ar" : "en";
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const rest = first && (locales as readonly string[]).includes(first)
    ? segments.slice(1)
    : segments;

  const target = nextLocale(locale);
  const href = `/${target}/${rest.join("/")}`.replace(/\/$/, "") || `/${target}`;

  return (
    <Link
      href={href}
      className={buttonVariants({ variant: "secondary", size: "sm", className: "h-9 rounded-xl" })}
    >
      {target === "ar" ? "العربية" : "English"}
    </Link>
  );
}
