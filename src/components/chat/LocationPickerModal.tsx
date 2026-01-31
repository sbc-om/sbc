"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import type L from "leaflet";

type LocationPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  locale: string;
};

// Default center
const DEFAULT_CENTER = { lat: 23.588, lng: 58.3829 }; // Oman
const DEFAULT_ZOOM = 13;

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

export function LocationPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
  locale,
}: LocationPickerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const isDark = useIsDarkMode();

  // Get user's current location when modal opens
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation(DEFAULT_CENTER);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, [isOpen]);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    let mounted = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!mounted || !mapRef.current) return;

      // Cleanup existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }

      const center = userLocation || DEFAULT_CENTER;

      // Tile URL - no labels version for clean professional look
      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";

      // Create map
      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

      // Custom marker icon
      const markerIcon = L.divIcon({
        className: "chat-location-marker",
        html: `
          <svg viewBox="0 0 24 24" fill="none" style="width: 40px; height: 40px; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      // Handle map click
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
        }
      });

      mapInstanceRef.current = map;
      setIsLoading(false);

      // Force resize after render
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
    };
  }, [isOpen, userLocation, isDark]);

  // Center map on user location
  const handleCenterOnUser = useCallback(() => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
          }
          setIsLoadingLocation(false);
        },
        () => {
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation.lat, selectedLocation.lng);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedLocation(null);
    onClose();
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLocation(null);
      setIsLoading(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-(--surface) rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--surface-border)">
          <h3 className="text-lg font-semibold">
            {locale === "ar" ? "اختر موقعاً" : "Select Location"}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-(--chip-bg) rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Map container */}
        <div className="relative h-80 bg-(--chip-bg)">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />

          {/* Zoom controls */}
          <div className="absolute top-3 end-3 flex flex-col gap-1 z-[1000]">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-8 h-8 bg-(--surface) rounded-lg shadow-lg hover:bg-(--chip-bg) transition-colors flex items-center justify-center text-lg font-bold"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-8 h-8 bg-(--surface) rounded-lg shadow-lg hover:bg-(--chip-bg) transition-colors flex items-center justify-center text-lg font-bold"
            >
              −
            </button>
          </div>

          {/* Center on me button */}
          <button
            type="button"
            onClick={handleCenterOnUser}
            disabled={isLoadingLocation}
            className="absolute bottom-3 end-3 p-3 bg-(--surface) rounded-full shadow-lg hover:bg-(--chip-bg) transition-colors z-[1000] disabled:opacity-50"
            title={locale === "ar" ? "موقعي الحالي" : "My location"}
          >
            {isLoadingLocation ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="px-4 py-3 text-center text-sm text-(--muted-foreground) border-t border-(--surface-border)">
          {selectedLocation ? (
            <span className="text-green-500 font-medium">
              {locale === "ar" ? "تم تحديد الموقع ✓" : "Location selected ✓"}
            </span>
          ) : (
            <span>
              {locale === "ar" ? "انقر على الخريطة لتحديد الموقع" : "Tap on the map to select location"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-(--surface-border)">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            {locale === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!selectedLocation}
          >
            {locale === "ar" ? "إرسال الموقع" : "Send Location"}
          </Button>
        </div>
      </div>

      {/* Global styles for leaflet marker */}
      <style jsx global>{`
        .chat-location-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
