import { notFound } from "next/navigation";
import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { DictionaryProvider } from "@/lib/i18n/DictionaryProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DirectionSync } from "@/components/DirectionSync";

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

  return (
    <DictionaryProvider locale={locale as Locale} dict={dict}>
      <DirectionSync locale={locale as Locale} />
      <div className="min-h-dvh bg-transparent text-foreground flex flex-col">
        <Header locale={locale as Locale} dict={dict} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale as Locale} dict={dict} />
      </div>
    </DictionaryProvider>
  );
}
