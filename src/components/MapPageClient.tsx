"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import type { Business } from "@/lib/db/types";
import type {
  DivIcon as LeafletDivIcon,
  GeoJSON as LeafletGeoJSON,
  GeoJSONOptions as LeafletGeoJSONOptions,
  Icon as LeafletIcon,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";
import { attachMapResizeStabilizer } from "@/components/maps/mapResize";
import {
  buildOmanTileWarmupUrls,
  isWithinOmanBounds,
  OMAN_BOUNDS,
  OMAN_BOUNDS_TUPLE,
  OMAN_CITY_ZOOM,
  OMAN_DEFAULT_CENTER,
  OMAN_DETAIL_ZOOM,
  OMAN_MAX_ZOOM,
  OMAN_MIN_ZOOM,
  OMAN_TILE_LAYER_OPTIONS,
  OMAN_TILE_TEMPLATE,
} from "@/lib/maps/oman";

type MarkerClusterGroupOptions = {
  maxClusterRadius?: number;
  spiderfyOnMaxZoom?: boolean;
  showCoverageOnHover?: boolean;
  zoomToBoundsOnClick?: boolean;
  disableClusteringAtZoom?: number;
  animate?: boolean;
  animateAddingMarkers?: boolean;
  iconCreateFunction?: (cluster: { getChildCount(): number }) => LeafletDivIcon;
};

type MarkerClusterFactory = (options?: MarkerClusterGroupOptions) => import("leaflet").LayerGroup;

type ClusterGroup = import("leaflet").LayerGroup & { addLayer(layer: LeafletMarker): unknown };

type Props = { locale: Locale };
const TILE_WARMUP_DEBOUNCE_MS = 180;

type GeoJsonRing = [number, number][];
type GeoJsonPolygon = GeoJsonRing[];
type OmanBorderGeometry =
  | { type: "Polygon"; coordinates: GeoJsonPolygon }
  | { type: "MultiPolygon"; coordinates: GeoJsonPolygon[] };
type OmanBorderFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties?: Record<string, unknown>;
    geometry: OmanBorderGeometry;
  }>;
};

/* ── Zoom-based marker sizing ──────────────────────────────── */
const MARKER_SIZE_BY_ZOOM: Record<number, number> = {
  1: 10, 2: 12, 3: 14, 4: 16, 5: 18,
  6: 20, 7: 22, 8: 24, 9: 26, 10: 28,
  11: 30, 12: 34, 13: 36, 14: 38, 15: 40, 16: 42, 17: 44, 18: 46, 19: 48,
};

function markerSizeForZoom(zoom: number): number {
  if (zoom <= 1) return MARKER_SIZE_BY_ZOOM[1];
  if (zoom >= 19) return MARKER_SIZE_BY_ZOOM[19];
  const lo = Math.floor(zoom);
  const hi = Math.ceil(zoom);
  if (lo === hi) return MARKER_SIZE_BY_ZOOM[lo];
  const t = zoom - lo;
  return Math.round(MARKER_SIZE_BY_ZOOM[lo] * (1 - t) + MARKER_SIZE_BY_ZOOM[hi] * t);
}

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

function toMaskGeometry(geometry: OmanBorderGeometry) {
  const worldRing: GeoJsonRing = [
    [-180, -90],
    [180, -90],
    [180, 90],
    [-180, 90],
    [-180, -90],
  ];

  const holes =
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((polygon) => polygon[0]);

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [worldRing, ...holes],
    },
  };
}

