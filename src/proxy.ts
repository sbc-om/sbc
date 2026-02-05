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
function extractSubdomain(hostname: string): string | null {
  const hostWithoutPort = hostname.split(":")[0];
  
  for (const baseDomain of BASE_DOMAINS) {
    if (hostWithoutPort.endsWith(`.${baseDomain}`)) {
      const subdomain = hostWithoutPort.slice(0, -(baseDomain.length + 1));
      // Exclude "www" as it's not a business subdomain
      if (subdomain && subdomain !== "www") {
        return subdomain;
      }
    }
  }
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname, hostname } = req.nextUrl;

  // Skip Next internals and static files.
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

  const hostWithoutPort = hostname.split(":")[0];
  
  // Handle subdomain routing (e.g., spirithub.sbc.om -> /@spirithub)
  const subdomain = extractSubdomain(hostWithoutPort);
  if (subdomain) {
    const cookieLocale = req.cookies.get("locale")?.value;
    const preferred: Locale =
      cookieLocale && isLocale(cookieLocale)
        ? cookieLocale
        : detectLocaleFromAcceptLanguage(req.headers.get("accept-language"));

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
  const isCustomDomain = !MAIN_DOMAINS.some(
    (d) => hostWithoutPort === d || hostWithoutPort.endsWith(`.${d}`)
  );

  if (isCustomDomain && hostWithoutPort && (pathname === "/" || pathname === "")) {
    // Rewrite to custom domain handler page which will do the DB lookup
    const cookieLocale = req.cookies.get("locale")?.value;
    const preferred: Locale =
      cookieLocale && isLocale(cookieLocale)
        ? cookieLocale
        : detectLocaleFromAcceptLanguage(req.headers.get("accept-language"));

    const url = req.nextUrl.clone();
    url.pathname = `/${preferred}/domain`;
    url.searchParams.set("host", hostWithoutPort);

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-locale", preferred);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-custom-domain", hostWithoutPort);

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

  // Auth protection (JWT cookie) for protected areas.
  // Note: Proxy runs before routing; keep it fast and avoid doing heavy DB work here.
  const section = restSegments[0];

  const isDashboard = section === "dashboard";
  const isAdmin = section === "admin";
  const isProfile = section === "profile";
  const isSettings = section === "settings";
  const isVerifyPhone = section === "verify-phone";

  // Protected areas that require authentication
  if (isDashboard || isAdmin || isProfile || isSettings || isVerifyPhone) {
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

      if (isAdmin && role !== "admin") {
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
