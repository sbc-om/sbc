"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type L from "leaflet";

type MapViewerProps = {
  lat: number;
  lng: number;
  label?: string;
  locale: string;
};

// Hook to detect dark mode
function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const compute = () => setIsDark(root.classList.contains("dark"));
    compute();

    const obs = new MutationObserver(() => compute());
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

export function MapViewer({ lat, lng, label, locale }: MapViewerProps) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const isDark = useIsDarkMode();
  const ar = locale === "ar";

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    let mounted = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!mounted || !mapRef.current) return;

      // Cleanup existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Tile URL - with labels for better navigation
      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      // Create map
      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

      // Custom marker icon for the location
      const markerIcon = L.divIcon({
        className: "map-viewer-marker",
        html: `
          <div class="relative">
            <svg viewBox="0 0 24 24" fill="none" style="width: 48px; height: 48px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500/30 rounded-full animate-ping"></div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
      });

      L.marker([lat, lng], { icon: markerIcon }).addTo(map);

      mapInstanceRef.current = map;
      setIsLoading(false);

      // Force resize
      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, isDark]);

  // Center on target location
  const handleCenterOnLocation = useCallback(() => {
    mapInstanceRef.current?.setView([lat, lng], 16, { animate: true });
  }, [lat, lng]);

  // Get and show user location
  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current) {
          const L = (await import("leaflet")).default;

          // Add user marker
          const userIcon = L.divIcon({
            className: "user-location-marker",
            html: `
              <div class="relative">
                <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                <div class="absolute inset-0 w-4 h-4 bg-blue-500/50 rounded-full animate-ping"></div>
              </div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          // Remove existing user marker if any
          mapInstanceRef.current.eachLayer((layer) => {
            if ((layer as L.Marker).options?.icon?.options?.className === "user-location-marker") {
              mapInstanceRef.current?.removeLayer(layer);
            }
          });

          L.marker([latitude, longitude], { icon: userIcon }).addTo(mapInstanceRef.current);

          // Fit bounds to show both markers
          const bounds = L.latLngBounds([
            [lat, lng],
            [latitude, longitude],
          ]);
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        }

        setIsLoadingLocation(false);
      },
      () => {
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [lat, lng]);

  // Open directions in external map
  const handleGetDirections = useCallback(() => {
    // Try to detect if user is on mobile for native maps
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open in native maps app
      const iosUrl = `maps://maps.apple.com/?daddr=${lat},${lng}`;
      const androidUrl = `geo:${lat},${lng}?q=${lat},${lng}`;
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = iosUrl;
        setTimeout(() => {
          window.open(fallbackUrl, "_blank");
        }, 500);
      } else {
        window.location.href = androidUrl;
        setTimeout(() => {
          window.open(fallbackUrl, "_blank");
        }, 500);
      }
    } else {
      // Desktop: open Google Maps
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    }
  }, [lat, lng]);

  // Copy coordinates
  const handleCopyCoordinates = useCallback(() => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [lat, lng]);

  // Share location
  const handleShare = useCallback(async () => {
    const shareData = {
      title: ar ? "موقع مشترک" : "Shared Location",
      text: label || (ar ? `موقع: ${lat}, ${lng}` : `Location: ${lat}, ${lng}`),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error
        setShowShareMenu(true);
      }
    } else {
      setShowShareMenu(true);
    }
  }, [lat, lng, label, ar]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);

  return (
    <div className="fixed inset-0 bg-(--background) z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-(--surface) border-b border-(--surface-border) shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 -ms-2 hover:bg-(--chip-bg) rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ar ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">{ar ? "الموقع" : "Location"}</h1>
        <button
          onClick={handleShare}
          className="p-2 -me-2 hover:bg-(--chip-bg) rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-(--chip-bg) z-10">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />

        {/* Zoom controls */}
        <div className="absolute top-4 end-4 flex flex-col gap-1 z-[1000]">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-(--surface) rounded-xl shadow-lg hover:bg-(--chip-bg) transition-colors flex items-center justify-center text-xl font-bold"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-(--surface) rounded-xl shadow-lg hover:bg-(--chip-bg) transition-colors flex items-center justify-center text-xl font-bold"
          >
            −
          </button>
        </div>

        {/* Center on location button */}
        <button
          onClick={handleCenterOnLocation}
          className="absolute top-4 start-4 p-2.5 bg-(--surface) rounded-xl shadow-lg hover:bg-(--chip-bg) transition-colors z-[1000]"
          title={ar ? "المرکز على الموقع" : "Center on location"}
        >
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </button>

        {/* My location button */}
        <button
          onClick={handleMyLocation}
          disabled={isLoadingLocation}
          className="absolute bottom-28 end-4 p-3 bg-(--surface) rounded-full shadow-lg hover:bg-(--chip-bg) transition-colors z-[1000] disabled:opacity-50"
          title={ar ? "موقعي" : "My location"}
        >
          {isLoadingLocation ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
            </svg>
          )}
        </button>

        {/* Copied toast */}
        {showCopied && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-[1001] animate-in fade-in zoom-in-95">
            {ar ? "تم النسخ!" : "Copied!"}
          </div>
        )}

        {/* Share menu */}
        {showShareMenu && (
          <div className="absolute inset-0 flex items-end justify-center z-[1001]">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowShareMenu(false)} />
            <div className="relative w-full max-w-md mx-4 mb-4 bg-(--surface) rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="p-4 border-b border-(--surface-border)">
                <h3 className="text-lg font-semibold text-center">{ar ? "مشاركة الموقع" : "Share Location"}</h3>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    window.open(`https://wa.me/?text=${encodeURIComponent(`${ar ? "موقع:" : "Location:"} ${window.location.href}`)}`, "_blank");
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-(--chip-bg) rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(ar ? "موقع" : "Location")}`, "_blank");
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-(--chip-bg) rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </div>
                  <span>Telegram</span>
                </button>
                <button
                  onClick={() => {
                    handleCopyCoordinates();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-(--chip-bg) rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </div>
                  <span>{ar ? "نسخ المختصرات" : "Copy Coordinates"}</span>
                </button>
              </div>
              <button
                onClick={() => setShowShareMenu(false)}
                className="w-full p-4 text-center text-red-500 font-medium border-t border-(--surface-border) hover:bg-(--chip-bg) transition-colors"
              >
                {ar ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="shrink-0 p-4 bg-(--surface) border-t border-(--surface-border)">
        {label && (
          <p className="text-sm text-(--muted-foreground) mb-3 text-center truncate">{label}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleCopyCoordinates}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-(--chip-bg) hover:bg-(--surface-border) rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">{ar ? "نسخ" : "Copy"}</span>
          </button>
          <button
            onClick={handleGetDirections}
            className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-sm font-medium">{ar ? "الاتجاهات" : "Directions"}</span>
          </button>
        </div>
        <p className="text-xs text-(--muted-foreground) text-center mt-3">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </p>
      </div>

      {/* Global styles */}
      <style jsx global>{`
        .map-viewer-marker,
        .user-location-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
