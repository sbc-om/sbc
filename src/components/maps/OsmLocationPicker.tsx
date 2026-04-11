"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import {
  clampToOmanBounds,
  OMAN_DEFAULT_CENTER,
  OMAN_TILE_TEMPLATE,
  OMAN_TILE_ATTRIBUTION,
  OMAN_TILE_SUBDOMAINS,
  OMAN_DETAIL_ZOOM,
  OMAN_DEFAULT_ZOOM,
  OMAN_MAX_ZOOM,
  OMAN_MIN_ZOOM,
} from "@/lib/maps/oman";

/* ── types ─────────────────────────────────────────────── */

export type OsmLocationValue = {
  lat: number;
  lng: number;
  radiusMeters: number;
  label?: string;
};

/* ── constants ──────────────────────────────────────────── */

const MIN_RADIUS_METERS = 25;
const MAX_RADIUS_METERS = 500;

/* ── helpers ────────────────────────────────────────────── */

function clampRadiusMeters(value: unknown): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return 250;
  return Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, n));
}

function safeCoord(value: unknown, kind: "lat" | "lng") {
  const n = Number(value);
  if (!Number.isFinite(n))
    return kind === "lat" ? OMAN_DEFAULT_CENTER.lat : OMAN_DEFAULT_CENTER.lng;
  if (kind === "lat") return Math.max(-90, Math.min(90, n));
  return Math.max(-180, Math.min(180, n));
}

function reverseGeocodeLabel(lat: number, lng: number) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/* Fix Leaflet default icon paths broken by bundlers */
function makeDefaultIcon() {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" class="sbc-map-pin">
      <defs>
        <filter id="sbc-pin-shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
        </filter>
        <linearGradient id="sbc-pin-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0091ff"/>
          <stop offset="100%" stop-color="#0069d9"/>
        </linearGradient>
      </defs>
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z"
            fill="url(#sbc-pin-grad)" filter="url(#sbc-pin-shadow)"/>
      <circle cx="16" cy="15" r="6.5" fill="#fff"/>
    </svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });
}

function makePulseIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="sbc-map-pulse-marker"><div class="sbc-map-pulse-dot"></div><div class="sbc-map-pulse-ring"></div></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/* ── sub-components ─────────────────────────────────────── */

function MapClickHandler({
  onClick,
  disabled,
}: {
  onClick: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      const safe = clampToOmanBounds(e.latlng.lat, e.latlng.lng);
      onClick(safe.lat, safe.lng);
    },
  });
  return null;
}

function FlyToPosition({
  lat,
  lng,
  zoom,
}: {
  lat: number;
  lng: number;
  zoom?: number;
}) {
  const map = useMap();
  const prevRef = useRef<string>("");
  useEffect(() => {
    const key = `${lat},${lng}`;
    if (key === prevRef.current) return;
    prevRef.current = key;
    map.flyTo([lat, lng], zoom ?? map.getZoom(), { duration: 0.6 });
  }, [lat, lng, zoom, map]);
  return null;
}

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

