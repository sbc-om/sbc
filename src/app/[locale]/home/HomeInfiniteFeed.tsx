"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BusinessFeedCard } from "@/components/BusinessFeedCard";
import { createTtlCache } from "@/lib/cache/ttlCache";
import type { Locale } from "@/lib/i18n/locales";
import type { Business } from "@/lib/db/types";

type FeedItem = {
  business: Business;
  categoryName?: string;
  categoryIconId?: string;
  initialLikeCount: number;
  initialLiked: boolean;
  initialSaved: boolean;
  commentCount: number;
  hasStories: boolean;
};

interface HomeInfiniteFeedProps {
  locale: Locale;
  initialItems: FeedItem[];
  initialTotal: number;
  onToggleLike: (businessId: string) => Promise<{ liked: boolean; count: number }>;
  onToggleSave: (businessId: string) => Promise<{ saved: boolean }>;
}

export function HomeInfiniteFeed({ locale, initialItems, initialTotal, onToggleLike, onToggleSave }: HomeInfiniteFeedProps) {
  const ITEMS_PER_PAGE = 12;
  const HOME_FEED_CACHE_TTL_MS = 60_000;
  const HOME_FEED_CACHE_MAX_ENTRIES = 80;
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestInFlightRef = useRef(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const requestTokenRef = useRef(0);
  const etagByKeyRef = useRef(new Map<string, string>());
  const stalePayloadByKeyRef = useRef(new Map<string, {
    items: FeedItem[];
    pagination: { page: number; total: number; totalPages: number };
  }>());
  const cacheRef = useRef(
    createTtlCache<{
      items: FeedItem[];
      pagination: { page: number; total: number; totalPages: number };
    }>(HOME_FEED_CACHE_TTL_MS, HOME_FEED_CACHE_MAX_ENTRIES),
  );

  const rememberStalePayload = (key: string, payload: {
    items: FeedItem[];
    pagination: { page: number; total: number; totalPages: number };
  }) => {
    if (stalePayloadByKeyRef.current.size >= HOME_FEED_CACHE_MAX_ENTRIES) {
      const firstKey = stalePayloadByKeyRef.current.keys().next().value;
      if (firstKey) stalePayloadByKeyRef.current.delete(firstKey);
    }
    stalePayloadByKeyRef.current.set(key, payload);
  };

  const rememberEtag = (key: string, etag: string | null) => {
    if (!etag) return;
    if (etagByKeyRef.current.size >= HOME_FEED_CACHE_MAX_ENTRIES) {
      const firstKey = etagByKeyRef.current.keys().next().value;
      if (firstKey) etagByKeyRef.current.delete(firstKey);
    }
    etagByKeyRef.current.set(key, etag);
  };

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (requestInFlightRef.current) return;
        if (items.length >= total) return;

        requestInFlightRef.current = true;
        setIsLoadingMore(true);

        const nextPage = page + 1;
        const params = new URLSearchParams({
          page: String(nextPage),
          perPage: String(ITEMS_PER_PAGE),
          locale,
        });
        const cacheKey = params.toString();
        const cached = cacheRef.current.get(cacheKey);
        if (cached) {
          setItems((prev) => {
            const seen = new Set(prev.map((item) => item.business.id));
            const merged = [...prev];
            for (const item of cached.items) {
              if (seen.has(item.business.id)) continue;
              merged.push(item);
            }
            return merged;
          });
          setTotal(Number(cached.pagination.total ?? total));
          setPage(Number(cached.pagination.page ?? nextPage));
          requestInFlightRef.current = false;
          setIsLoadingMore(false);
          return;
        }

        fetchAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;
        const requestToken = ++requestTokenRef.current;
        const previousEtag = etagByKeyRef.current.get(cacheKey);
        const requestHeaders = new Headers();
        if (previousEtag) {
          requestHeaders.set("If-None-Match", previousEtag);
        }

        fetch(`/api/home/feed?${cacheKey}`, { signal: controller.signal, headers: requestHeaders })
          .then(async (response) => {
            if (response.status === 304) {
              const stale = stalePayloadByKeyRef.current.get(cacheKey);
              if (!stale) return null;

              cacheRef.current.set(cacheKey, stale);
              setItems((prev) => {
                const seen = new Set(prev.map((item) => item.business.id));
                const merged = [...prev];
                for (const item of stale.items) {
                  if (seen.has(item.business.id)) continue;
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
            if (requestToken !== requestTokenRef.current) return;
            if (!data) return;
            rememberEtag(cacheKey, data.etag);
            const body = data.data;
            if (!body?.ok || !Array.isArray(body.items)) return;

            const payload = {
              items: body.items as FeedItem[],
              pagination: {
                page: Number(body.pagination?.page ?? nextPage),
                total: Number(body.pagination?.total ?? total),
                totalPages: Number(body.pagination?.totalPages ?? 1),
              },
            };

            cacheRef.current.set(cacheKey, payload);
            rememberStalePayload(cacheKey, payload);

            setItems((prev) => {
              const seen = new Set(prev.map((item) => item.business.id));
              const merged = [...prev];
              for (const item of payload.items) {
                if (seen.has(item.business.id)) continue;
                merged.push(item);
              }
              return merged;
            });
            setTotal(payload.pagination.total);
            setPage(payload.pagination.page);
          })
          .catch(() => {})
          .finally(() => {
            if (requestToken !== requestTokenRef.current) return;
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
  }, [items.length, total, page, locale]);

  const visibleItems = useMemo(() => items, [items]);

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => (
          <BusinessFeedCard
            key={item.business.id}
            business={item.business}
            locale={locale}
            categoryName={item.categoryName}
            categoryIconId={item.categoryIconId}
            initialLikeCount={item.initialLikeCount}
            initialLiked={item.initialLiked}
            initialSaved={item.initialSaved}
            commentCount={item.commentCount}
            onToggleLike={onToggleLike}
            onToggleSave={onToggleSave}
            detailsBasePath="/explorer"
            hasStories={item.hasStories}
          />
        ))}
      </div>

      {visibleItems.length < total ? (
        <div className="mt-6">
          <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />
          <div className="mt-2 text-center text-xs text-(--muted-foreground)">
            {locale === "ar"
              ? `عرض ${visibleItems.length} من ${total}${isLoadingMore ? "..." : ""}`
              : `Showing ${visibleItems.length} of ${total}${isLoadingMore ? "..." : ""}`}
          </div>
        </div>
      ) : null}
    </>
  );
}
