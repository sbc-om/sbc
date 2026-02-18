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
import { CartProvider } from "@/components/store/CartProvider";
import { CartFloating } from "@/components/store/CartFloating";
import { RealtimeEngagementHealthIndicator } from "@/components/RealtimeEngagementHealthIndicator";
import { listStoreProducts } from "@/lib/store/products";
import { AISearchProvider } from "@/lib/ai/AISearchProvider";
import { getBusinessByOwnerId } from "@/lib/db/businesses";

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
  const user = await getCurrentUser();
  const products = await listStoreProducts();
  // Check if user already has a business (to hide business request menu)
  const userBusiness = user ? await getBusinessByOwnerId(user.id) : null;
  
  // Check if we're on chat page
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isChatPage = pathname.includes("/chat");
  const isLocaleHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isMapPage = pathname === `/${locale}/map`;

  return (
    <DictionaryProvider locale={locale as Locale} dict={dict}>
      <AISearchProvider>
        <DirectionSync locale={locale as Locale} />
      {user && !isMapPage ? (
        <CartProvider userKey={user.id}>
          <CartFloating locale={locale as Locale} products={products} />

          {/* Logged in: Show sidebar layout */}
          <SidebarLayout>
            <div
              className="min-h-dvh bg-transparent text-foreground"
              style={{
                "--page-bottom-offset": isChatPage
                  ? "0px"
                  : "calc(var(--mobile-nav-height, 72px) + env(safe-area-inset-bottom) + 22px)",
              } as Record<string, string>}
            >
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
              <RealtimeEngagementHealthIndicator />
              <div
                className="min-h-dvh transition-[margin] duration-300 ease-in-out"
                style={{
                  marginInlineStart: "var(--sidebar-width, 0)",
                }}
              >
                <main className="w-full">{children}</main>
              </div>
              <MobileNav locale={locale as Locale} dict={dict} user={{ role: user.role }} />
            </div>
          </SidebarLayout>
        </CartProvider>
      ) : (
        // Not logged in: Show header + footer
        <div className="min-h-dvh bg-transparent text-foreground flex flex-col">
          <Header locale={locale as Locale} dict={dict} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale as Locale} dict={dict} homepageOnlyInstagram={isLocaleHomePage} />
        </div>
      )}
      </AISearchProvider>
    </DictionaryProvider>
  );
}
