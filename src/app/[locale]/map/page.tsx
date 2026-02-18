import MapPageClient from "@/components/MapPageClient";
import type { Locale } from "@/lib/i18n/locales";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MapPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = (localeParam === "ar" ? "ar" : "en") as Locale;

  return <MapPageClient locale={locale} />;
}
