"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n/locales";

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
      className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
    >
      {target === "ar" ? "العربية" : "English"}
    </Link>
  );
}
