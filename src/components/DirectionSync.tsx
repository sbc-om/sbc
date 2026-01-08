"use client";

import { useEffect } from "react";

import { localeDir, type Locale } from "@/lib/i18n/locales";

export function DirectionSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    const dir = localeDir(locale);

    // RootLayout owns the <html> element and doesn't always re-render on locale navigation.
    // Sync here so RTL/LTR flips instantly when switching language client-side.
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    document.body.dir = dir;
  }, [locale]);

  return null;
}
