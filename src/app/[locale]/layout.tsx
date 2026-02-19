import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

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
import { DynamicShell } from "@/components/DynamicShell";

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

  return {
    title: dict.appName,
  };
}

// ── Route classification ──────────────────────────────────────────────
// First URL segment after /{locale}/... that determines the shell.

/** Routes that ALWAYS render in the **public** shell (header + footer)
 *  even when the user is authenticated. */
const ALWAYS_PUBLIC_SECTIONS = new Set([
  "map",
  "about",
  "contact",
  "faq",
  "terms",
  "rules",
  "login",
  "register",
  "businesses",
  "business-card",
  "marketing-platform",
  "loyalty",
  "email",
  "domain",
  "u",
]);

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

  // First segment after the locale: e.g. "map", "home", "explorer"
  const segments = pathname.split("/").filter(Boolean);
  const routeSection = segments.length > 1 ? segments[1] : "";

  const requiresAuth = REQUIRE_AUTH_SECTIONS.has(routeSection);
  const isLocaleHomePage = segments.length <= 1; // bare /{locale}

  // ── Authentication ─────────────────────────────────────────────────
  const user = requiresAuth
    ? await requireUser(locale as Locale)
    : await getCurrentUser();

  const products = await listStoreProducts();
  // Check if user already has a business (to hide business request menu)
  const userBusiness = user ? await getBusinessByOwnerId(user.id) : null;

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
