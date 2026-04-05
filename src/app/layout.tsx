import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { cookies, headers } from "next/headers";
import localFont from "next/font/local";
import "overlayscrollbars/overlayscrollbars.css";
import "./globals.css";
import { defaultLocale, isLocale, localeDir } from "@/lib/i18n/locales";
import { OverlayScrollbarsInit } from "@/components/OverlayScrollbarsInit";
import { LoyaltyPushSwInit } from "@/components/loyalty/LoyaltyPushSwInit";
import { CardGlowInit } from "@/components/CardGlowInit";
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
  return "dark" as const;
}

async function getRequestSidebarCollapsed() {
  const c = await cookies();
  const raw = c.get("sidebarCollapsed")?.value;
  return raw === "1" || raw === "true";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const theme = await getRequestTheme();
  const initialSidebarCollapsed = await getRequestSidebarCollapsed();
  const initialIsDark = theme === "dark";
  const dir = localeDir(locale);

  // Critical inline script - MUST run before any CSS/rendering to prevent flash
  const themeInit = `(function(){try{var p=window.performance;var wrapPerfFn=function(name){try{if(!p||typeof p[name]!=='function'||p['__sbcWrapped_'+name])return;var orig=p[name].bind(p);p[name]=function(){try{return orig.apply(p,arguments)}catch(err){var msg=String(err&&err.message||'');if(err instanceof TypeError&&/negative time stamp/i.test(msg)){return}throw err}};p['__sbcWrapped_'+name]=true}catch(_){}};wrapPerfFn('mark');wrapPerfFn('measure');var r=document.documentElement;try{r.dataset.osPending='true'}catch(e0){}var s=localStorage.getItem('theme');var d=s==='dark'||(s==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);r.classList.toggle('dark',d);if(r.dataset.pwaSplashActive!=='true'){r.style.colorScheme=d?'dark':'light';r.style.backgroundColor=d?'#121212':'#ffffff';r.style.color=d?'#e8eaed':'#0f172a'}try{var scRaw=null;try{scRaw=localStorage.getItem('sidebarCollapsed')}catch(e1){}var collapsed=scRaw==='true'||(scRaw===null&&r.dataset.sidebarCollapsed==='true');r.dataset.sidebarCollapsed=collapsed?'true':'false';if(scRaw===null){try{localStorage.setItem('sidebarCollapsed',collapsed?'true':'false')}catch(e2){}}var isDesktop=false;try{isDesktop=!!(window.matchMedia&&window.matchMedia('(min-width:1024px)').matches)}catch(e3){isDesktop=window.innerWidth>=1024}var w=isDesktop?(collapsed?'5rem':'16rem'):'0rem';r.style.setProperty('--sidebar-width',w);try{document.cookie='sidebarCollapsed='+(collapsed?'1':'0')+'; Path=/; Max-Age=31536000; SameSite=Lax'}catch(e4){}}catch(e5){}window.addEventListener('load',function(){r.classList.add('loaded')},false)}catch(e){}})();`;
  const pwaSplashInit = `(function(){try{var r=document.documentElement;var standalone=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;if(!standalone)return;r.dataset.pwaSplash='show';r.dataset.pwaSplashActive='true';r.style.backgroundColor='#ebf4ff';r.style.backgroundImage='radial-gradient(1200px 720px at 8% -10%, rgba(8,119,251,.35), transparent 62%),radial-gradient(900px 560px at 92% -12%, rgba(6,182,212,.26), transparent 58%),linear-gradient(150deg,#f8fbff 0%,#ebf4ff 44%,#f5fcff 100%)';var started=Date.now();var hidden=false;var hide=function(){if(hidden)return;hidden=true;var elapsed=Date.now()-started;var minVisible=900;var finish=function(){r.dataset.pwaSplash='hide';delete r.dataset.pwaSplashActive;r.style.removeProperty('background-image')};if(elapsed<minVisible){setTimeout(finish,minVisible-elapsed)}else{finish()}};window.addEventListener('load',hide,{once:true});setTimeout(hide,3200)}catch(e){}})();`;
  const pwaSplashCriticalCss = `
html[data-os-pending="true"],html[data-os-pending="true"] body{-ms-overflow-style:none;scrollbar-width:none;}
html[data-os-pending="true"]::-webkit-scrollbar,html[data-os-pending="true"] body::-webkit-scrollbar{width:0;height:0;}
html[data-pwa-splash="show"] body{background-color:#ebf4ff !important;background-image:radial-gradient(1200px 720px at 8% -10%, rgba(8,119,251,.35), transparent 62%),radial-gradient(900px 560px at 92% -12%, rgba(6,182,212,.26), transparent 58%),linear-gradient(150deg,#f8fbff 0%,#ebf4ff 44%,#f5fcff 100%) !important;}
html[data-pwa-splash="show"] .sbc-pwa-splash{opacity:1 !important;visibility:visible !important;pointer-events:auto !important;}
html[data-pwa-splash-active="true"] #sbc-app-root{opacity:0 !important;}
.sbc-sidebar-inner{display:flex;flex-direction:column;height:100%;min-height:0;}
.sbc-sidebar .sbc-sidebar-nav{flex:1 1 0%;min-height:0;overflow-y:auto;overflow-x:hidden;}
.sbc-sidebar .sbc-sidebar-navlink{display:flex;flex-direction:row;align-items:center;gap:1rem;height:3rem;box-sizing:border-box;}
.sbc-sidebar .sbc-sidebar-navlink + .sbc-sidebar-navlink{margin-top:.25rem;}
html[data-sidebar-collapsed="true"] .sbc-sidebar{width:5rem !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-label,html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-brand,html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-collapse-text{display:none !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-navlink{display:flex !important;align-items:center !important;box-sizing:border-box !important;justify-content:center !important;gap:0 !important;width:3rem !important;height:3rem !important;min-height:3rem !important;margin-inline:auto !important;padding-top:0 !important;padding-bottom:0 !important;padding-left:0 !important;padding-right:0 !important;line-height:1 !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-nav{padding-left:0 !important;padding-right:0 !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-navlink + .sbc-sidebar-navlink{margin-top:.25rem !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-head{padding-left:0 !important;padding-right:0 !important;margin-bottom:1rem !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-head-row{display:flex !important;flex-direction:column !important;align-items:center !important;gap:.5rem !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-logo-link{justify-content:center !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-notif-btn{margin-inline:auto !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-collapse-wrap,html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-profile-wrap{padding-left:0 !important;padding-right:0 !important;}
html[data-sidebar-collapsed="true"] .sbc-sidebar .sbc-sidebar-profile-btn{width:3rem !important;height:3rem !important;justify-content:center !important;padding:0 !important;margin-inline:auto !important;}
@media (max-width:1023px){html[data-sidebar-collapsed="true"] .sbc-sidebar{width:0 !important;}}
  `;
  const htmlStyle: CSSProperties & Record<"--sidebar-width", string> = {
    colorScheme: "light",
    backgroundColor: "#ebf4ff",
    backgroundImage:
      "radial-gradient(1200px 720px at 8% -10%, rgba(8, 119, 251, 0.35), transparent 62%), radial-gradient(900px 560px at 92% -12%, rgba(6, 182, 212, 0.26), transparent 58%), linear-gradient(150deg, #f8fbff 0%, #ebf4ff 44%, #f5fcff 100%)",
    color: "#0f172a",
    "--sidebar-width": initialSidebarCollapsed ? "5rem" : "16rem",
  };

  return (
    <html
      lang={locale}
      dir={dir}
      data-sidebar-collapsed={initialSidebarCollapsed ? "true" : "false"}
      className={initialIsDark ? "dark" : undefined}
      style={htmlStyle}
      suppressHydrationWarning
    >
      <head>
        {/* CRITICAL: This script MUST be first to prevent theme flash */}
        <script dangerouslySetInnerHTML={{ __html: pwaSplashInit }} />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <style dangerouslySetInnerHTML={{ __html: pwaSplashCriticalCss }} />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1334x750.png" media="(device-width: 667px) and (device-height: 375px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2532x1170.png" media="(device-width: 844px) and (device-height: 390px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2556x1179.png" media="(device-width: 852px) and (device-height: 393px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1206x2622.png" media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2622x1206.png" media="(device-width: 874px) and (device-height: 402px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2208x1242.png" media="(device-width: 736px) and (device-height: 414px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2688x1242.png" media="(device-width: 896px) and (device-height: 414px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2778x1284.png" media="(device-width: 926px) and (device-height: 428px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2796x1290.png" media="(device-width: 932px) and (device-height: 430px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2048x1536.png" media="(device-width: 1024px) and (device-height: 768px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1620x2160.png" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2160x1620.png" media="(device-width: 1080px) and (device-height: 810px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1668x2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2224x1668.png" media="(device-width: 1112px) and (device-height: 834px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2388x1668.png" media="(device-width: 1194px) and (device-height: 834px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/startup/apple-launch-2732x2048.png" media="(device-width: 1366px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${sbcSans.className} ${sbcSans.variable} ${sbcMono.variable} font-sbc antialiased`}
      >
        <PWASplashScreen locale={locale} />
        <div id="sbc-app-root">
          <OverlayScrollbarsInit />
          <LoyaltyPushSwInit />
          <CardGlowInit />
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