export default function MapPageClient({ locale }: Props) {
  const searchParams = useSearchParams();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markerIconsRef = useRef<Map<string, LeafletIcon | LeafletDivIcon>>(new Map());
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const clusterGroupRef = useRef<ClusterGroup | null>(null);
  const clusterPluginLoadRef = useRef<Promise<void> | null>(null);
  const sharedLocationMarkerRef = useRef<LeafletMarker | null>(null);
  const omanBorderLayerRef = useRef<LeafletGeoJSON | null>(null);
  const omanMaskLayerRef = useRef<LeafletGeoJSON | null>(null);
  const listItemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const lastActiveIdRef = useRef<string | null>(null);
  const pendingTransitionRef = useRef<number | null>(null);
  const tileWarmupTimeoutRef = useRef<number | null>(null);
  const transitionVersionRef = useRef(0);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [clusterPluginReady, setClusterPluginReady] = useState(false);
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

  const requestTileWarmup = useCallback(async () => {
    const map = mapInstanceRef.current;
    if (!map || typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const bounds = map.getBounds();
    const urls = buildOmanTileWarmupUrls({
      south: Math.max(bounds.getSouth(), OMAN_BOUNDS.south),
      west: Math.max(bounds.getWest(), OMAN_BOUNDS.west),
      north: Math.min(bounds.getNorth(), OMAN_BOUNDS.north),
      east: Math.min(bounds.getEast(), OMAN_BOUNDS.east),
      zooms: [Math.round(map.getZoom()), Math.round(map.getZoom()) + 1],
      devicePixelRatio: window.devicePixelRatio,
    });

    if (urls.length === 0) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const worker = registration?.active ?? navigator.serviceWorker.controller;
      worker?.postMessage({ type: "SBC_MAP_WARM_TILES", urls });
    } catch {
      // Ignore service worker races. Runtime tile caching still works once active.
    }
  }, []);

  const scheduleTileWarmup = useCallback(() => {
    if (typeof window === "undefined") return;
    if (tileWarmupTimeoutRef.current !== null) {
      window.clearTimeout(tileWarmupTimeoutRef.current);
    }
    tileWarmupTimeoutRef.current = window.setTimeout(() => {
      tileWarmupTimeoutRef.current = null;
      void requestTileWarmup();
    }, TILE_WARMUP_DEBOUNCE_MS);
  }, [requestTileWarmup]);

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

    /**
     * Wait until the map container has non-zero dimensions.
     * On mobile the layout may not have settled yet when the effect first runs
     * (address-bar animation, font swap, etc.), which causes Leaflet to create
     * a 0×0 map that never renders tiles.
     */
    const waitForSize = (el: HTMLElement): Promise<void> => {
      if (el.clientWidth > 0 && el.clientHeight > 0) return Promise.resolve();

      return new Promise<void>((resolve) => {
        // Use ResizeObserver with a timeout fallback so we never hang forever.
        const fallback = setTimeout(() => {
          obs?.disconnect();
          resolve();              // proceed anyway — resize stabilizer will fix it
        }, 2000);

        const obs = new ResizeObserver(() => {
          if (el.clientWidth > 0 && el.clientHeight > 0) {
            clearTimeout(fallback);
            obs.disconnect();
            resolve();
          }
        });
        obs.observe(el);
      });
    };

    const init = async () => {
      // Ensure the container is laid-out before we hand it to Leaflet.
      await waitForSize(mapRef.current!);
      if (!mounted || !mapRef.current) return;

      const leaflet = await import("leaflet");
      const L = leaflet;

      if (!mounted || !mapRef.current) return;
      leafletRef.current = leaflet;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current.clear();
        clusterGroupRef.current = null;
        sharedLocationMarkerRef.current = null;
        omanBorderLayerRef.current = null;
        omanMaskLayerRef.current = null;
        markerIconsRef.current.clear();
      }

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
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        zoomAnimation: true,
        fadeAnimation: false,
        markerZoomAnimation: true,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        worldCopyJump: false,
      });

      L.tileLayer(OMAN_TILE_TEMPLATE, { ...OMAN_TILE_LAYER_OPTIONS }).addTo(map);

      const maskPane = map.createPane("oman-mask-pane");
      maskPane.style.zIndex = "350";
      maskPane.style.pointerEvents = "none";

      const borderPane = map.createPane("oman-border-pane");
      borderPane.style.zIndex = "360";
      borderPane.style.pointerEvents = "none";

      mapInstanceRef.current = map;
      setMapReady(true);
      scheduleTileWarmup();
    };

    init();

    const markers = markersRef.current;
    const markerIcons = markerIconsRef.current;

    return () => {
      mounted = false;
      if (tileWarmupTimeoutRef.current !== null) {
        window.clearTimeout(tileWarmupTimeoutRef.current);
        tileWarmupTimeoutRef.current = null;
      }
      setMapReady(false);
      setClusterPluginReady(false);
      clusterPluginLoadRef.current = null;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markers.clear();
      clusterGroupRef.current = null;
      sharedLocationMarkerRef.current = null;
      omanBorderLayerRef.current = null;
      omanMaskLayerRef.current = null;
      markerIcons.clear();
    };
  }, [scheduleTileWarmup]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const leaflet = leafletRef.current;
    if (!mapReady || !map || !leaflet) return;

    let cancelled = false;

    void fetch("/geo/oman-border.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load Oman border");
        return response.json() as Promise<OmanBorderFeatureCollection>;
      })
      .then((geojson) => {
        if (cancelled) return;
        const feature = geojson.features[0];
        if (!feature?.geometry) return;

        omanMaskLayerRef.current?.remove();
        omanBorderLayerRef.current?.remove();

        const maskOptions: LeafletGeoJSONOptions = {
          pane: "oman-mask-pane",
          interactive: false,
          style: {
            stroke: false,
            fillColor: "#f5f7fa",
            fillOpacity: 1,
          },
        };

        const borderFeature = {
          type: "Feature" as const,
          properties: feature.properties ?? {},
          geometry: feature.geometry,
        };

        const borderOptions: LeafletGeoJSONOptions = {
          pane: "oman-border-pane",
          interactive: false,
          style: {
            color: "#0ea5e9",
            weight: 1.8,
            opacity: 0.95,
            fillOpacity: 0,
            lineCap: "round",
            lineJoin: "round",
          },
        };

        const maskLayer = leaflet.geoJSON(toMaskGeometry(feature.geometry), maskOptions);
        const borderLayer = leaflet.geoJSON(borderFeature, borderOptions);

        maskLayer.addTo(map);
        borderLayer.addTo(map);
        omanMaskLayerRef.current = maskLayer;
        omanBorderLayerRef.current = borderLayer;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      omanMaskLayerRef.current?.remove();
      omanBorderLayerRef.current?.remove();
      omanMaskLayerRef.current = null;
      omanBorderLayerRef.current = null;
    };
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    if (mappableBusinesses.length <= 1) return;
    if (clusterPluginReady) return;

    let cancelled = false;

    if (!clusterPluginLoadRef.current) {
      clusterPluginLoadRef.current = (async () => {
        // @ts-expect-error -- CSS dynamic import handled by Next.js bundler
        await import("leaflet.markercluster/dist/MarkerCluster.css");
        // @ts-expect-error -- CSS dynamic import handled by Next.js bundler
        await import("leaflet.markercluster/dist/MarkerCluster.Default.css");
        await import("leaflet.markercluster");
      })();
    }

    void clusterPluginLoadRef.current
      .then(() => {
        if (!cancelled) setClusterPluginReady(true);
      })
      .catch(() => {
        clusterPluginLoadRef.current = null;
      });

    return () => {
      cancelled = true;
    };
  }, [mapReady, mappableBusinesses.length, clusterPluginReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapReady || !map) return;

    return attachMapResizeStabilizer(map);
  }, [mapReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapReady || !map) return;

    scheduleTileWarmup();
    map.on("moveend", scheduleTileWarmup);
    map.on("zoomend", scheduleTileWarmup);

    return () => {
      map.off("moveend", scheduleTileWarmup);
      map.off("zoomend", scheduleTileWarmup);
      if (tileWarmupTimeoutRef.current !== null) {
        window.clearTimeout(tileWarmupTimeoutRef.current);
        tileWarmupTimeoutRef.current = null;
      }
    };
  }, [mapReady, scheduleTileWarmup]);

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

  /* ── Helper: build a div-icon at a given pixel size ──── */
  const buildBusinessIcon = useCallback(
    (L: typeof import("leaflet"), src: string, size: number): LeafletDivIcon => {
      const safeSrc = escapeHtml(src).replaceAll('"', "&quot;");
      return L.divIcon({
        className: "map-business-marker",
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
        html: `<img src="${safeSrc}" alt="" style="width:${size}px;height:${size}px;object-fit:contain;display:block;" onerror="this.onerror=null;this.src='/images/sbc.svg'" />`,
      });
    },
    [],
  );

  /* ── Re-scale all markers when the zoom level changes ── */
  const rescaleMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const size = markerSizeForZoom(map.getZoom());

    markersRef.current.forEach((marker) => {
      const src =
        (marker.options as Record<string, string>).__logoSrc || "/images/sbc.svg";
      marker.setIcon(buildBusinessIcon(L, src, size));
    });
  }, [buildBusinessIcon]);

  // update markers when businesses change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet) return;
    const L = leaflet;

    // remove previous cluster group / markers
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    markerIconsRef.current.clear();

    /* ── Try to create cluster group (graceful fallback) ── */
    const mcgFactory = (L as unknown as { markerClusterGroup?: MarkerClusterFactory }).markerClusterGroup;
    let clusterGroup: ClusterGroup | null = null;

    if (clusterPluginReady && typeof mcgFactory === "function") {
      try {
        clusterGroup = mcgFactory({
          maxClusterRadius: 45,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          disableClusteringAtZoom: 17,
          animate: true,
          animateAddingMarkers: false,
          iconCreateFunction: (cluster: { getChildCount: () => number }) => {
            const count = cluster.getChildCount();
            let sizeClass = "map-cluster-small";
            if (count >= 50) sizeClass = "map-cluster-large";
            else if (count >= 10) sizeClass = "map-cluster-medium";

            return L.divIcon({
              html: `<div class="map-cluster-inner"><span>${count}</span></div>`,
              className: `map-cluster ${sizeClass}`,
              iconSize: L.point(44, 44),
            });
          },
        }) as ClusterGroup;
        clusterGroupRef.current = clusterGroup;
      } catch {
        clusterGroup = null;
      }
    }

    const currentZoom = map.getZoom();
    const iconSize = markerSizeForZoom(currentZoom);
    const points: [number, number][] = [];

    for (const business of mappableBusinesses) {
      const { latitude, longitude } = business;
      if (typeof latitude !== "number" || typeof longitude !== "number") continue;

      const markerSrc = (business.media?.logo || "").trim() || "/images/sbc.svg";
      const markerIcon = buildBusinessIcon(L, markerSrc, iconSize);

      const marker = L.marker([latitude, longitude], { icon: markerIcon });
      // store logo src for zoom rescaling
      (marker.options as Record<string, unknown>).__logoSrc = markerSrc;

      const name = locale === "ar" ? business.name.ar : business.name.en;
      const href = business.username
        ? `/${locale}/@${business.username}`
        : `/${locale}/businesses/${business.slug}`;

      const logo = markerSrc;
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

      if (clusterGroup) {
        clusterGroup.addLayer(marker);
      } else {
        marker.addTo(map);
      }
      points.push([latitude, longitude]);
    }

    if (clusterGroup) {
      map.addLayer(clusterGroup);
    }

    /* ── Listen for zoom changes to rescale markers ──────── */
    map.on("zoomend", rescaleMarkers);

    if (sharedLocation) {
      map.setView([sharedLocation.lat, sharedLocation.lng], OMAN_DETAIL_ZOOM);
    } else if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds.pad(0.12), {
        animate: false,
        maxZoom: OMAN_CITY_ZOOM,
        padding: [24, 24],
      });
    } else {
      map.fitBounds(L.latLngBounds(OMAN_BOUNDS_TUPLE), {
        animate: false,
        maxZoom: OMAN_CITY_ZOOM,
        padding: [24, 24],
      });
    }

    return () => {
      map.off("zoomend", rescaleMarkers);
    };
  }, [mappableBusinesses, locale, mapReady, sharedLocation, buildBusinessIcon, rescaleMarkers, clusterPluginReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const leaflet = leafletRef.current;
    if (!map || !leaflet) return;

    if (sharedLocationMarkerRef.current) {
      sharedLocationMarkerRef.current.remove();
      sharedLocationMarkerRef.current = null;
    }

    if (!sharedLocation) return;

    const L = leaflet;
    const markerIcon = L.divIcon({
      className: "map-shared-location-marker",
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -34],
      html: '<div class="map-shared-location-marker__inner"><img src="/images/sbc.svg" alt="SBC marker" /></div>',
    });

    const marker = L.marker([sharedLocation.lat, sharedLocation.lng], { icon: markerIcon }).addTo(map);
    marker.bindPopup(locale === "ar" ? "الموقع المُشارك" : "Shared location");
    marker.openPopup();
    sharedLocationMarkerRef.current = marker;

    map.flyTo([sharedLocation.lat, sharedLocation.lng], OMAN_DETAIL_ZOOM, {
      animate: true,
      duration: 1,
      easeLinearity: 0.25,
    });
  }, [mapReady, sharedLocation, locale, mappableBusinesses.length]);

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

        map.flyTo([latitude, longitude], OMAN_DETAIL_ZOOM, {
          animate: true,
          duration: 1,
          easeLinearity: 0.25,
        });

        openTargetMarker();
      }, 720);
    } else {
      map.flyTo([latitude, longitude], OMAN_DETAIL_ZOOM, {
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
      <div ref={mapRef} className="fixed inset-0 z-0" style={{ willChange: "transform" }} />
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
                  <path fillRule="evenodd" d="M8.5 3a5.5 5.5 0 014.376 8.83l3.647 3.647a.75.75 0 11-1.06 1.06l-3.647-3.646A5.5 5.5 0 118.5 3zm-4 5.5a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd" />
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
              <div className="mt-6 text-sm text-(--muted-foreground)">
                {locale === "ar" ? "لا توجد نتائج مطابقة للبحث" : "No matching results"}
              </div>
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
