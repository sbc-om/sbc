"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  DivIcon as LeafletDivIcon,
  LayerGroup as LeafletLayerGroup,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";
import type { Locale } from "@/lib/i18n/locales";
import type { Business } from "@/lib/db/types";
import {
  isWithinOmanBounds,
  OMAN_BOUNDS_TUPLE,
  OMAN_CITY_ZOOM,
  OMAN_DEFAULT_CENTER,
  OMAN_DETAIL_ZOOM,
  OMAN_MAX_ZOOM,
  OMAN_MIN_ZOOM,
  OMAN_TILE_LAYER_OPTIONS,
  OMAN_TILE_TEMPLATE,
} from "@/lib/maps/oman";

type Props = { locale: Locale };
const BUSINESS_MARKER_SIZE = 36;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function localizedCategory(category: string | undefined, locale: Locale) {
  if (!category) return "";

  const separators = ["|", " / ", " - ", " • "];
  for (const separator of separators) {
    if (!category.includes(separator)) continue;
    const parts = category
      .split(separator)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return locale === "ar" ? parts[1] : parts[0];
    }
  }

  const hasArabic = /[\u0600-\u06FF]/.test(category);
  const hasLatin = /[A-Za-z]/.test(category);
  if (hasArabic && hasLatin) {
    const arabicPart = (category.match(/[\u0600-\u06FF\s]+/g) || []).join(" ").trim();
    const latinPart = (category.match(/[A-Za-z0-9&\-\s]+/g) || []).join(" ").replace(/\s+/g, " ").trim();

    if (locale === "ar" && arabicPart) return arabicPart;
    if (locale === "en" && latinPart) return latinPart;
  }

  return category;
}

