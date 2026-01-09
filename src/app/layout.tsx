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

  // Critical inline script - MUST run before any CSS/rendering to prevent flash
  const themeInit = `(function(){try{var s=localStorage.getItem('theme');var d=s==='dark'||(s!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark')}r.style.colorScheme=d?'dark':'light';window.addEventListener('load',function(){r.classList.add('loaded')},false)}catch(e){}})();`;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* CRITICAL: This script MUST be first to prevent theme flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoKufiArabic.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
