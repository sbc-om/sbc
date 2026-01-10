import { notFound } from "next/navigation";
import type { Metadata } from "next";

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

  return (
    <DictionaryProvider locale={locale as Locale} dict={dict}>
      <DirectionSync locale={locale as Locale} />
      {user ? (
        <CartProvider userKey={user.id}>
          <CartFloating locale={locale as Locale} />

          {/* Logged in: Show sidebar layout */}
          <SidebarLayout>
            <div className="min-h-dvh bg-transparent text-foreground">
              <Sidebar
                locale={locale as Locale}
                dict={dict}
                user={{
                  displayName: user.displayName ?? user.email.split("@")[0],
                  role: user.role,
                  email: user.email,
                  avatarUrl: user.avatarUrl ?? null,
                }}
              />
              <div
                className="min-h-dvh transition-[margin] duration-300 ease-in-out"
                style={{
                  marginInlineStart: "var(--sidebar-width, 0)",
                }}
              >
                <main className="w-full pb-20 lg:pb-6">{children}</main>
              </div>
              <MobileNav locale={locale as Locale} dict={dict} />
            </div>
          </SidebarLayout>
        </CartProvider>
      ) : (
        // Not logged in: Show header + footer
        <div className="min-h-dvh bg-transparent text-foreground flex flex-col">
          <Header locale={locale as Locale} dict={dict} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale as Locale} dict={dict} />
        </div>
      )}
    </DictionaryProvider>
  );
}
