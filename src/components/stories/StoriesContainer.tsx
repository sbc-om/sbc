"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { BusinessWithStories } from "@/lib/db/stories";
import { createTtlCache } from "@/lib/cache/ttlCache";
import type { Locale } from "@/lib/i18n/locales";
import { StoriesCarousel } from "./StoriesCarousel";
import { StoryViewer } from "./StoryViewer";

interface StoriesContainerProps {
  initialBusinesses: BusinessWithStories[];
  locale: Locale;
  currentUserId?: string;
  ownedBusinessIds?: string[];
  isAdmin?: boolean;
  initialTotal?: number;
  fetchScope?: "all" | "followed";
}

export function StoriesContainer({ 
  initialBusinesses, 
  locale,
  currentUserId,
  ownedBusinessIds = [],
  isAdmin = false,
  initialTotal,
  fetchScope,
}: StoriesContainerProps) {
  const ITEMS_PER_PAGE = 16;
  const STORIES_CACHE_TTL_MS = 60_000;
  const STORIES_CACHE_MAX_ENTRIES = 120;
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [total, setTotal] = useState(initialTotal ?? initialBusinesses.length);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestInFlightRef = useRef(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const storiesEtagByKeyRef = useRef(new Map<string, string>());
  const storiesStalePayloadByKeyRef = useRef(new Map<string, {
    businesses: BusinessWithStories[];
    pagination: { page: number; total: number; totalPages: number };
  }>());
  const cacheRef = useRef(createTtlCache<{
    businesses: BusinessWithStories[];
    pagination: { page: number; total: number; totalPages: number };
  }>(STORIES_CACHE_TTL_MS, STORIES_CACHE_MAX_ENTRIES));

  const rememberStoriesStalePayload = useCallback((key: string, payload: {
    businesses: BusinessWithStories[];
    pagination: { page: number; total: number; totalPages: number };
  }) => {
    if (storiesStalePayloadByKeyRef.current.size >= STORIES_CACHE_MAX_ENTRIES) {
      const firstKey = storiesStalePayloadByKeyRef.current.keys().next().value;
      if (firstKey) storiesStalePayloadByKeyRef.current.delete(firstKey);
    }
    storiesStalePayloadByKeyRef.current.set(key, payload);
  }, [STORIES_CACHE_MAX_ENTRIES]);

  const rememberStoriesEtag = useCallback((key: string, etag: string | null) => {
    if (!etag) return;
    if (storiesEtagByKeyRef.current.size >= STORIES_CACHE_MAX_ENTRIES) {
      const firstKey = storiesEtagByKeyRef.current.keys().next().value;
      if (firstKey) storiesEtagByKeyRef.current.delete(firstKey);
    }
    storiesEtagByKeyRef.current.set(key, etag);
  }, [STORIES_CACHE_MAX_ENTRIES]);

  const buildStoriesKey = useCallback((targetPage: number) => {
    return `scope=${fetchScope ?? "all"}&page=${targetPage}&perPage=${ITEMS_PER_PAGE}`;
  }, [fetchScope, ITEMS_PER_PAGE]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;

        setVisibleCount((current) => Math.min(current + ITEMS_PER_PAGE, businesses.length));

        if (!fetchScope) return;
        if (requestInFlightRef.current) return;
        if (businesses.length >= total) return;

        requestInFlightRef.current = true;
        setIsLoadingMore(true);
        const nextPage = page + 1;
        const key = buildStoriesKey(nextPage);
        const cached = cacheRef.current.get(key);

        if (cached) {
          setBusinesses((prev) => {
            const seen = new Set(prev.map((item) => item.businessId));
            const merged = [...prev];
            for (const item of cached.businesses) {
              if (seen.has(item.businessId)) continue;
              merged.push(item);
            }
            return merged;
          });
          setTotal(cached.pagination.total);
          setPage(cached.pagination.page);
          requestInFlightRef.current = false;
          setIsLoadingMore(false);
          return;
        }

        fetchAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;
        const previousEtag = storiesEtagByKeyRef.current.get(key);
        const requestHeaders = new Headers();
        if (previousEtag) requestHeaders.set("If-None-Match", previousEtag);

        fetch(`/api/stories/businesses?${key}`, { signal: controller.signal, headers: requestHeaders })
          .then(async (response) => {
            if (response.status === 304) {
              const stale = storiesStalePayloadByKeyRef.current.get(key);
              if (!stale) return null;
              cacheRef.current.set(key, stale);
              setBusinesses((prev) => {
                const seen = new Set(prev.map((item) => item.businessId));
                const merged = [...prev];
                for (const item of stale.businesses) {
                  if (seen.has(item.businessId)) continue;
                  merged.push(item);
                }
                return merged;
              });
              setTotal(stale.pagination.total);
              setPage(stale.pagination.page);
              return null;
            }

            if (!response.ok) return null;
            const etag = response.headers.get("etag");
            const data = await response.json();
            return { data, etag };
          })
          .then((data) => {
            if (!data) return;
            rememberStoriesEtag(key, data.etag);
            const body = data.data;
            if (!body?.ok || !Array.isArray(body.businesses)) return;

            const payload = {
              businesses: body.businesses as BusinessWithStories[],
              pagination: {
                page: Number(body.pagination?.page ?? nextPage),
                total: Number(body.pagination?.total ?? 0),
                totalPages: Number(body.pagination?.totalPages ?? 1),
              },
            };

            cacheRef.current.set(key, payload);
            rememberStoriesStalePayload(key, payload);

            setBusinesses((prev) => {
              const seen = new Set(prev.map((item) => item.businessId));
              const merged = [...prev];
              for (const item of payload.businesses) {
                if (seen.has(item.businessId)) continue;
                merged.push(item);
              }
              return merged;
            });

            setTotal(payload.pagination.total);
            setPage(payload.pagination.page);
          })
          .catch(() => {})
          .finally(() => {
            requestInFlightRef.current = false;
            setIsLoadingMore(false);
          });
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
      fetchAbortRef.current?.abort();
    };
  }, [businesses.length, total, page, fetchScope, buildStoriesKey, rememberStoriesEtag, rememberStoriesStalePayload]);

  const visibleBusinesses = useMemo(
    () => businesses.slice(0, Math.min(visibleCount, businesses.length)),
    [businesses, visibleCount],
  );

  const handleOpenStory = (businessId: string) => {
    setSelectedBusinessId(businessId);
    setViewerOpen(true);
    // Prevent body scroll when viewer is open
    document.body.style.overflow = "hidden";
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedBusinessId(null);
    document.body.style.overflow = "";
  };

  // Check if current user owns the selected business
  const isBusinessOwner = selectedBusinessId
    ? ownedBusinessIds.includes(selectedBusinessId)
    : false;

  // Don't render anything if no stories
  if (businesses.length === 0) {
    return null;
  }

  return (
    <>
      <StoriesCarousel
        businesses={visibleBusinesses}
        locale={locale}
        onOpenStory={handleOpenStory}
      />

      {visibleBusinesses.length < total ? (
        <div className="px-4 pb-1 pt-0.5 text-center text-xs text-(--muted-foreground)">
          <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />
          {locale === "ar"
            ? `عرض ${visibleBusinesses.length} من ${total} ستوري${isLoadingMore ? "..." : ""}`
            : `Showing ${visibleBusinesses.length} of ${total} stories${isLoadingMore ? "..." : ""}`}
        </div>
      ) : null}

      {typeof document !== "undefined" && viewerOpen && selectedBusinessId && createPortal(
        <StoryViewer
          businesses={businesses}
          initialBusinessId={selectedBusinessId}
          locale={locale}
          onClose={handleCloseViewer}
          currentUserId={currentUserId}
          isBusinessOwner={isBusinessOwner}
          isAdmin={isAdmin}
        />,
        document.body
      )}
    </>
  );
}
