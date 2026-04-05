"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import {
  clampToOmanBounds,
  OMAN_DEFAULT_CENTER,
} from "@/lib/maps/oman";

export type OsmLocationValue = {
  lat: number;
  lng: number;
  radiusMeters: number;
  label?: string;
};

const MIN_RADIUS_METERS = 25;
const MAX_RADIUS_METERS = 500;

function clampRadiusMeters(value: unknown): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return 250;
  return Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, n));
}

function safeCoord(value: unknown, kind: "lat" | "lng") {
  const n = Number(value);
  if (!Number.isFinite(n)) return kind === "lat" ? OMAN_DEFAULT_CENTER.lat : OMAN_DEFAULT_CENTER.lng;
  if (kind === "lat") return Math.max(-90, Math.min(90, n));
  return Math.max(-180, Math.min(180, n));
}

function reverseGeocodeLabel(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function OsmLocationPicker({
  value,
  onChange,
  className,
  disabled,
  locale,
  hideRadius,
  viewOnly,
}: {
  value: OsmLocationValue | null;
  onChange: (next: OsmLocationValue | null) => void;
  className?: string;
  disabled?: boolean;
  locale?: "en" | "ar";
  hideRadius?: boolean;
  viewOnly?: boolean;
  markerImageUrl?: string;
}) {
  const ar = locale === "ar";
  const safeRadius = clampRadiusMeters(value?.radiusMeters);

  const [latInput, setLatInput] = useState(() => String(value?.lat ?? OMAN_DEFAULT_CENTER.lat));
  const [lngInput, setLngInput] = useState(() => String(value?.lng ?? OMAN_DEFAULT_CENTER.lng));
  const [radiusInput, setRadiusInput] = useState(() => String(safeRadius));
  const [geoBusy, setGeoBusy] = useState(false);

  const center = useMemo(() => {
    if (value) return clampToOmanBounds(value.lat, value.lng);
    return OMAN_DEFAULT_CENTER;
  }, [value]);

  const embedSrc = useMemo(() => {
    const delta = value ? 0.008 : 1.6;
    const west = center.lng - delta;
    const south = center.lat - delta;
    const east = center.lng + delta;
    const north = center.lat + delta;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${west},${south},${east},${north}&layer=mapnik&marker=${center.lat},${center.lng}`;
  }, [center.lat, center.lng, value]);

  const openStreetHref = useMemo(() => {
    return `https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lng}#map=15/${center.lat}/${center.lng}`;
  }, [center.lat, center.lng]);

  const applyManualLocation = () => {
    if (disabled) return;
    const lat = safeCoord(latInput, "lat");
    const lng = safeCoord(lngInput, "lng");
    const safe = clampToOmanBounds(lat, lng);
    const radiusMeters = clampRadiusMeters(radiusInput);

    onChange({
      lat: safe.lat,
      lng: safe.lng,
      radiusMeters,
      label: reverseGeocodeLabel(safe.lat, safe.lng),
    });
  };

  const useMyLocation = async () => {
    if (disabled || !navigator.geolocation) return;
    setGeoBusy(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
        });
      });

      const safe = clampToOmanBounds(position.coords.latitude, position.coords.longitude);
      setLatInput(String(safe.lat));
      setLngInput(String(safe.lng));

      onChange({
        lat: safe.lat,
        lng: safe.lng,
        radiusMeters: clampRadiusMeters(radiusInput),
        label: reverseGeocodeLabel(safe.lat, safe.lng),
      });
    } catch {
      // ignore
    } finally {
      setGeoBusy(false);
    }
  };

  const containerClassName = viewOnly
    ? cn("h-full w-full", className)
    : cn("rounded-2xl bg-(--surface) p-3 sm:p-4", className);

  return (
    <div className={containerClassName}>
      {!viewOnly ? (
        <div className={cn("mb-3 space-y-3", ar ? "text-right" : "text-left")}>
          <div>
            <div className="text-sm font-semibold">{ar ? "الموقع" : "Location"}</div>
            <div className="mt-1 text-xs text-(--muted-foreground)">
              {ar ? "استخدم تحديد موقعي أو أدخل الإحداثيات. الخريطة أدناه من OpenStreetMap." : "Use My Location or enter coordinates. The map below is OpenStreetMap."}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-(--muted-foreground)">
              <span>{ar ? "خط العرض" : "Latitude"}</span>
              <input
                type="number"
                step="0.000001"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                disabled={disabled}
                className="w-full rounded-xl bg-(--background) px-3 py-2 text-sm text-(--foreground) outline-none ring-1 ring-(--surface-border) focus:ring-accent/35 disabled:opacity-60"
              />
            </label>

            <label className="space-y-1 text-xs text-(--muted-foreground)">
              <span>{ar ? "خط الطول" : "Longitude"}</span>
              <input
                type="number"
                step="0.000001"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                disabled={disabled}
                className="w-full rounded-xl bg-(--background) px-3 py-2 text-sm text-(--foreground) outline-none ring-1 ring-(--surface-border) focus:ring-accent/35 disabled:opacity-60"
              />
            </label>
          </div>

          {!hideRadius ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-(--muted-foreground)">
                <span>{ar ? "النطاق" : "Range"}</span>
                <span>{clampRadiusMeters(radiusInput)} m</span>
              </div>
              <input
                type="range"
                min={MIN_RADIUS_METERS}
                max={MAX_RADIUS_METERS}
                step={25}
                value={clampRadiusMeters(radiusInput)}
                onChange={(e) => setRadiusInput(e.target.value)}
                disabled={disabled}
                className="w-full accent-accent"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={useMyLocation} disabled={!!disabled || geoBusy}>
              {geoBusy ? "..." : ar ? "موقعي" : "My location"}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={applyManualLocation} disabled={!!disabled}>
              {ar ? "تحديث" : "Update"}
            </Button>
            <a
              href={openStreetHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              {ar ? "فتح في OpenStreetMap" : "Open in OpenStreetMap"}
            </a>
            <Button type="button" size="sm" variant="ghost" disabled={!!disabled || !value} onClick={() => onChange(null)}>
              {ar ? "مسح" : "Clear"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className={cn("overflow-hidden rounded-2xl ring-1 ring-(--surface-border)", viewOnly ? "h-full" : "h-[320px]") }>
        <iframe
          title={ar ? "خريطة OpenStreetMap" : "OpenStreetMap"}
          src={embedSrc}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
