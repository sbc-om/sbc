"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { Business } from "@/lib/db/types";
import Link from "next/link";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type Props = { locale: Locale };

const DEFAULT_CENTER = { lat: 23.588, lng: 58.3829 };

export default function MapPageClient({ locale }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const listItemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mappableBusinesses = useMemo(
    () =>
      businesses.filter(
        (business) =>
          typeof business.latitude === "number" &&
          typeof business.longitude === "number" &&
          Number.isFinite(business.latitude) &&
          Number.isFinite(business.longitude),
      ),
    [businesses],
  );

  useEffect(() => {
    let mounted = true;

    fetch(`/api/businesses?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data.ok && Array.isArray(data.businesses)) setBusinesses(data.businesses);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [locale]);

  useEffect(() => {
    if (!mapRef.current) return;

    let mounted = true;

    const init = async () => {
      const leaflet = await import("leaflet");
      const L = leaflet;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mounted || !mapRef.current) return;
      leafletRef.current = leaflet;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current.clear();
      }

      const map = L.map(mapRef.current, {
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
      setMapReady(true);
    };

    init();

    return () => {
      mounted = false;
      setMapReady(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapReady || !map) return;

    const refresh = () => map.invalidateSize();
    const timer = window.setTimeout(refresh, 120);
    window.addEventListener("resize", refresh);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", refresh);
    };
  }, [mapReady]);

  // update markers when businesses change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet) return;
    const L = leaflet;

    // clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const points: [number, number][] = [];

    for (const business of mappableBusinesses) {
      const { latitude, longitude } = business;
      if (typeof latitude !== "number" || typeof longitude !== "number") continue;

      const marker = L.marker([latitude, longitude]).addTo(map);
      const name = locale === "ar" ? business.name.ar : business.name.en;
      const href = business.username
        ? `/${locale}/@${business.username}`
        : `/${locale}/businesses/${business.slug}`;

      marker.bindPopup(`<div style="min-width:140px"><strong>${name}</strong><br/><a href='${href}'>${locale === "ar" ? "نمایش" : "View"}</a></div>`);
      marker.on("click", () => setActiveId(business.id));

      markersRef.current.set(business.id, marker);
      points.push([latitude, longitude]);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds.pad(0.15));
    }
  }, [mappableBusinesses, locale, mapReady]);

  // focus on active business when selected from list
  useEffect(() => {
    if (!activeId) return;

    const business = mappableBusinesses.find((item) => item.id === activeId);
    if (!business || typeof business.latitude !== "number" || typeof business.longitude !== "number") return;

    const map = mapInstanceRef.current;
    if (!map) return;

    map.setView([business.latitude, business.longitude], 16, { animate: true });

    const marker = markersRef.current.get(activeId);
    if (marker) marker.openPopup();

    const listItem = listItemRefs.current.get(activeId);
    listItem?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeId, mappableBusinesses]);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden">
      <div ref={mapRef} className="fixed inset-0 z-0" />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/10" />

      <div className="pointer-events-none relative z-10 px-4 pb-8 pt-24 sm:px-6 sm:pt-28">
        <aside className="pointer-events-auto flex h-[calc(100dvh-9rem)] min-h-[30rem] w-full max-w-[22rem] flex-col overflow-hidden rounded-2xl border border-(--surface-border) bg-(--surface)/95 shadow-(--shadow) backdrop-blur-md">
          <div className="border-b border-(--surface-border) px-4 py-3">
            <h2 className="text-lg font-semibold">{locale === "ar" ? "بیزینس‌ها" : "Businesses"}</h2>
            <p className="text-xs text-(--muted-foreground)">
              {locale === "ar"
                ? `${mappableBusinesses.length} موقعیت روی نقشه`
                : `${mappableBusinesses.length} locations on map`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="mt-4 px-1">{locale === "ar" ? "در حال بارگذاری..." : "Loading..."}</div>
            ) : mappableBusinesses.length === 0 ? (
              <div className="mt-6 text-sm text-(--muted-foreground)">{locale === "ar" ? "هیچ کسب‌وکاری یافت نشد" : "No businesses found"}</div>
            ) : (
              <ul className="space-y-3">
                {mappableBusinesses.map((business) => (
                  <li
                    key={business.id}
                    ref={(element) => {
                      if (element) {
                        listItemRefs.current.set(business.id, element);
                      } else {
                        listItemRefs.current.delete(business.id);
                      }
                    }}
                    className={`cursor-pointer rounded-lg border border-(--surface-border) bg-(--surface)/90 p-3 transition-colors hover:bg-(--chip-bg) ${
                      activeId === business.id ? "ring-2 ring-(--accent)" : ""
                    }`}
                    onClick={() => setActiveId(business.id)}
                  >
                    <div className="font-medium truncate">{locale === "ar" ? business.name.ar : business.name.en}</div>
                    <div className="text-xs text-(--muted-foreground)">{business.city || (locale === "ar" ? "بدون شهر" : "No city")}</div>
                    <div className="mt-2 flex gap-2">
                      <Link
                        href={
                          business.username
                            ? `/${locale}/@${business.username}`
                            : `/${locale}/businesses/${business.slug}`
                        }
                        className="text-sm text-primary underline"
                      >
                        {locale === "ar" ? "نمایش" : "View"}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
