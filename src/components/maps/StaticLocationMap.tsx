"use client";

import dynamic from "next/dynamic";

const OsmLocationPicker = dynamic(
  () => import("@/components/maps/OsmLocationPicker").then((mod) => mod.OsmLocationPicker),
  { ssr: false }
);

interface StaticLocationMapProps {
  latitude: number;
  longitude: number;
  locale: "en" | "ar";
  className?: string;
  markerImageUrl?: string;
}

export function StaticLocationMap({
  latitude,
  longitude,
  locale,
  className,
  markerImageUrl,
}: StaticLocationMapProps) {
  return (
    <OsmLocationPicker
      value={{ lat: latitude, lng: longitude, radiusMeters: 250 }}
      onChange={() => {
        // No-op for static display
      }}
      locale={locale}
      disabled
      hideRadius
      viewOnly
      className={className}
      markerImageUrl={markerImageUrl}
    />
  );
}