export default function MapPageClient({ locale }: Props) {
  const searchParams = useSearchParams();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markerLayerRef = useRef<LeafletLayerGroup | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const sharedLocationMarkerRef = useRef<LeafletMarker | null>(null);
  const listItemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sharedLocation = useMemo(() => {
    const latRaw = searchParams.get("lat");
    const lngRaw = searchParams.get("lng");
    if (!latRaw || !lngRaw) return null;

    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (!isWithinOmanBounds(lat, lng)) return null;

    return { lat, lng };
  }, [searchParams]);

  const mappableBusinesses = useMemo(
    () =>
      businesses.filter(
        (business) =>
          typeof business.latitude === "number" &&
          typeof business.longitude === "number" &&
          Number.isFinite(business.latitude) &&
          Number.isFinite(business.longitude) &&
          isWithinOmanBounds(business.latitude, business.longitude),
      ),
    [businesses],
  );

  const filteredBusinesses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return mappableBusinesses;

    return mappableBusinesses.filter((business) => {
      const nameAr = business.name.ar?.toLowerCase() ?? "";
      const nameEn = business.name.en?.toLowerCase() ?? "";
      const city = business.city?.toLowerCase() ?? "";
      const category = localizedCategory(business.category, locale).toLowerCase();

      return (
        nameAr.includes(query) ||
        nameEn.includes(query) ||
        city.includes(query) ||
        category.includes(query)
      );
    });
  }, [mappableBusinesses, searchQuery, locale]);

  const buildBusinessIcon = (L: typeof import("leaflet"), src: string): LeafletDivIcon => {
    const iconUrl = escapeHtml(src.trim() || "/images/sbc.svg").replaceAll('"', "&quot;");
    return L.divIcon({
      className: "map-business-logo-icon",
      iconSize: [BUSINESS_MARKER_SIZE, BUSINESS_MARKER_SIZE],
      iconAnchor: [BUSINESS_MARKER_SIZE / 2, BUSINESS_MARKER_SIZE],
      popupAnchor: [0, -BUSINESS_MARKER_SIZE + 8],
      html: `<span class="map-business-logo-icon__inner" style="background-image:url('${iconUrl}'),url('/images/sbc.svg')"></span>`,
    });
  };

  useEffect(() => {
    let mounted = true;

    fetch(`/api/businesses?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data.ok && Array.isArray(data.businesses)) {
          setBusinesses(data.businesses);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [locale]);

  useEffect(() => {
    if (!mapRef.current) return;

    let mounted = true;
    const markers = markersRef.current;

    const init = async () => {
      const L = await import("leaflet");
      if (!mounted || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [OMAN_DEFAULT_CENTER.lat, OMAN_DEFAULT_CENTER.lng],
        zoom: OMAN_CITY_ZOOM,
        minZoom: OMAN_MIN_ZOOM,
        maxZoom: OMAN_MAX_ZOOM,
        maxBounds: L.latLngBounds(OMAN_BOUNDS_TUPLE),
        maxBoundsViscosity: 1,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        zoomAnimation: true,
        markerZoomAnimation: false,
        fadeAnimation: false,
      });

      L.tileLayer(OMAN_TILE_TEMPLATE, { ...OMAN_TILE_LAYER_OPTIONS }).addTo(map);

      const markerLayer = L.layerGroup().addTo(map);

      leafletRef.current = L;
      mapInstanceRef.current = map;
      markerLayerRef.current = markerLayer;
      setMapReady(true);
    };

    void init();

    return () => {
      mounted = false;
      setMapReady(false);
      markers.clear();
      sharedLocationMarkerRef.current = null;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const syncWithViewport = () => {
      setIsListOpen(mediaQuery.matches);
    };

    syncWithViewport();
    mediaQuery.addEventListener("change", syncWithViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncWithViewport);
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !L || !markerLayer || !mapReady) return;

    markerLayer.clearLayers();
    markersRef.current.clear();

    const points: [number, number][] = [];

    for (const business of mappableBusinesses) {
      const { latitude, longitude } = business;
      if (typeof latitude !== "number" || typeof longitude !== "number") continue;
      const markerSrc = (business.media?.logo || "").trim() || "/images/sbc.svg";

      const name = locale === "ar" ? business.name.ar : business.name.en;
      const href = business.username
        ? `/${locale}/@${business.username}`
        : `/${locale}/businesses/${business.slug}`;

      const categoryLabel = localizedCategory(business.category, locale);
      const details = [
        business.city ? `${locale === "ar" ? "المدينة" : "City"}: ${business.city}` : null,
        categoryLabel ? `${locale === "ar" ? "التصنيف" : "Category"}: ${categoryLabel}` : null,
        business.address ? `${locale === "ar" ? "العنوان" : "Address"}: ${business.address}` : null,
      ].filter(Boolean) as string[];

      const popupHtml = `
        <div style="min-width:220px;max-width:260px;display:flex;gap:10px;align-items:flex-start;">
          <div style="min-width:0;">
            <div style="font-weight:700;line-height:1.3;">${escapeHtml(name)}</div>
            ${details.map((line) => `<div style="font-size:12px;opacity:.85;line-height:1.35;margin-top:2px;">${escapeHtml(line)}</div>`).join("")}
            <a href="${escapeHtml(href)}" style="display:inline-block;margin-top:8px;font-size:12px;text-decoration:underline;">${locale === "ar" ? "عرض التفاصيل" : "View details"}</a>
          </div>
        </div>
      `;

      const marker = L.marker([latitude, longitude], { icon: buildBusinessIcon(L, markerSrc) });
      marker.bindPopup(popupHtml, { maxWidth: 280 });
      marker.on("click", () => setActiveId(business.id));
      marker.addTo(markerLayer);

      markersRef.current.set(business.id, marker);
      points.push([latitude, longitude]);
    }

    if (sharedLocation) {
      map.setView([sharedLocation.lat, sharedLocation.lng], OMAN_DETAIL_ZOOM, { animate: false });
    } else if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((point) => L.latLng(point[0], point[1])));
      map.fitBounds(bounds.pad(0.12), { animate: false, maxZoom: OMAN_CITY_ZOOM, padding: [24, 24] });
    } else {
      map.fitBounds(L.latLngBounds(OMAN_BOUNDS_TUPLE), { animate: false, maxZoom: OMAN_CITY_ZOOM, padding: [24, 24] });
    }
  }, [locale, mapReady, mappableBusinesses, sharedLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;

    if (sharedLocationMarkerRef.current) {
      sharedLocationMarkerRef.current.remove();
      sharedLocationMarkerRef.current = null;
    }

    if (!sharedLocation) return;

    const sharedIcon = L.divIcon({
      className: "map-shared-location-marker",
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -34],
      html: '<div class="map-shared-location-marker__inner"><img src="/images/sbc.svg" alt="SBC marker" /></div>',
    });

    const marker = L.marker([sharedLocation.lat, sharedLocation.lng], { icon: sharedIcon }).addTo(map);
    marker.bindPopup(locale === "ar" ? "الموقع المُشارك" : "Shared location");
    marker.openPopup();
    sharedLocationMarkerRef.current = marker;
  }, [locale, mapReady, sharedLocation]);

  useEffect(() => {
    if (!activeId) return;

    const map = mapInstanceRef.current;
    const business = mappableBusinesses.find((item) => item.id === activeId);
    const marker = markersRef.current.get(activeId);
    if (!map || !business || !marker) return;

    map.flyTo([business.latitude, business.longitude], OMAN_DETAIL_ZOOM, {
      animate: true,
      duration: 0.9,
      easeLinearity: 0.25,
    });
    marker.openPopup();

    const listItem = listItemRefs.current.get(activeId);
    listItem?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeId, mappableBusinesses]);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden">
      <div ref={mapRef} className="fixed inset-0 z-0" />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/10" />

      <div className="pointer-events-none relative z-10 px-4 pb-8 pt-24 sm:px-6 sm:pt-28">
        <div className="pointer-events-auto mb-3 md:hidden">
          <button
            type="button"
            onClick={() => setIsListOpen((value) => !value)}
            className="rounded-xl bg-(--surface)/95 px-4 py-2 text-sm font-medium shadow-(--shadow) backdrop-blur-md"
          >
            {isListOpen
              ? locale === "ar"
                ? "إخفاء القائمة"
                : "Hide list"
              : locale === "ar"
                ? "عرض القائمة"
                : "Show list"}
          </button>
        </div>

        <aside
          className={`pointer-events-auto h-[calc(100dvh-9rem)] min-h-[30rem] w-full max-w-[18rem] flex-col overflow-hidden rounded-2xl bg-(--surface)/95 shadow-(--shadow) backdrop-blur-md ${
            isListOpen ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="px-4 py-3">
            <h2 className="text-lg font-semibold">{locale === "ar" ? "الأنشطة التجارية" : "Businesses"}</h2>
            <p className="text-xs text-(--muted-foreground)">
              {searchQuery.trim().length > 0
                ? locale === "ar"
                  ? `${filteredBusinesses.length} من ${mappableBusinesses.length} موقع`
                  : `${filteredBusinesses.length} of ${mappableBusinesses.length} locations`
                : locale === "ar"
                  ? `${mappableBusinesses.length} موقع على الخريطة`
                  : `${mappableBusinesses.length} locations on map`}
            </p>

            <div className="mt-3 relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={locale === "ar" ? "ابحث عن نشاط أو مدينة..." : "Search business or city..."}
                className="w-full rounded-xl bg-background/90 px-10 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-(--accent)/20"
                aria-label={locale === "ar" ? "بحث في الأنشطة" : "Search businesses"}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 flex items-center text-(--muted-foreground)"
                style={locale === "ar" ? { right: "0.75rem" } : { left: "0.75rem" }}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.5 3a5.5 5.5 0 014.376 8.83l3.647 3.647a.75.75 0 11-1.06 1.06l-3.647-3.646A5.5 5.5 0 118.5 3zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="mt-4 px-1">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</div>
            ) : mappableBusinesses.length === 0 ? (
              <div className="mt-6 text-sm text-(--muted-foreground)">{locale === "ar" ? "لم يتم العثور على أنشطة تجارية" : "No businesses found"}</div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="mt-6 text-sm text-(--muted-foreground)">{locale === "ar" ? "لا توجد نتائج مطابقة للبحث" : "No matching results"}</div>
            ) : (
              <ul className="space-y-3">
                {filteredBusinesses.map((business) => (
                  <li
                    key={business.id}
                    ref={(element) => {
                      if (element) {
                        listItemRefs.current.set(business.id, element);
                      } else {
                        listItemRefs.current.delete(business.id);
                      }
                    }}
                    className={`cursor-pointer rounded-lg bg-(--surface)/90 p-3 transition-colors hover:bg-(--chip-bg) ${
                      activeId === business.id ? "ring-2 ring-(--accent)" : ""
                    }`}
                    onClick={() => {
                      setActiveId(business.id);
                      if (window.innerWidth < 768) {
                        setIsListOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const thumbnail = business.media?.logo || business.media?.cover || business.media?.banner;
                        if (thumbnail) {
                          return (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumbnail}
                              alt={locale === "ar" ? business.name.ar : business.name.en}
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          );
                        }

                        return (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--chip-bg) text-sm font-semibold text-(--muted-foreground)">
                            {(locale === "ar" ? business.name.ar : business.name.en).charAt(0).toUpperCase()}
                          </div>
                        );
                      })()}

                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{locale === "ar" ? business.name.ar : business.name.en}</div>
                        <div className="text-xs text-(--muted-foreground)">{business.city || (locale === "ar" ? "بدون شهر" : "No city")}</div>
                      </div>
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
