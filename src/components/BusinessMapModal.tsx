"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { Business } from "@/lib/db/types";
import { clampToOmanBounds, OMAN_DEFAULT_CENTER } from "@/lib/maps/oman";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
};

export function BusinessMapModal({ isOpen, onClose, locale }: Props) {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    fetch(`/api/businesses?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data.ok && Array.isArray(data.businesses)) {
          setBusinesses(data.businesses);
          const firstWithLocation = data.businesses.find(
            (b: Business) => typeof b.latitude === "number" && typeof b.longitude === "number"
          );
          if (firstWithLocation) {
            setActive(clampToOmanBounds(firstWithLocation.latitude as number, firstWithLocation.longitude as number));
          }
        }
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [isOpen, locale]);

  const center = active ?? OMAN_DEFAULT_CENTER;
  const embedSrc = useMemo(
    () => `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=12&output=embed`,
    [center.lat, center.lng]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative mx-4 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-(--surface) shadow-2xl">
        <div className="flex items-center justify-between border-b border-(--surface-border) px-4 py-3">
          <h3 className="text-lg font-semibold">{locale === "ar" ? "الخريطة" : "Map"}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-(--chip-bg)">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-0 md:grid-cols-[300px,1fr]">
          <div className="max-h-[28rem] overflow-y-auto border-b border-(--surface-border) p-3 md:max-h-[34rem] md:border-b-0 md:border-e">
            {loading ? (
              <div className="px-1 py-3 text-sm text-(--muted-foreground)">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</div>
            ) : (
              <ul className="space-y-2">
                {(businesses ?? []).map((b) => {
                  if (typeof b.latitude !== "number" || typeof b.longitude !== "number") return null;
                  const point = clampToOmanBounds(b.latitude, b.longitude);
                  const href = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
                  return (
                    <li key={b.id} className="rounded-xl bg-(--chip-bg) p-2.5">
                      <button
                        type="button"
                        onClick={() => setActive(point)}
                        className="w-full text-start text-sm font-medium hover:opacity-90"
                      >
                        {locale === "ar" ? b.name.ar : b.name.en}
                      </button>
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-accent hover:underline"
                      >
                        {locale === "ar" ? "فتح في Google Maps" : "Open in Google Maps"}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="h-[28rem] md:h-[34rem]">
            <iframe
              title={locale === "ar" ? "خريطة جوجل" : "Google map"}
              src={embedSrc}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="border-t border-(--surface-border) p-4">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            {locale === "ar" ? "إغلاق" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
