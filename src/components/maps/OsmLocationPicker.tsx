"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
} from "react-leaflet";
import { divIcon } from "leaflet";
import type { LeafletMouseEvent } from "leaflet";
import type { GeoJsonObject } from "geojson";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { attachMapResizeStabilizer } from "@/components/maps/mapResize";
import {
  clampToOmanBounds,
  isWithinOmanBounds,
  OMAN_BOUNDS,
  OMAN_BOUNDS_TUPLE,
  OMAN_CITY_ZOOM,
  OMAN_DARK_TILE_TEMPLATE,
  OMAN_DEFAULT_CENTER,
  OMAN_DETAIL_ZOOM,
  OMAN_MAX_ZOOM,
  OMAN_MIN_ZOOM,
  OMAN_TILE_ATTRIBUTION,
  OMAN_TILE_SUBDOMAINS,
  OMAN_TILE_TEMPLATE,
} from "@/lib/maps/oman";
import {
  getPrimaryOmanGeometry,
  isPointInsideOmanGeometry,
  loadOmanBorderGeoJson,
  OmanBorderFeatureCollection,
  OmanBorderGeometry,
  toMaskGeometry,
} from "@/lib/maps/omanBorder";

export type OsmLocationValue = {
  lat: number;
  lng: number;
  radiusMeters: number;
  label?: string;
};

const MIN_RADIUS_METERS = 25;
const MAX_RADIUS_METERS = 500;
const RADIUS_MARKS = [25, 100, 150, 250, 350, 500] as const;

function clampRadiusMeters(value: unknown): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return 250;
  return Math.min(MAX_RADIUS_METERS, Math.max(MIN_RADIUS_METERS, n));
}

function isValidLatLng(lat: unknown, lng: unknown): boolean {
  const nLat = Number(lat);
  const nLng = Number(lng);
  return Number.isFinite(nLat) && Number.isFinite(nLng) && Math.abs(nLat) <= 90 && Math.abs(nLng) <= 180;
}

function toSafeLatLng(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  if (!isValidLatLng(lat, lng)) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    try {
      const safe = toSafeLatLng(lat, lng);
      if (!safe) return;
      if (!isWithinOmanBounds(safe.lat, safe.lng)) return;

      const maybeLoaded = (map as unknown as { _loaded?: boolean })._loaded;
      if (!maybeLoaded) return;

      const currentZoom = map.getZoom();
      const nextZoom = Number.isFinite(currentZoom) ? Math.max(currentZoom, OMAN_DETAIL_ZOOM) : OMAN_DETAIL_ZOOM;

      const currentCenter = map.getCenter();
      if (!isValidLatLng(currentCenter.lat, currentCenter.lng)) return;

      map.setView([safe.lat, safe.lng], nextZoom, { animate: true });
    } catch {
      // Ignore transient invalid-state errors from Leaflet during hydration/theme remounts.
    }
  }, [lat, lng, map]);
  return null;
}

function InvalidateSizeOnVisible() {
  const map = useMap();

  useEffect(() => attachMapResizeStabilizer(map), [map]);

  return null;
}

