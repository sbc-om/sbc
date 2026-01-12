"use client";

export function GeoProximityNotifier({
  businessName,
  business,
  radiusMeters,
  enabled = true,
}: {
  businessName: string;
  business: { lat: number; lng: number };
  radiusMeters: number;
  enabled?: boolean;
}) {
  // Deprecated: we intentionally do NOT perform in-browser geolocation-based notifications.
  // Location-based Wallet suggestions should be configured through Apple/Google Wallet.
  void businessName;
  void business;
  void radiusMeters;
  void enabled;
  return null;
}
