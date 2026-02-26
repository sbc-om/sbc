import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { DictionaryProvider } from "@/lib/i18n/DictionaryProvider";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DirectionSync } from "@/components/DirectionSync";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { requireUser } from "@/lib/auth/requireUser";
import { CartProvider } from "@/components/store/CartProvider";
import { CartFloating } from "@/components/store/CartFloating";
import { listStoreProducts } from "@/lib/store/products";
import { AISearchProvider } from "@/lib/ai/AISearchProvider";
import { getBusinessByOwnerId } from "@/lib/db/businesses";
import { getBusinessBySlug, getBusinessByUsername } from "@/lib/db/businesses";
import { getBusinessByDomain } from "@/lib/db/businesses";
import { DynamicShell } from "@/components/DynamicShell";
import { buttonVariants } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getCurrentLoyaltyStaffSession } from "@/lib/auth/loyaltyStaffSession";

const BASE_DOMAINS = ["sbc.om", "localhost", "127.0.0.1"] as const;
const MAIN_DOMAINS = ["sbc.om", "www.sbc.om", "localhost", "127.0.0.1"] as const;
const DEV_DOMAIN_SUFFIXES = [".ngrok-free.app", ".ngrok.io"] as const;

/** Strip query-string, hash, and trailing slash so route matching is stable. */
function normalizePathname(raw: string): string {
  if (!raw) return "";
  const clean = raw.split("?")[0]?.split("#")[0] ?? "";
  if (!clean) return "";
  return clean !== "/" && clean.endsWith("/") ? clean.slice(0, -1) : clean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  const ar = locale === "ar";
  const description = ar
    ? "منصة أعمال ثنائية اللغة لدليل الأنشطة التجارية، التسويق، وبطاقات الولاء."
    : "A bilingual business platform for directory discovery, marketing services, and loyalty solutions.";
  const canonical = `/${locale}`;

  return {
    title: dict.appName,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      locale: ar ? "ar_OM" : "en_US",
      url: canonical,
      title: dict.appName,
      description,
      images: [
        {
          url: "/images/sbc.svg",
          alt: dict.appName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.appName,
      description,
      images: ["/images/sbc.svg"],
    },
  };
}

// ── Route classification ──────────────────────────────────────────────
// First URL segment after /{locale}/... that determines the shell.

/** Routes that ALWAYS require authentication – the user is redirected to
 *  the login page when not logged in.  These always get the dashboard shell. */
const REQUIRE_AUTH_SECTIONS = new Set([
  "home",
  "explorer",
  "explore",
  "categories",
  "saved",
  "wallet",
  "dashboard",
  "admin",
  "agent",
  "ai",
  "profile",
  "settings",
  "notifications",
  "business-request",
  "directory",
  "chat",
  "verify-phone",
]);

function isLoyaltyManageRoute(segments: string[]): boolean {
  return segments.length > 2 && segments[1] === "loyalty" && segments[2] === "manage";
}

function extractSubdomain(hostname: string): string | null {
  for (const baseDomain of BASE_DOMAINS) {
    if (hostname.endsWith(`.${baseDomain}`)) {
      const subdomain = hostname.slice(0, -(baseDomain.length + 1));
      if (subdomain && subdomain !== "www") {
        return subdomain;
      }
    }
  }
  return null;
}

function getPrimaryForwardedHost(forwardedHost: string | null): string {
  if (!forwardedHost) return "";
  return forwardedHost.split(",")[0]?.trim() ?? "";
}

function normalizeHostnameFromHostHeader(hostValue: string): string {
  const trimmed = hostValue.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    return end > 0 ? trimmed.slice(1, end).toLowerCase() : trimmed.toLowerCase();
  }

  const [hostOnly] = trimmed.split(":");
  return (hostOnly ?? "").toLowerCase();
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale as Locale);

  // ── Determine the current route section ────────────────────────────
  const headersList = await headers();
  const rawPathname =
    headersList.get("x-pathname") ||
    headersList.get("x-invoke-path") ||
    headersList.get("next-url") ||
    "";
  const pathname = normalizePathname(rawPathname);
  const forwardedHostHeader = getPrimaryForwardedHost(headersList.get("x-forwarded-host"));
  const hostHeader = forwardedHostHeader || headersList.get("host") || "";
  const hostname = normalizeHostnameFromHostHeader(hostHeader);
  const headerSubdomain = headersList.get("x-subdomain") || "";
  const headerCustomDomain = headersList.get("x-custom-domain") || "";
  const forwardedProto = headersList.get("x-forwarded-proto") || "https";
  const proto = forwardedProto.includes("http") ? forwardedProto.split(",")[0].trim() : "https";

  // First segment after the locale: e.g. "map", "home", "explorer"
  const segments = pathname.split("/").filter(Boolean);
  const routeSection = segments.length > 1 ? segments[1] : "";

  const isDevDomain = DEV_DOMAIN_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
  const subdomain = extractSubdomain(hostname);
  const isMainDomain = MAIN_DOMAINS.some((domain) => hostname === domain);
  const isCustomDomain = !!hostname && !isDevDomain && !isMainDomain && !subdomain;
  const isBusinessHost = !!subdomain || isCustomDomain;
  const isBusinessPageRoute = routeSection === "u" || routeSection === "businesses";
  const standaloneBusinessView = isBusinessHost && isBusinessPageRoute;

  let standaloneBusinessName: string | null = null;
  let standaloneBusinessLogo: string | null = null;
  if (standaloneBusinessView) {
    const businessKey = segments[2] ?? "";
    let business = null;

    if (headerSubdomain) {
      business = await getBusinessByUsername(headerSubdomain);
    }

    if (!business && headerCustomDomain) {
      business = await getBusinessByDomain(headerCustomDomain);
    }

    if (!business) {
      business = routeSection === "u"
        ? await getBusinessByUsername(businessKey)
        : businessKey.startsWith("@")
          ? await getBusinessByUsername(businessKey)
          : await getBusinessBySlug(businessKey);
    }

    if (business) {
      standaloneBusinessName = locale === "ar" ? business.name.ar : business.name.en;
      standaloneBusinessLogo = business.media?.logo ?? null;
    }
  }

  let backToSbcHref = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sbc.om";
  if (subdomain) {
    const matchedBase = BASE_DOMAINS.find((baseDomain) => hostname.endsWith(`.${baseDomain}`));
    if (matchedBase) {
      const port = hostHeader.includes(":") ? `:${hostHeader.split(":")[1]}` : "";
      backToSbcHref = `${proto}://${matchedBase}${port}`;
    }
  }

  const requiresAuth = REQUIRE_AUTH_SECTIONS.has(routeSection) || isLoyaltyManageRoute(segments);
  const isLocaleHomePage = segments.length <= 1; // bare /{locale}
  const isLoyaltyStaffWorkspaceRoute =
    segments[1] === "loyalty" &&
    segments[2] === "staff" &&
    typeof segments[3] === "string" &&
    segments[3].length > 0;

  const staffAppModeCookie = (await cookies()).get("sbc_staff_app_mode")?.value === "1";
  let hidePublicChromeForStaffApp = false;
  if (isLoyaltyStaffWorkspaceRoute && staffAppModeCookie) {
    const staffSession = await getCurrentLoyaltyStaffSession();
    hidePublicChromeForStaffApp = !!staffSession && staffSession.joinCode === segments[3];
  }

  if (hidePublicChromeForStaffApp) {
    return (
      <DictionaryProvider locale={locale as Locale} dict={dict}>
        <AISearchProvider>
          <DirectionSync locale={locale as Locale} />
          {children}
        </AISearchProvider>
      </DictionaryProvider>
    );
  }

  // ── Authentication ─────────────────────────────────────────────────
  const user = requiresAuth
    ? await requireUser(locale as Locale)
    : await getCurrentUser();

  const products = await listStoreProducts();
  // Check if user already has a business (to hide business request menu)
  const userBusiness = user ? await getBusinessByOwnerId(user.id) : null;

  if (standaloneBusinessView) {
    const title = standaloneBusinessName || (locale === "ar" ? "صفحة النشاط" : "Business Page");

    return (
      <DictionaryProvider locale={locale as Locale} dict={dict}>
        <AISearchProvider>
          <DirectionSync locale={locale as Locale} />
          <div className="min-h-dvh bg-transparent text-foreground flex flex-col">
            <div className="border-b border-(--surface-border) bg-(--surface)/95 backdrop-blur">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-(--surface-border) bg-(--chip-bg)">
                    {standaloneBusinessLogo ? (
                      <Image
                        src={standaloneBusinessLogo}
                        alt={title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-(--muted-foreground)">
                        {title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground sm:text-base">{title}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ThemeToggle locale={locale as Locale} />
                  <LanguageSwitcher locale={locale as Locale} />
                </div>
              </div>
            </div>
            <main className="flex-1">{children}</main>

            <footer className="border-t border-(--surface-border) bg-(--surface)/95 backdrop-blur">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <Link href={backToSbcHref} className="inline-flex items-center gap-3" aria-label="SBC">
                  <div className="relative h-10 w-10 shrink-0">
                    <Image
                      src="/images/sbc.svg"
                      alt="SBC"
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Smart Business Center</span>
                </Link>

                <Link
                  href={backToSbcHref}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  {locale === "ar" ? "العودة إلى SBC" : "Back to SBC"}
                </Link>
              </div>
            </footer>
          </div>
        </AISearchProvider>
      </DictionaryProvider>
    );
  }

  // ── Shell rendering ────────────────────────────────────────────────
  // When the user is logged in we render BOTH shell chromes and let the
  // client-side <DynamicShell> component instantly swap between them
  // based on `usePathname()`.  No full-page reload required.

  if (user) {
    // Pre-render all chrome on the server, pass as React-node props.
    const sidebarNode = (
      <Sidebar
        locale={locale as Locale}
        dict={dict}
        user={{
          displayName: user.displayName ?? user.email.split("@")[0],
          role: user.role,
          email: user.email,
          avatarUrl: user.avatarUrl ?? null,
          hasBusiness: !!userBusiness,
        }}
      />
    );
    const mobileNavNode = (
      <MobileNav locale={locale as Locale} dict={dict} user={{ role: user.role }} />
    );
    const headerNode = <Header locale={locale as Locale} dict={dict} />;
    const footerNode = (
      <Footer locale={locale as Locale} dict={dict} homepageOnlyInstagram={isLocaleHomePage} />
    );

    return (
      <DictionaryProvider locale={locale as Locale} dict={dict}>
        <AISearchProvider>
          <DirectionSync locale={locale as Locale} />
          <CartProvider userKey={user.id}>
            <CartFloating locale={locale as Locale} products={products} />
            <SidebarLayout>
              <DynamicShell
                sidebar={sidebarNode}
                header={headerNode}
                footer={footerNode}
                mobileNav={mobileNavNode}
              >
                {children}
              </DynamicShell>
            </SidebarLayout>
          </CartProvider>
        </AISearchProvider>
      </DictionaryProvider>
    );
  }

  // Not logged in – always public shell, no switching needed.
  return (
    <DictionaryProvider locale={locale as Locale} dict={dict}>
      <AISearchProvider>
        <DirectionSync locale={locale as Locale} />
        <div className="min-h-dvh bg-transparent text-foreground flex flex-col">
          <Header locale={locale as Locale} dict={dict} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale as Locale} dict={dict} homepageOnlyInstagram={isLocaleHomePage} />
        </div>
      </AISearchProvider>
    </DictionaryProvider>
  );
}
