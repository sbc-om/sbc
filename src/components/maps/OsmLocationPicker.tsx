"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  CircleMarker,
} from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";

import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type OsmLocationValue = {
  lat: number;
  lng: number;
  radiusMeters: number;
  label?: string;
};

function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const compute = () => setIsDark(root.classList.contains("dark"));
    compute();

    const obs = new MutationObserver(() => compute());
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // Nominatim usage note: keep requests minimal; one per click is ok.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    String(lat)
  )}&lon=${encodeURIComponent(String(lng))}`;

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

async function searchPlaces(q: string): Promise<Array<{ label: string; lat: number; lng: number }>> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const json = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return json
    .map((r) => ({
      label: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
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
}) {
  const ar = locale === "ar";
  const rtl = ar;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);

  const isDark = useIsDarkMode();

  const [localRadius, setLocalRadius] = useState(String(value?.radiusMeters ?? 250));

  useEffect(() => {
    setLocalRadius(String(value?.radiusMeters ?? 250));
  }, [value?.radiusMeters]);

  const center = useMemo(() => {
    if (value) return { lat: value.lat, lng: value.lng };
    // Default: Muscat-ish (since repo says sbc-om)
    return { lat: 23.588, lng: 58.3829 };
  }, [value]);

  const radiusMeters = useMemo(() => {
    const n = Math.trunc(Number(localRadius));
    if (!Number.isFinite(n)) return 250;
    return Math.min(20000, Math.max(25, n));
  }, [localRadius]);

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const r = await searchPlaces(query.trim());
          setResults(r);
        } finally {
          setSearching(false);
        }
      })();
    }, 350);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function pick(lat: number, lng: number) {
    if (disabled) return;
    let label: string | undefined;
    try {
      const name = await reverseGeocode(lat, lng);
      if (name) label = name;
    } catch {
      // ignore
    }

    onChange({
      lat,
      lng,
      radiusMeters: value?.radiusMeters ?? 250,
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
    if (!value) return;
    onChange({ ...value, radiusMeters });
  }

  const tiles = useMemo(() => {
    // CARTO tiles are a solid default and have both light/dark variants.
    // Note: attribution is still required; we hide Leaflet's default label and expose it via a minimal info popover.
    return isDark
      ? {
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          label: "CARTO dark",
          attribution:
            'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • Tiles © <a href="https://carto.com/attributions">CARTO</a>',
        }
      : {
          url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          label: "CARTO light",
          attribution:
            'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • Tiles © <a href="https://carto.com/attributions">CARTO</a>',
        };
  }, [isDark]);

  return (
    <div className={cn("rounded-2xl border border-(--surface-border) bg-(--surface) p-4", className)}>
      {!viewOnly && (
        <>
          <div className={cn("flex items-start justify-between gap-3", rtl ? "flex-row-reverse" : "")}>
            <div className={cn(rtl ? "text-right" : "text-left")}>
              <div className="text-sm font-semibold">{ar ? "الموقع على الخريطة" : "Location on map"}</div>
              <div className="mt-1 text-xs text-(--muted-foreground)">
                {hideRadius
                  ? (ar ? "اضغط على الخريطة لاختيار الموقع الدقيق." : "Click the map to choose the exact location.")
                  : (ar
                    ? "اضغط على الخريطة لاختيار الموقع. احفظ نصف القطر لتحديد نطاق الإشعار."
                    : "Click the map to choose the exact spot. Set radius to define the notification range.")}
              </div>
            </div>

            <div className={cn("flex items-center gap-2", rtl ? "flex-row-reverse" : "")}>
              <Button type="button" variant="secondary" size="sm" disabled={!!disabled || geoBusy} onClick={useMyLocation}>
                {geoBusy ? (ar ? "…" : "…") : ar ? "موقعي" : "My location"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!!disabled || !value}
                onClick={() => onChange(null)}
              >
                {ar ? "مسح" : "Clear"}
              </Button>
            </div>
          </div>

          <div className="mt-4 grid sm:grid-cols-[1fr_auto] sm:items-center">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ar ? "ابحث عن مكان…" : "Search a place…"}
              disabled={disabled}
              className="w-full"
            />
            <div className="text-xs text-(--muted-foreground)">{searching ? (ar ? "بحث…" : "Searching…") : ""}</div>
          </div>

          {results.length ? (
            <div className="mt-3 grid gap-2">
              {results.map((r) => (
                <button
                  key={`${r.lat},${r.lng}`}
                  type="button"
                  className={cn(
                    "rounded-xl border border-(--surface-border) bg-(--surface) px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5",
                    rtl ? "text-right" : "text-left"
                  )}
                  onClick={() => {
                    setQuery(r.label);
                    setResults([]);
                    void pick(r.lat, r.lng);
                  }}
                  disabled={disabled}
                >
                  <div className="line-clamp-2">{r.label}</div>
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}

      <div className={cn("relative overflow-hidden rounded-2xl border border-(--surface-border)", !viewOnly && "mt-4")}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={value ? 16 : 12}
          scrollWheelZoom
          attributionControl={false}
          style={{ height: 320, width: "100%" }}
        >
          <TileLayer
            attribution={tiles.attribution}
            url={tiles.url}
            // Force layer remount on theme switch
            key={tiles.url}
          />
          <ClickHandler onPick={pick} />
          <FlyTo lat={center.lat} lng={center.lng} />

          {value ? (
            <>
              <CircleMarker
                center={[value.lat, value.lng]}
                radius={8}
                pathOptions={{ color: "#4f46e5", fillColor: "#4f46e5", fillOpacity: 0.85 }}
              />
              {!hideRadius && (
                <Circle
                  center={[value.lat, value.lng]}
                  radius={value.radiusMeters}
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
            <div className="mt-4 space-y-2">
              <div className={cn("flex items-center gap-2 flex-wrap", rtl ? "flex-row-reverse" : "")}>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs font-medium text-(--muted-foreground) shrink-0">
                    {ar ? "المنطقة (متر)" : "Range (meters)"}
                  </label>
                  <div className="flex h-10 flex-1 sm:flex-initial">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={25}
                      max={20000}
                      value={localRadius}
                      onChange={(e) => setLocalRadius(e.target.value)}
                      disabled={disabled || !value}
                      className={cn("w-20 sm:w-20 flex-1 sm:flex-initial h-full", rtl ? "rounded-l-none border-l-0" : "rounded-r-none border-r-0")}
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      disabled={disabled || !value} 
                      onClick={applyRadius}
                      className={cn("h-full px-3 shrink-0", rtl ? "rounded-r-none" : "rounded-l-none")}
                    >
                      {ar ? "تطبيق" : "Apply"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <label className="text-xs text-(--muted-foreground) shrink-0">
                    {ar ? "الإحداثيات" : "Coordinates"}
                  </label>
                  <div className="flex-1 flex items-center h-10 rounded-lg border border-(--surface-border) bg-(--surface) px-3">
                    <div className="text-xs font-mono" dir="ltr">
                      {value ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}` : "—"}
                    </div>
                  </div>
                </div>
              </div>

              <div className={cn("text-[11px] text-(--muted-foreground)", rtl ? "text-right" : "text-left")}>
                {ar ? "مقترح: 150–500م للمتجر." : "Tip: 150–500m is a good default for a store."}
              </div>
            </div>
          ) : (
            <div className={cn("mt-4 flex items-center gap-2", rtl ? "flex-row-reverse" : "")}>
              <label className="text-xs text-(--muted-foreground) shrink-0">
                {ar ? "الإحداثيات" : "Coordinates"}
              </label>
              <div className="flex-1 flex items-center h-10 rounded-lg border border-(--surface-border) bg-(--surface) px-3">
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
