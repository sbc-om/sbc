"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { Business } from "@/lib/db/types";
import Link from "next/link";
import type { Icon as LeafletIcon, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type Props = { locale: Locale };

const DEFAULT_CENTER = { lat: 23.588, lng: 58.3829 };

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
    const arabicPart = (category.match(/[\u0600-\u06FF\s]+/g) || [])
      .join(" ")
      .trim();
    const latinPart = (category.match(/[A-Za-z0-9&\-\s]+/g) || [])
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (locale === "ar" && arabicPart) return arabicPart;
    if (locale === "en" && latinPart) return latinPart;
  }

  return category;
}

export default function MapPageClient({ locale }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markerIconRef = useRef<LeafletIcon | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const listItemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const lastActiveIdRef = useRef<string | null>(null);
  const pendingTransitionRef = useRef<number | null>(null);
  const transitionVersionRef = useRef(0);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

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

      markerIconRef.current = L.icon({
        iconUrl: "/images/sbc.svg",
        iconSize: [34, 34],
        iconAnchor: [17, 30],
        popupAnchor: [0, -26],
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
    return () => {
      if (pendingTransitionRef.current !== null) {
        window.clearTimeout(pendingTransitionRef.current);
      }
    };
  }, []);

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

      const marker = L.marker(
        [latitude, longitude],
        markerIconRef.current ? { icon: markerIconRef.current } : undefined,
      ).addTo(map);
      const name = locale === "ar" ? business.name.ar : business.name.en;
      const href = business.username
        ? `/${locale}/@${business.username}`
        : `/${locale}/businesses/${business.slug}`;

      const logo = business.media?.logo || business.media?.cover || business.media?.banner;
      const categoryLabel = localizedCategory(business.category, locale);
      const details = [
        business.city ? `${locale === "ar" ? "المدينة" : "City"}: ${business.city}` : null,
        categoryLabel ? `${locale === "ar" ? "التصنيف" : "Category"}: ${categoryLabel}` : null,
        business.address ? `${locale === "ar" ? "العنوان" : "Address"}: ${business.address}` : null,
        business.phone ? `${locale === "ar" ? "الهاتف" : "Phone"}: ${business.phone}` : null,
      ].filter(Boolean) as string[];

      const popupHtml = `
        <div style="min-width:220px;max-width:260px;display:flex;gap:10px;align-items:flex-start;">
          ${logo ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(name)}" style="width:42px;height:42px;border-radius:10px;object-fit:cover;flex-shrink:0;" />` : ""}
          <div style="min-width:0;">
            <div style="font-weight:700;line-height:1.3;">${escapeHtml(name)}</div>
            ${details.slice(0, 3).map((line) => `<div style="font-size:12px;opacity:.85;line-height:1.35;margin-top:2px;">${escapeHtml(line)}</div>`).join("")}
            <a href="${escapeHtml(href)}" style="display:inline-block;margin-top:8px;font-size:12px;text-decoration:underline;">${locale === "ar" ? "عرض التفاصيل" : "View details"}</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });
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
    const latitude = business.latitude;
    const longitude = business.longitude;

    const map = mapInstanceRef.current;
    if (!map) return;

    const previousActiveId = lastActiveIdRef.current;
    const isSwitchingBusiness = !!previousActiveId && previousActiveId !== activeId;
    const transitionVersion = transitionVersionRef.current + 1;
    transitionVersionRef.current = transitionVersion;

    if (pendingTransitionRef.current !== null) {
      window.clearTimeout(pendingTransitionRef.current);
      pendingTransitionRef.current = null;
    }

    const openTargetMarker = () => {
      if (transitionVersionRef.current !== transitionVersion) return;
      const marker = markersRef.current.get(activeId);
      if (marker) marker.openPopup();
      lastActiveIdRef.current = activeId;
    };

    if (isSwitchingBusiness) {
      map.flyTo(map.getCenter(), 11, {
        animate: true,
        duration: 0.7,
        easeLinearity: 0.25,
      });

      pendingTransitionRef.current = window.setTimeout(() => {
        if (transitionVersionRef.current !== transitionVersion) return;

        map.flyTo([latitude, longitude], 16, {
          animate: true,
          duration: 1,
          easeLinearity: 0.25,
        });

        openTargetMarker();
      }, 720);
    } else {
      map.flyTo([latitude, longitude], 16, {
        animate: true,
        duration: 1,
        easeLinearity: 0.25,
      });

      openTargetMarker();
    }

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
            className="rounded-xl border border-(--surface-border) bg-(--surface)/95 px-4 py-2 text-sm font-medium shadow-(--shadow) backdrop-blur-md"
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
          className={`pointer-events-auto h-[calc(100dvh-9rem)] min-h-[30rem] w-full max-w-[18rem] flex-col overflow-hidden rounded-2xl border border-(--surface-border) bg-(--surface)/95 shadow-(--shadow) backdrop-blur-md ${
            isListOpen ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="border-b border-(--surface-border) px-4 py-3">
            <h2 className="text-lg font-semibold">{locale === "ar" ? "الأنشطة التجارية" : "Businesses"}</h2>
            <p className="text-xs text-(--muted-foreground)">
              {locale === "ar"
                ? `${mappableBusinesses.length} موقع على الخريطة`
                : `${mappableBusinesses.length} locations on map`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="mt-4 px-1">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</div>
            ) : mappableBusinesses.length === 0 ? (
              <div className="mt-6 text-sm text-(--muted-foreground)">{locale === "ar" ? "لم يتم العثور على أنشطة تجارية" : "No businesses found"}</div>
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
                    <div className="mt-2 flex gap-2">
                      <Link
                        href={
                          business.username
                            ? `/${locale}/@${business.username}`
                            : `/${locale}/businesses/${business.slug}`
                        }
                        className="text-sm text-primary underline"
                      >
                        {locale === "ar" ? "عرض" : "View"}
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
