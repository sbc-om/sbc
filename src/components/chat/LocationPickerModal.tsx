"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { clampToOmanBounds, OMAN_DEFAULT_CENTER } from "@/lib/maps/oman";

type LocationPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  locale: string;
};

export function LocationPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
  locale,
}: LocationPickerModalProps) {
  const ar = locale === "ar";
  const [lat, setLat] = useState(String(OMAN_DEFAULT_CENTER.lat));
  const [lng, setLng] = useState(String(OMAN_DEFAULT_CENTER.lng));
  const [loadingLocation, setLoadingLocation] = useState(false);

  const safePreview = useMemo(() => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return OMAN_DEFAULT_CENTER;
    return clampToOmanBounds(parsedLat, parsedLng);
  }, [lat, lng]);

  const embedSrc = `https://maps.google.com/maps?q=${safePreview.lat},${safePreview.lng}&z=15&output=embed`;
  const openInGoogleHref = `https://www.google.com/maps/search/?api=1&query=${safePreview.lat},${safePreview.lng}`;

  const handleMyLocation = async () => {
    if (!navigator.geolocation) return;
    setLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
        });
      });
      const safe = clampToOmanBounds(position.coords.latitude, position.coords.longitude);
      setLat(String(safe.lat));
      setLng(String(safe.lng));
    } catch {
      // ignore
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleConfirm = () => {
    onSelectLocation(safePreview.lat, safePreview.lng);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-(--surface) shadow-2xl">
        <div className="flex items-center justify-between border-b border-(--surface-border) px-4 py-3">
          <h3 className="text-lg font-semibold">{ar ? "إرسال موقع" : "Send location"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-(--chip-bg)"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-(--muted-foreground)">
              <span>{ar ? "خط العرض" : "Latitude"}</span>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full rounded-xl bg-(--background) px-3 py-2 text-sm text-(--foreground) outline-none ring-1 ring-(--surface-border) focus:ring-accent/35"
              />
            </label>
            <label className="space-y-1 text-xs text-(--muted-foreground)">
              <span>{ar ? "خط الطول" : "Longitude"}</span>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full rounded-xl bg-(--background) px-3 py-2 text-sm text-(--foreground) outline-none ring-1 ring-(--surface-border) focus:ring-accent/35"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleMyLocation} disabled={loadingLocation}>
              {loadingLocation ? "..." : ar ? "موقعي" : "My location"}
            </Button>
            <a
              href={openInGoogleHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              {ar ? "فتح في Google Maps" : "Open in Google Maps"}
            </a>
          </div>

          <div className="h-72 overflow-hidden rounded-xl ring-1 ring-(--surface-border)">
            <iframe
              title={ar ? "خريطة جوجل" : "Google map"}
              src={embedSrc}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-(--surface-border) p-4">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="button" variant="primary" className="flex-1" onClick={handleConfirm}>
            {ar ? "تأكيد" : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
