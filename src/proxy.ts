import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const LOCALES = ["en", "ar"] as const;
const DEFAULT_LOCALE = "en";

// Main domain(s) - base domains without subdomains
const BASE_DOMAINS = [
  "sbc.om",
  "localhost",
  "127.0.0.1",
];

// Full main domains that should not be treated as custom/subdomain
const MAIN_DOMAINS = [
  "sbc.om",
  "www.sbc.om",
  "localhost",
  "127.0.0.1",
];

// Domains that should be treated as main app (not custom domains)
// These are tunneling/dev domains where the subdomain is not a business handle
const DEV_DOMAIN_SUFFIXES = [
  ".ngrok-free.app",
  ".ngrok.io",
];

type Locale = (typeof LOCALES)[number];

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

function detectLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  // Very small parser: just take first language tag.
  const first = header.split(",")[0]?.trim().toLowerCase();
  if (!first) return DEFAULT_LOCALE;
  if (first.startsWith("ar")) return "ar";
  return "en";
}

// Extract subdomain from hostname (e.g., "spirithub" from "spirithub.sbc.om")
// Hostname should already have port removed
function extractSubdomain(hostname: string): string | null {
  for (const baseDomain of BASE_DOMAINS) {
    if (hostname.endsWith(`.${baseDomain}`)) {
      const subdomain = hostname.slice(0, -(baseDomain.length + 1));
      // Exclude "www" as it's not a business subdomain
      if (subdomain && subdomain !== "www") {
        return subdomain;
      }
    }
  }
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Use the Host header to get the full hostname including subdomain
  const hostHeader = req.headers.get("host") || req.nextUrl.hostname;
  const hostname = hostHeader.split(":")[0];
  const subdomain = extractSubdomain(hostname);

  // Skip Next internals, static files, and non-locale routes.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }
  
  // Handle subdomain routing (e.g., spirithub.sbc.om -> /@spirithub)
  if (subdomain) {
    // Check if URL has locale prefix
    const segments = pathname.split("/").filter(Boolean);
    const urlLocale = segments[0] && isLocale(segments[0]) ? segments[0] as Locale : null;
    
    // Use URL locale if present, otherwise fall back to cookie or Accept-Language
    const cookieLocale = req.cookies.get("locale")?.value;
    const preferred: Locale = urlLocale 
      ? urlLocale
      : (cookieLocale && isLocale(cookieLocale)
          ? cookieLocale
          : detectLocaleFromAcceptLanguage(req.headers.get("accept-language")));

    // If user is trying to access login/register on subdomain, redirect to main domain
    const pathWithoutLocale = urlLocale ? segments.slice(1).join("/") : segments.join("/");
    
    // If user is trying to access another business page on subdomain, redirect to main domain
    if (pathWithoutLocale.startsWith("@") || pathWithoutLocale.startsWith("u/")) {
      const port = hostHeader.includes(":") ? `:${hostHeader.split(":")[1]}` : "";
      // Find the base domain this subdomain belongs to
      let mainDomain = "sbc.om";
      for (const baseDomain of BASE_DOMAINS) {
        if (hostname.endsWith(`.${baseDomain}`)) {
          mainDomain = baseDomain;
          break;
        }
      }
      const protocol = req.nextUrl.protocol.replace(/:$/, "");
      // Redirect to main domain without locale prefix (proxy will handle locale)
      const targetUrl = `${protocol}://${mainDomain}${port}/${pathWithoutLocale}`;
      
      // Use HTML redirect for cross-subdomain (works better with localhost)
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${targetUrl}">
  <script>window.location.replace("${targetUrl}");</script>
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }
    
    if (pathWithoutLocale === "login" || pathWithoutLocale === "register") {
      // Get the port from host header if present
      const port = hostHeader.includes(":") ? `:${hostHeader.split(":")[1]}` : "";
      // Find the base domain this subdomain belongs to
      let mainDomain = "sbc.om";
      for (const baseDomain of BASE_DOMAINS) {
        if (hostname.endsWith(`.${baseDomain}`)) {
          mainDomain = baseDomain;
          break;
        }
      }
      
      // Build redirect URL to main domain with subdomain as redirect target
      const protocol = req.nextUrl.protocol.replace(/:$/, ""); // Remove trailing colon if present
      const redirectParam = req.nextUrl.searchParams.get("redirect") || `/@${subdomain}`;
      const loginUrl = `${protocol}://${mainDomain}${port}/${preferred}/${pathWithoutLocale}?redirect=${encodeURIComponent(redirectParam)}`;
      
      // Return HTML page with client-side redirect (works better with localhost subdomains)
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${loginUrl}">
  <script>window.location.href = "${loginUrl}";</script>
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to login page...</p>
  <p><a href="${loginUrl}">Click here if not redirected</a></p>
</body>
</html>`;
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    const url = req.nextUrl.clone();
    // Rewrite to the @username handler
    url.pathname = `/${preferred}/u/${subdomain}`;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", preferred);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-subdomain", subdomain);

    const res = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });

    res.cookies.set("locale", preferred, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return res;
  }

  // Handle custom domain routing - redirect to domain lookup page
  const isDevDomain = DEV_DOMAIN_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
  const isCustomDomain = !isDevDomain && !MAIN_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith(`.${d}`)
  );

  if (isCustomDomain && hostname && (pathname === "/" || pathname === "")) {
    // Rewrite to custom domain handler page which will do the DB lookup
    const cookieLocale = req.cookies.get("locale")?.value;
    const preferred: Locale =
      cookieLocale && isLocale(cookieLocale)
        ? cookieLocale
        : detectLocaleFromAcceptLanguage(req.headers.get("accept-language"));

    const url = req.nextUrl.clone();
    url.pathname = `/${preferred}/domain`;
    url.searchParams.set("host", hostname);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", preferred);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-custom-domain", hostname);

    const res = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });

    res.cookies.set("locale", preferred, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return res;
  }

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  const rewriteHandle = (handle: string, locale: Locale) => {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/u/${handle}`;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", locale);
    requestHeaders.set("x-pathname", pathname);

    const res = NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });

    res.cookies.set("locale", locale, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return res;
  };

  // If no locale prefix, redirect to the best locale.
  if (!first || !isLocale(first)) {
    if (first?.startsWith("@")) {
      const handle = first.slice(1);
      if (handle) {
        const cookieLocale = req.cookies.get("locale")?.value;
        const preferred: Locale =
          cookieLocale && isLocale(cookieLocale)
            ? cookieLocale
            : detectLocaleFromAcceptLanguage(req.headers.get("accept-language"));
        return rewriteHandle(handle, preferred);
      }
    }

    const cookieLocale = req.cookies.get("locale")?.value;
    const preferred: Locale =
      cookieLocale && isLocale(cookieLocale)
        ? cookieLocale
        : detectLocaleFromAcceptLanguage(req.headers.get("accept-language"));

    const url = req.nextUrl.clone();
    url.pathname = `/${preferred}${pathname}`;

    const res = NextResponse.redirect(url);
    res.cookies.set("locale", preferred, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }

  // Locale exists: forward request and annotate locale for the root layout.
  const locale = first;

  const restSegments = segments.slice(1);
  const handleSegment = restSegments[0];
  if (handleSegment?.startsWith("@")) {
    const handle = handleSegment.slice(1);
    if (handle) {
      return rewriteHandle(handle, locale);
    }
  }

  // Public user-built websites: /{locale}/site/{slug} → /site/{slug}
  // Rewrite so the page is served from /app/site/ (bare layout, no sidebar).
  if (restSegments[0] === "site") {
    const url = req.nextUrl.clone();
    // Strip the locale prefix: /en/site/slug/about → /site/slug/about
    url.pathname = `/${restSegments.join("/")}`;

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", locale);
    requestHeaders.set("x-pathname", pathname);

    const res = NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });

    res.cookies.set("locale", locale, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return res;
  }

  // Auth protection (JWT cookie) for protected areas.
  // Note: Proxy runs before routing; keep it fast and avoid doing heavy DB work here.
  const section = restSegments[0];

  // All sections that require an authenticated user (dashboard shell).
  const PROTECTED_SECTIONS = new Set([
    "dashboard",
    "admin",
    "agent",
    "ai",
    "profile",
    "settings",
    "verify-phone",
    "home",
    "explorer",
    "explore",
    "categories",
    "saved",
    "wallet",
    "notifications",
    "business-request",
    "directory",
    "chat",
  ]);

  const isProtected = section ? PROTECTED_SECTIONS.has(section) : false;

  // Protected areas that require authentication
  if (isProtected) {
    const cookieName = process.env.AUTH_COOKIE_NAME || "sbc_auth";
    const token = req.cookies.get(cookieName)?.value;
    const secret = process.env.AUTH_JWT_SECRET;

    const redirectToLogin = () => {
      const url = req.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    };

    if (!token || !secret) {
      return redirectToLogin();
    }

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      );
      const role = payload.role;

      if (section === "admin" && role !== "admin") {
        const url = req.nextUrl.clone();
        url.pathname = `/${locale}/dashboard`;
        return NextResponse.redirect(url);
      }

      if (section === "agent" && role !== "agent" && role !== "admin") {
        const url = req.nextUrl.clone();
        url.pathname = `/${locale}/dashboard`;
        return NextResponse.redirect(url);
      }

      // Phone verification check is now handled in the layout/page level
      // to avoid database access in Edge middleware
    } catch {
      return redirectToLogin();
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set("x-pathname", pathname);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  res.cookies.set("locale", locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}

export const config = {
  matcher: ["/:path*"],
};
