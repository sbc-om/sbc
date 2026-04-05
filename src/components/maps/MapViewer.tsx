"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { clampToOmanBounds } from "@/lib/maps/oman";

type MapViewerProps = {
  lat: number;
  lng: number;
  label?: string;
  locale: string;
};

export function MapViewer({ lat, lng, label, locale }: MapViewerProps) {
  const router = useRouter();
  const ar = locale === "ar";

  const [coords, setCoords] = useState(() => clampToOmanBounds(lat, lng));
  const [showCopied, setShowCopied] = useState(false);

  const embedSrc = useMemo(() => {
    return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`;
  }, [coords.lat, coords.lng]);

  const googleSearchUrl = useMemo(
    () => `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`,
    [coords.lat, coords.lng]
  );

  const directionsUrl = useMemo(
    () => `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
    [coords.lat, coords.lng]
  );

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(clampToOmanBounds(position.coords.latitude, position.coords.longitude));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleCopyCoordinates = useCallback(() => {
    navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [coords.lat, coords.lng]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-(--background)">
      <header className="flex shrink-0 items-center justify-between border-b border-(--surface-border) bg-(--surface) px-4 py-3">
        <button
          onClick={() => router.back()}
          className="-ms-2 rounded-full p-2 transition-colors hover:bg-(--chip-bg)"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ar ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">{label || (ar ? "الموقع" : "Location")}</h1>
        <a
          href={googleSearchUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          {ar ? "Google Maps" : "Google Maps"}
        </a>
      </header>

      <div className="relative flex-1">
        <iframe
          title={ar ? "خريطة جوجل" : "Google map"}
          src={embedSrc}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {showCopied ? (
          <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-sm text-white">
            {ar ? "تم النسخ" : "Copied"}
          </div>
        ) : null}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-(--surface-border) bg-(--surface) p-4 sm:grid-cols-4">
        <button
          type="button"
          onClick={handleMyLocation}
          className="rounded-xl bg-(--chip-bg) px-3 py-2 text-sm font-medium hover:bg-(--surface-border)"
        >
          {ar ? "موقعي" : "My location"}
        </button>
        <button
          type="button"
          onClick={handleCopyCoordinates}
          className="rounded-xl bg-(--chip-bg) px-3 py-2 text-sm font-medium hover:bg-(--surface-border)"
        >
          {ar ? "نسخ الإحداثيات" : "Copy coords"}
        </button>
        <a
          href={googleSearchUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-(--chip-bg) px-3 py-2 text-sm font-medium hover:bg-(--surface-border)"
        >
          {ar ? "فتح الموقع" : "Open place"}
        </a>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          {ar ? "الاتجاهات" : "Directions"}
        </a>
      </div>
    </div>
  );
}
