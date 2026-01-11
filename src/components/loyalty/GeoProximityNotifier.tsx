"use client";

import { useEffect, useRef, useState } from "react";

function toRad(n: number) {
  return (n * Math.PI) / 180;
}

// Haversine distance (meters)
function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);

  const h = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function GeoProximityNotifier({
  businessName,
  business,
  radiusMeters,
  enabled = true,
}: {
  businessName: string;
  business: { lat: number; lng: number };
  radiusMeters: number;
  enabled?: boolean;
}) {
  const [status, setStatus] = useState<
    "idle" | "unsupported" | "watching" | "denied" | "notified"
  >("idle");

  const hasNotifiedRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!("geolocation" in navigator) || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;

    async function ensurePermission() {
      if (Notification.permission === "granted") return true;
      if (Notification.permission === "denied") return false;
      const p = await Notification.requestPermission();
      return p === "granted";
    }

    void (async () => {
      const ok = await ensurePermission();
      if (cancelled) return;
      if (!ok) {
        setStatus("denied");
        return;
      }

      setStatus("watching");
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (hasNotifiedRef.current) return;

          const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const d = distanceMeters(me, business);

          if (d <= radiusMeters) {
            hasNotifiedRef.current = true;
            setStatus("notified");

            try {
              // Note: browser notifications while page is open; for background push
              // you need service worker + Web Push subscription.
              new Notification(businessName, {
                body: `You're near ${businessName}. Tap to open your loyalty card.`,
              });
            } catch {
              // ignore
            }
          }
        },
        () => {
          setStatus("denied");
        },
        { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 }
      );
    })();

    return () => {
      cancelled = true;
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [business.lat, business.lng, businessName, enabled, radiusMeters]);

  // Silent component. We only track status for future UI.
  return null;
}
