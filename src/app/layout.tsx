import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { cookies, headers } from "next/headers";
import localFont from "next/font/local";
import "overlayscrollbars/overlayscrollbars.css";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { defaultLocale, isLocale, localeDir } from "@/lib/i18n/locales";
import { OverlayScrollbarsInit } from "@/components/OverlayScrollbarsInit";
import { LoyaltyPushSwInit } from "@/components/loyalty/LoyaltyPushSwInit";
import { ToastProvider } from "@/components/ui/Toast";
import { PWASplashScreen } from "@/components/PWASplashScreen";

const sbcSans = localFont({
  src: [{ path: "../../public/fonts/sbc.otf", style: "normal" }],
  variable: "--font-sbc-sans",
  display: "swap",
  preload: true,
  fallback: ["Segoe UI", "Tahoma", "Arial", "sans-serif"],
});

const sbcMono = localFont({
  src: [{ path: "../../public/fonts/sbc.otf", style: "normal" }],
  variable: "--font-sbc-mono",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Smart Business Center",
    template: "%s | Smart Business Center",
  },
  description: "A bilingual business platform for discovery, growth, marketing services, and loyalty.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Smart Business Center",
    title: "Smart Business Center",
    description: "A bilingual business platform for discovery, growth, marketing services, and loyalty.",
    images: [
      {
        url: "/images/sbc.svg",
        alt: "Smart Business Center",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Business Center",
    description: "A bilingual business platform for discovery, growth, marketing services, and loyalty.",
    images: ["/images/sbc.svg"],
  },
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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SBC',
  },
};

export const viewport = {
  themeColor: '#0877FB',
};

async function getRequestLocale() {
  const h = await headers();
  const raw = h.get("x-locale") ?? defaultLocale;
  return isLocale(raw) ? raw : defaultLocale;
}

async function getRequestTheme() {
  const c = await cookies();
  const raw = c.get("theme")?.value;
  if (raw === "dark" || raw === "light" || raw === "system") return raw;
  return "light" as const;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const theme = await getRequestTheme();
  const initialIsDark = theme === "dark";
  const dir = localeDir(locale);

  // Critical inline script - MUST run before any CSS/rendering to prevent flash
  const themeInit = `(function(){try{var p=window.performance;var wrapPerfFn=function(name){try{if(!p||typeof p[name]!=='function'||p['__sbcWrapped_'+name])return;var orig=p[name].bind(p);p[name]=function(){try{return orig.apply(p,arguments)}catch(err){var msg=String(err&&err.message||'');if(err instanceof TypeError&&/negative time stamp/i.test(msg)){return}throw err}};p['__sbcWrapped_'+name]=true}catch(_){}};wrapPerfFn('mark');wrapPerfFn('measure');var r=document.documentElement;try{r.dataset.osPending='true';var st=document.createElement('style');st.id='os-pending-style';st.textContent='html[data-os-pending="true"],html[data-os-pending="true"] body{-ms-overflow-style:none;scrollbar-width:none;}html[data-os-pending="true"]::-webkit-scrollbar,html[data-os-pending="true"] body::-webkit-scrollbar{width:0;height:0;}';(document.head||document.documentElement).appendChild(st)}catch(e0){}var s=localStorage.getItem('theme');var d=s==='dark'||(s==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';r.style.backgroundColor=d?'#121212':'#ffffff';r.style.color=d?'#e8eaed':'#0f172a';try{var isDesktop=matchMedia('(min-width:1024px)').matches;var sc=localStorage.getItem('sidebarCollapsed');var collapsed=sc==='true';r.dataset.sidebarCollapsed=collapsed?'true':'false';var w=isDesktop?(collapsed?'5rem':'16rem'):'0rem';r.style.setProperty('--sidebar-width',w)}catch(e2){}window.addEventListener('load',function(){r.classList.add('loaded')},false)}catch(e){}})();`;
  const pwaSplashInit = `(function(){try{var r=document.documentElement;var standalone=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;var shown=false;try{shown=sessionStorage.getItem('sbc-pwa-splash-shown')==='1'}catch(_){shown=false}if(!standalone||shown)return;r.dataset.pwaSplash='show';r.dataset.pwaSplashActive='true';var started=Date.now();var hidden=false;var hide=function(){if(hidden)return;hidden=true;var elapsed=Date.now()-started;var minVisible=1100;var finish=function(){r.dataset.pwaSplash='hide';delete r.dataset.pwaSplashActive;try{sessionStorage.setItem('sbc-pwa-splash-shown','1')}catch(_){}};if(elapsed<minVisible){setTimeout(finish,minVisible-elapsed)}else{finish()}};window.addEventListener('load',hide,{once:true});setTimeout(hide,3200)}catch(e){}})();`;
  const htmlStyle: CSSProperties = {
    colorScheme: initialIsDark ? "dark" : "light",
    backgroundColor: initialIsDark ? "#121212" : "#ffffff",
    color: initialIsDark ? "#e8eaed" : "#0f172a",
  };

  return (
    <html
      lang={locale}
      dir={dir}
      className={initialIsDark ? "dark" : undefined}
      style={htmlStyle}
      suppressHydrationWarning
    >
      <head>
        {/* CRITICAL: This script MUST be first to prevent theme flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script dangerouslySetInnerHTML={{ __html: pwaSplashInit }} />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${sbcSans.className} ${sbcSans.variable} ${sbcMono.variable} font-sbc antialiased`}
      >
        <PWASplashScreen locale={locale} />
        <div id="sbc-app-root">
          <OverlayScrollbarsInit />
          <LoyaltyPushSwInit />
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