/* ── main component ─────────────────────────────────────── */

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

  const [latInput, setLatInput] = useState(() =>
    String(value?.lat ?? OMAN_DEFAULT_CENTER.lat),
  );
  const [lngInput, setLngInput] = useState(() =>
    String(value?.lng ?? OMAN_DEFAULT_CENTER.lng),
  );
  const [radiusInput, setRadiusInput] = useState(() => String(safeRadius));
  const [geoBusy, setGeoBusy] = useState(false);

  const defaultIcon = useMemo(() => makeDefaultIcon(), []);
  const geoIcon = useMemo(() => makePulseIcon(), []);

  const center = useMemo(() => {
    if (value) return clampToOmanBounds(value.lat, value.lng);
    return OMAN_DEFAULT_CENTER;
  }, [value]);

  const initialZoom = value ? OMAN_DETAIL_ZOOM : OMAN_DEFAULT_ZOOM;

  /* ── callbacks ──────────────────────────────── */

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (disabled) return;
      const r = clampRadiusMeters(radiusInput);
      setLatInput(String(lat));
      setLngInput(String(lng));
      onChange({
        lat,
        lng,
        radiusMeters: r,
        label: reverseGeocodeLabel(lat, lng),
      });
    },
    [disabled, onChange, radiusInput],
  );

  const handleMarkerDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      if (disabled) return;
      const latlng = (e.target as L.Marker).getLatLng();
      const safe = clampToOmanBounds(latlng.lat, latlng.lng);
      const r = clampRadiusMeters(radiusInput);
      setLatInput(String(safe.lat));
      setLngInput(String(safe.lng));
      onChange({
        lat: safe.lat,
        lng: safe.lng,
        radiusMeters: r,
        label: reverseGeocodeLabel(safe.lat, safe.lng),
      });
    },
    [disabled, onChange, radiusInput],
  );

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

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRadiusInput(v);
    if (value) {
      onChange({
        ...value,
        radiusMeters: clampRadiusMeters(v),
      });
    }
  };

  const useMyLocation = async () => {
    if (disabled || !navigator.geolocation) return;
    setGeoBusy(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12000,
          });
        },
      );
      const safe = clampToOmanBounds(
        position.coords.latitude,
        position.coords.longitude,
      );
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

  /* ── marker event handlers (needs stable ref for react-leaflet) ── */
  const markerEventHandlers = useMemo(
    () => ({ dragend: handleMarkerDragEnd }),
    [handleMarkerDragEnd],
  );

  /* ── render ─────────────────────────────────── */

  const containerClassName = viewOnly
    ? cn("h-full w-full", className)
    : cn("rounded-2xl bg-(--surface) p-3 sm:p-4", className);

  return (
    <div className={containerClassName}>
      {!viewOnly && (
        <div className={cn("mb-3 space-y-3", ar ? "text-right" : "text-left")}>
          <div>
            <div className="text-sm font-semibold">
              {ar ? "الموقع" : "Location"}
            </div>
            <div className="mt-1 text-xs text-(--muted-foreground)">
              {ar
                ? "انقر على الخريطة أو اسحب العلامة. الدائرة الزرقاء تُظهر نطاق الإشعارات."
                : "Click on the map or drag the marker. The blue circle shows the notification range."}
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

          {!hideRadius && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-(--muted-foreground)">
                <span>{ar ? "نطاق الإشعار" : "Notification range"}</span>
                <span className="tabular-nums font-medium text-(--foreground)">
                  {clampRadiusMeters(radiusInput)} m
                </span>
              </div>
              <div className="relative h-[22px]">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--surface-border)" />
                <div
                  className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
                  style={{
                    left: 0,
                    width: `${((clampRadiusMeters(radiusInput) - MIN_RADIUS_METERS) / (MAX_RADIUS_METERS - MIN_RADIUS_METERS)) * 100}%`,
                    background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
                  }}
                />
                <input
                  type="range"
                  min={MIN_RADIUS_METERS}
                  max={MAX_RADIUS_METERS}
                  step={5}
                  value={clampRadiusMeters(radiusInput)}
                  onChange={handleRadiusChange}
                  disabled={disabled}
                  className="sbc-range relative z-10 w-full"
                />
              </div>
              <div className="flex justify-between text-[10px] text-(--muted-foreground)">
                <span>{MIN_RADIUS_METERS}m</span>
                <span>{MAX_RADIUS_METERS}m</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={useMyLocation}
              disabled={!!disabled || geoBusy}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx={12} cy={12} r={3} />
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
              </svg>
              <span className="ms-1.5">
                {geoBusy ? "..." : ar ? "موقعي" : "My location"}
              </span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={applyManualLocation}
              disabled={!!disabled}
            >
              {ar ? "تحديث" : "Update"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!!disabled || !value}
              onClick={() => onChange(null)}
            >
              {ar ? "مسح" : "Clear"}
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-2xl ring-1 ring-(--surface-border)",
          viewOnly ? "h-full" : "h-[420px]",
        )}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={initialZoom}
          minZoom={OMAN_MIN_ZOOM}
          maxZoom={OMAN_MAX_ZOOM}
          scrollWheelZoom
          doubleClickZoom={false}
          zoomControl
          attributionControl
          className="h-full w-full"
          style={{ background: "var(--background)" }}
        >
          <TileLayer
            url={OMAN_TILE_TEMPLATE}
            attribution={OMAN_TILE_ATTRIBUTION}
            subdomains={OMAN_TILE_SUBDOMAINS}
            maxZoom={OMAN_MAX_ZOOM}
            minZoom={OMAN_MIN_ZOOM}
          />
          <InvalidateSizeOnMount />

          {!viewOnly && !disabled && (
            <MapClickHandler onClick={handleMapClick} disabled={disabled} />
          )}

          {value && (
            <FlyToPosition lat={value.lat} lng={value.lng} />
          )}

          {value && !hideRadius && (
            <Circle
              center={[value.lat, value.lng]}
              radius={clampRadiusMeters(value.radiusMeters)}
              pathOptions={{
                color: "var(--accent, #0079f4)",
                fillColor: "var(--accent, #0079f4)",
                fillOpacity: 0.1,
                weight: 2,
                dashArray: "6 4",
              }}
            />
          )}

          {value && (
            viewOnly ? (
              <Marker
                position={[value.lat, value.lng]}
                icon={geoIcon}
              />
            ) : (
              <Marker
                position={[value.lat, value.lng]}
                icon={defaultIcon}
                draggable={!disabled}
                eventHandlers={markerEventHandlers}
              />
            )
          )}
        </MapContainer>
      </div>

      {!viewOnly && value && (
        <div className={cn("mt-2 flex items-center gap-2 text-xs text-(--muted-foreground)", ar ? "flex-row-reverse" : "")}>
          <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 text-accent" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
          </svg>
          <span className="tabular-nums">
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </span>
          {!hideRadius && (
            <>
              <span className="text-(--surface-border)">·</span>
              <span>{clampRadiusMeters(value.radiusMeters)}m {ar ? "نطاق" : "range"}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
