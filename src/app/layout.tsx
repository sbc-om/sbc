import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { defaultLocale, isLocale, localeDir } from "@/lib/i18n/locales";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoKufiArabic = Noto_Kufi_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Smart Business Center",
  description: "A clean bilingual (English/Arabic) business directory.",
};

async function getRequestLocale() {
  const h = await headers();
  const raw = h.get("x-locale") ?? defaultLocale;
  return isLocale(raw) ? raw : defaultLocale;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const dir = localeDir(locale);

  // Runs before React hydration to avoid theme flash.
  const themeInit = `(() => {
    try {
      const saved = localStorage.getItem('theme');
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = (saved === 'dark' || saved === 'light') ? saved : (systemDark ? 'dark' : 'light');
      const root = document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
      root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    } catch (e) {}
  })();`;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoKufiArabic.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