function ClickHandler({
  onPick,
  omanGeometry,
}: {
  onPick: (lat: number, lng: number) => void;
  omanGeometry: OmanBorderGeometry | null;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (!isPointInsideOmanGeometry(e.latlng.lat, e.latlng.lng, omanGeometry)) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // Nominatim usage note: keep requests minimal; one per click is ok.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    String(lat)
  )}&lon=${encodeURIComponent(String(lng))}&zoom=18&accept-language=en,ar`;

  const res = await fetch(url, {
    headers: {
      // Some deployments require a UA; browsers block setting User-Agent, so we keep it simple.
      Accept: "application/json",
    },
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { display_name?: string };
  return json.display_name ? String(json.display_name) : null;
}

export function OsmLocationPicker({
  value,
  onChange,
  className,
  disabled,
  locale,
  hideRadius,
  viewOnly,
  markerImageUrl,
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
  const rtl = ar;

  const [geoBusy, setGeoBusy] = useState(false);
  const [omanBorder, setOmanBorder] = useState<OmanBorderFeatureCollection | null>(null);
  const [isDark, setIsDark] = useState(false);

  const [localRadius, setLocalRadius] = useState(String(clampRadiusMeters(value?.radiusMeters)));

  useEffect(() => {
    setLocalRadius(String(clampRadiusMeters(value?.radiusMeters)));
  }, [value?.radiusMeters]);

  useEffect(() => {
    let cancelled = false;

    void loadOmanBorderGeoJson()
      .then((geojson) => {
        if (!cancelled) setOmanBorder(geojson);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(() => {
      syncTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const safeValue = useMemo(() => {
    if (!value) return null;
    const safeCoords = toSafeLatLng(value.lat, value.lng);
    if (!safeCoords) return null;
    const safeRadius = clampRadiusMeters(value.radiusMeters);
    return {
      ...value,
      lat: safeCoords.lat,
      lng: safeCoords.lng,
      radiusMeters: safeRadius,
    };
  }, [value]);

  const center = useMemo(() => {
    if (safeValue) return { lat: safeValue.lat, lng: safeValue.lng };
    return OMAN_DEFAULT_CENTER;
  }, [safeValue]);

  const omanGeometry = useMemo(() => getPrimaryOmanGeometry(omanBorder ?? { type: "FeatureCollection", features: [] }), [omanBorder]);
  const omanMaskFeature = useMemo(
    () => (omanGeometry ? toMaskGeometry(omanGeometry) : null),
    [omanGeometry]
  );

  const radiusMeters = useMemo(() => {
    return clampRadiusMeters(localRadius);
  }, [localRadius]);

  const radiusProgressPercent = useMemo(() => {
    return ((radiusMeters - MIN_RADIUS_METERS) / (MAX_RADIUS_METERS - MIN_RADIUS_METERS)) * 100;
  }, [radiusMeters]);

  async function pick(lat: number, lng: number) {
    if (disabled) return;
    if (omanGeometry && !isPointInsideOmanGeometry(lat, lng, omanGeometry)) return;
    let label: string | undefined;
    try {
      const name = await reverseGeocode(lat, lng);
      if (name) label = name;
    } catch {
      // ignore
    }

    const safeCoords = clampToOmanBounds(lat, lng);
    onChange({
      lat: safeCoords.lat,
      lng: safeCoords.lng,
      radiusMeters: safeValue?.radiusMeters ?? 250,
      label,
    });
  }

  async function useMyLocation() {
    if (disabled) return;
    if (!navigator.geolocation) return;

    setGeoBusy(true);
    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            void pick(pos.coords.latitude, pos.coords.longitude).then(() => resolve());
          },
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 12000 }
        );
      });
    } catch {
      // ignore
    } finally {
      setGeoBusy(false);
    }
  }

  function applyRadius() {
    if (!safeValue) return;
    onChange({ ...safeValue, radiusMeters });
  }

  const containerClassName = viewOnly
    ? cn("w-full h-full", className)
    : cn("rounded-2xl bg-(--surface) p-3 sm:p-4", className);

  const markerIcon = useMemo(() => {
    const imageSrc = markerImageUrl?.trim() || "/images/sbc.svg";
    const safeSrc = imageSrc.replace(/"/g, "&quot;");
    return divIcon({
      className: "sbc-map-logo-marker",
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      html: `<img src="${safeSrc}" alt="marker" style="width:44px;height:44px;object-fit:contain;display:block;" onerror="this.onerror=null;this.src='/images/sbc.svg'" />`,
    });
  }, [markerImageUrl]);

  const mapTileTemplate = isDark ? OMAN_DARK_TILE_TEMPLATE : OMAN_TILE_TEMPLATE;

  return (
    <div className={containerClassName}>
      {!viewOnly && (
        <>
          <div className={cn("flex flex-col gap-3", rtl ? "text-right" : "text-left")}>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{ar ? "الموقع على الخريطة" : "Location on map"}</div>
              <div className="mt-1 max-w-xl text-xs leading-5 text-(--muted-foreground)">
                {hideRadius
                  ? (ar ? "اضغط على الخريطة لاختيار الموقع الدقيق." : "Tap the map to pick a location.")
                  : (ar
                    ? "اضغط على الخريطة أو استخدم موقعك الحالي. حرّك المنزلق لتحديد نطاق الإشعار."
                    : "Tap the map or use your current location. Use the slider to set notification range.")}
              </div>
            </div>

            <div className={cn("flex flex-wrap items-center gap-2", rtl ? "flex-row-reverse justify-start" : "justify-start sm:justify-end")}>
              <Button type="button" variant="secondary" size="sm" disabled={!!disabled || geoBusy} onClick={useMyLocation}>
                {geoBusy ? (ar ? "…" : "…") : ar ? "📍 موقعي" : "📍 My location"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!!disabled || !safeValue}
                onClick={() => onChange(null)}
              >
                {ar ? "مسح" : "Clear"}
              </Button>
            </div>
          </div>
        </>
      )}

      <div
        className={cn(
          "relative overflow-hidden",
          viewOnly ? "h-full rounded-xl" : "rounded-2xl mt-3"
        )}
      >
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? OMAN_DETAIL_ZOOM : OMAN_CITY_ZOOM}
          minZoom={OMAN_MIN_ZOOM}
          maxZoom={OMAN_MAX_ZOOM}
          maxBounds={OMAN_BOUNDS_TUPLE}
          maxBoundsViscosity={1}
          scrollWheelZoom={false}
          attributionControl={false}
          style={{ height: viewOnly ? "100%" : 360, width: "100%" }}
        >
          <TileLayer
            attribution={OMAN_TILE_ATTRIBUTION}
            url={mapTileTemplate}
            subdomains={[...OMAN_TILE_SUBDOMAINS]}
            detectRetina
            keepBuffer={8}
            updateWhenIdle={false}
            updateWhenZooming={false}
            crossOrigin
            noWrap
            bounds={OMAN_BOUNDS_TUPLE}
            key={mapTileTemplate}
          />
          {omanMaskFeature ? (
            <GeoJSON
              data={omanMaskFeature as unknown as GeoJsonObject}
              interactive={false}
              pathOptions={{
                stroke: false,
                fillColor: isDark ? "#0b0d12" : "#f5f7fa",
                fillOpacity: isDark ? 0.95 : 1,
              }}
            />
          ) : null}
          {omanBorder ? (
            <GeoJSON
              data={omanBorder as unknown as GeoJsonObject}
              interactive={false}
              pathOptions={{
                color: isDark ? "#38bdf8" : "#0ea5e9",
                weight: 1.8,
                opacity: 0.95,
                fillOpacity: 0,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          ) : null}
          <InvalidateSizeOnVisible />
          <ClickHandler onPick={pick} omanGeometry={omanGeometry} />
          <FlyTo lat={center.lat} lng={center.lng} />

          {safeValue ? (
            <>
              <Marker
                position={[safeValue.lat, safeValue.lng]}
                icon={markerIcon}
              />
              {!hideRadius && (
                <Circle
                  center={[safeValue.lat, safeValue.lng]}
                  radius={safeValue.radiusMeters}
                  pathOptions={{ color: "#06b6d4", fillColor: "#06b6d4", fillOpacity: 0.12 }}
                />
              )}
            </>
          ) : null}
        </MapContainer>
      </div>

      {!viewOnly && (
        <>
          {!hideRadius ? (
            <div className="mt-3 space-y-2">
              <div className="grid gap-2">
                <div className={cn("flex w-full items-center gap-2", rtl ? "flex-row-reverse" : "")}>
                  <label className="text-xs font-medium text-(--muted-foreground) shrink-0">
                    {ar ? "النطاق" : "Range"}
                  </label>
                  <span className="text-xs font-semibold tabular-nums">{localRadius}m</span>
                </div>

                <div className={cn("flex items-center gap-2 w-full", rtl ? "flex-row-reverse" : "")}>
                  <label className="text-xs text-(--muted-foreground) shrink-0">
                    {ar ? "الإحداثيات" : "Coordinates"}
                  </label>
                  <div className="flex-1 flex items-center h-10 rounded-lg bg-(--surface) px-3">
                    <div className="text-xs font-mono" dir="ltr">
                      {safeValue ? `${safeValue.lat.toFixed(6)}, ${safeValue.lng.toFixed(6)}` : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 space-y-3">
                <div className="relative px-2 pt-2">
                  <div className="pointer-events-none absolute inset-x-2 top-5 h-[3px] rounded-full bg-white/12" />
                  <div
                    className="pointer-events-none absolute left-2 top-5 h-[3px] rounded-full bg-linear-to-r from-accent to-accent-2"
                    style={{ width: `calc(${radiusProgressPercent}% - ${radiusProgressPercent === 0 ? 0 : 2}px)` }}
                  />
                  <div className="pointer-events-none absolute inset-x-2 top-[14px] h-3">
                    {RADIUS_MARKS.map((tick) => {
                      const tickPercent = ((tick - MIN_RADIUS_METERS) / (MAX_RADIUS_METERS - MIN_RADIUS_METERS)) * 100;
                      return (
                        <span
                          key={tick}
                          className={cn(
                            "absolute h-3 w-px -translate-x-1/2 rounded-full bg-white/35",
                            radiusMeters >= tick && "bg-accent"
                          )}
                          style={{ left: `${tickPercent}%` }}
                        />
                      );
                    })}
                  </div>
                  <input
                    type="range"
                    min={MIN_RADIUS_METERS}
                    max={MAX_RADIUS_METERS}
                    step={25}
                    value={localRadius}
                    onChange={(e) => {
                      setLocalRadius(e.target.value);
                      if (safeValue) {
                        onChange({ ...safeValue, radiusMeters: clampRadiusMeters(e.target.value) });
                      }
                    }}
                    disabled={disabled || !safeValue}
                    className="sbc-range relative z-10 w-full disabled:cursor-not-allowed"
                  />
                </div>
                <div className="relative h-4 px-2">
                  {RADIUS_MARKS.map((tick, index) => {
                    const tickPercent = ((tick - MIN_RADIUS_METERS) / (MAX_RADIUS_METERS - MIN_RADIUS_METERS)) * 100;
                    const isFirst = index === 0;
                    const isLast = index === RADIUS_MARKS.length - 1;
                    return (
                      <span
                        key={tick}
                        className={cn(
                          "absolute top-0 text-[10px] tabular-nums text-(--muted-foreground)",
                          isFirst ? "start-0 translate-x-0" : isLast ? "end-0 translate-x-0" : "-translate-x-1/2",
                          radiusMeters === tick && "font-semibold text-foreground"
                        )}
                        style={
                          isFirst
                            ? undefined
                            : isLast
                              ? undefined
                              : { left: `calc(${tickPercent}% + 0.5rem)` }
                        }
                      >
                        {tick}m
                      </span>
                    );
                  })}
                </div>
                <div className={cn("flex justify-center text-[10px] text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
                  <span>{ar ? "المقترح للمتجر: 150–500م" : "Recommended for store alerts: 150–500m"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn("mt-3 flex items-center gap-2", rtl ? "flex-row-reverse" : "")}>
              <label className="text-xs text-(--muted-foreground) shrink-0">
                {ar ? "الإحداثيات" : "Coordinates"}
              </label>
              <div className="flex-1 flex items-center h-10 rounded-lg bg-(--surface) px-3">
                <div className="text-xs font-mono" dir="ltr">
                  {value ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}` : "—"}
                </div>
              </div>
            </div>
          )}

          {value?.label ? (
            <div className={cn("mt-3 text-xs text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
              {value.label}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
