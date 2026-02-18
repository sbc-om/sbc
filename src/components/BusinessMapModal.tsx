"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Business } from "@/lib/db/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
};

const DEFAULT_CENTER = { lat: 23.588, lng: 58.3829 };
const DEFAULT_ZOOM = 12;

export function BusinessMapModal({ isOpen, onClose, locale }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoading(true);
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
  }, [isOpen, locale]);

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;
    let mounted = true;

    const init = async () => {
      const L = (await import("leaflet")).default;

      if (!mounted || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }

      const map = L.map(mapRef.current, {
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
        attributionControl: false,
      });

      const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

      mapInstanceRef.current = map;

      // add markers when businesses are loaded
      const addMarkers = () => {
        if (!businesses || !mapInstanceRef.current) return;
        const points: [number, number][] = [];
        for (const b of businesses) {
          if (typeof b.latitude !== "number" || typeof b.longitude !== "number") continue;
          const marker = L.marker([b.latitude, b.longitude]).addTo(map);
          const name = (locale === "ar" ? b.name.ar : b.name.en) || b.slug || "";
          const href = b.username ? `/${locale}/businesses/@${b.username}` : `/${locale}/businesses/${b.slug}`;
          marker.bindPopup(`<div style="min-width:120px"><strong>${name}</strong><br/><a href='${href}'>View</a></div>`);
          markersRef.current.push(marker);
          points.push([b.latitude, b.longitude]);
        }

        if (points.length > 0) {
          const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
          map.fitBounds(bounds.pad(0.2));
        } else {
          map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM);
        }
      };

      addMarkers();

      // watch for businesses change
      return () => {
        mounted = false;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
        markersRef.current = [];
      };
    };

    init();
    // re-run when businesses change
  }, [isOpen, businesses, locale]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl mx-4 bg-(--surface) rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--surface-border)">
          <h3 className="text-lg font-semibold">{locale === "ar" ? "الخريطة" : "Map"}</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-(--chip-bg) rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative h-96 bg-(--chip-bg)">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>

        <div className="flex gap-3 p-4 border-t border-(--surface-border)">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {locale === "ar" ? "بستن" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
