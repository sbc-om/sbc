import { Metadata } from "next";
import { notFound } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import { MapViewer } from "@/components/maps/MapViewer";

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ lat?: string; lng?: string; label?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const { lat, lng } = await searchParams;

  const title = locale === "ar" ? "عرض الموقع" : "View Location";
  const description = lat && lng
    ? (locale === "ar" ? `موقع على الخريطة: ${lat}, ${lng}` : `Location on map: ${lat}, ${lng}`)
    : (locale === "ar" ? "عرض الموقع على الخريطة" : "View location on map");

  return {
    title,
    description,
  };
}

export default async function MapPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { lat, lng, label } = await searchParams;

  // Validate coordinates
  const latitude = lat ? parseFloat(lat) : null;
  const longitude = lng ? parseFloat(lng) : null;

  if (!latitude || !longitude || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    notFound();
  }

  return (
    <MapViewer
      lat={latitude}
      lng={longitude}
      label={label}
      locale={locale}
    />
  );
}
