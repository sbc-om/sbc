import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { defaultLocale, isLocale, localeDir } from "@/lib/i18n/locales";
import { OverlayScrollbarsInit } from "@/components/OverlayScrollbarsInit";

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
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#0877FB',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SBC',
  },
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
        <OverlayScrollbarsInit />
        {children}
      </body>
    </html>
  );
}
