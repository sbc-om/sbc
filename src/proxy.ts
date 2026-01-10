import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const LOCALES = ["en", "ar"] as const;
const DEFAULT_LOCALE = "en";

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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // If no locale prefix, redirect to the best locale.
  if (!first || !isLocale(first)) {
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

  // Auth protection (JWT cookie) for protected areas.
  // Note: Proxy runs before routing; keep it fast and avoid doing heavy DB work here.
  const restSegments = segments.slice(1);
  const section = restSegments[0];

  const isDashboard = section === "dashboard";
  const isAdmin = section === "admin";

  if (isDashboard || isAdmin) {
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
    } catch {
      return redirectToLogin();
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);

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
