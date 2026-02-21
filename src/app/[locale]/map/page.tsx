import { notFound } from "next/navigation";

import MapPageClient from "@/components/MapPageClient";
import { isLocale } from "@/lib/i18n/locales";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MapPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  return <MapPageClient locale={localeParam} />;
}
