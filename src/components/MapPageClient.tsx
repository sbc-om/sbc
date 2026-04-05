"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Locale } from "@/lib/i18n/locales";
import type { Business } from "@/lib/db/types";
import { clampToOmanBounds, isWithinOmanBounds, OMAN_DEFAULT_CENTER } from "@/lib/maps/oman";

type Props = { locale: Locale };

function localizedCategory(category: string | undefined, locale: Locale) {
  if (!category) return "";
  const separators = ["|", " / ", " - ", " • "];
  for (const separator of separators) {
    if (!category.includes(separator)) continue;
    const parts = category
      .split(separator)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) return locale === "ar" ? parts[1] : parts[0];
  }
  return category;
}

export default function MapPageClient({ locale }: Props) {
  const searchParams = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    fetch(`/api/businesses?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data.ok && Array.isArray(data.businesses)) setBusinesses(data.businesses);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [locale]);

  const sharedLocation = useMemo(() => {
    const latRaw = searchParams.get("lat");
    const lngRaw = searchParams.get("lng");
    if (!latRaw || !lngRaw) return null;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isWithinOmanBounds(lat, lng)) return null;
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
          isWithinOmanBounds(business.latitude, business.longitude)
      ),
    [businesses]
  );

  const filteredBusinesses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return mappableBusinesses;

    return mappableBusinesses.filter((business) => {
      const nameAr = business.name.ar?.toLowerCase() ?? "";
      const nameEn = business.name.en?.toLowerCase() ?? "";
      const city = business.city?.toLowerCase() ?? "";
      const category = localizedCategory(business.category, locale).toLowerCase();
      return nameAr.includes(query) || nameEn.includes(query) || city.includes(query) || category.includes(query);
    });
  }, [mappableBusinesses, searchQuery, locale]);

  const selectedId = activeId ?? (!sharedLocation && filteredBusinesses.length > 0 ? filteredBusinesses[0].id : null);

  const activePoint = useMemo(() => {
    if (sharedLocation) return clampToOmanBounds(sharedLocation.lat, sharedLocation.lng);
    const active = filteredBusinesses.find((b) => b.id === selectedId);
    if (active && typeof active.latitude === "number" && typeof active.longitude === "number") {
      return clampToOmanBounds(active.latitude, active.longitude);
    }
    return OMAN_DEFAULT_CENTER;
  }, [filteredBusinesses, selectedId, sharedLocation]);

  const embedSrc = `https://maps.google.com/maps?q=${activePoint.lat},${activePoint.lng}&z=13&output=embed`;

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-(--background)">
      <div className="grid min-h-[100dvh] md:grid-cols-[360px,1fr]">
        <aside className="border-b border-(--surface-border) bg-(--surface) p-4 md:border-b-0 md:border-e">
          <h2 className="text-lg font-semibold">{locale === "ar" ? "الأنشطة التجارية" : "Businesses"}</h2>
          <p className="text-xs text-(--muted-foreground)">
            {searchQuery.trim().length > 0
              ? locale === "ar"
                ? `${filteredBusinesses.length} من ${mappableBusinesses.length}`
                : `${filteredBusinesses.length} of ${mappableBusinesses.length}`
              : locale === "ar"
                ? `${mappableBusinesses.length} موقع`
                : `${mappableBusinesses.length} locations`}
          </p>

          <div className="relative mt-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={locale === "ar" ? "ابحث..." : "Search..."}
              className="w-full rounded-xl bg-background/90 px-4 py-2.5 text-sm outline-none ring-1 ring-(--surface-border) transition focus:ring-accent/30"
            />
          </div>

          <div className="mt-3 max-h-[55dvh] space-y-2 overflow-y-auto pe-1 md:max-h-[78dvh]">
            {loading ? (
              <div className="py-3 text-sm text-(--muted-foreground)">{locale === "ar" ? "جارٍ التحميل..." : "Loading..."}</div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="py-3 text-sm text-(--muted-foreground)">{locale === "ar" ? "لا توجد نتائج" : "No results"}</div>
            ) : (
              filteredBusinesses.map((business) => {
                const point = clampToOmanBounds(business.latitude as number, business.longitude as number);
                const mapsHref = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
                return (
                  <article
                    key={business.id}
                    className={`rounded-xl p-3 ${selectedId === business.id ? "bg-accent/10" : "bg-(--chip-bg)"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveId(business.id)}
                      className="w-full text-start"
                    >
                      <div className="truncate text-sm font-semibold">{locale === "ar" ? business.name.ar : business.name.en}</div>
                      <div className="mt-0.5 text-xs text-(--muted-foreground)">{business.city || "-"}</div>
                    </button>
                    <a href={mapsHref} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline">
                      {locale === "ar" ? "فتح في Google Maps" : "Open in Google Maps"}
                    </a>
                  </article>
                );
              })
            )}
          </div>
        </aside>

        <div className="h-[62dvh] md:h-[100dvh]">
          <iframe
            title={locale === "ar" ? "خريطة جوجل" : "Google map"}
            src={embedSrc}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
