"use client";

import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiSearch, FiUpload, FiX, FiFilter, FiZap, FiMessageCircle, FiSend, FiTrash2, FiArrowRight } from "react-icons/fi";

import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { Business, Category } from "@/lib/db/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CategorySelect } from "@/components/ui/CategorySelect";
import { BusinessFeedCard } from "@/components/BusinessFeedCard";
import { MarkdownRenderer } from "@/components/ui/MarkdownEditor";
import { useAISearch } from "@/lib/ai/AISearchProvider";
import { createTtlCache } from "@/lib/cache/ttlCache";

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function haystack(b: Business, locale: Locale) {
  return normalize(
    [
      b.name[locale],
      b.name.en,
      b.name.ar,
      b.description?.[locale],
      b.description?.en,
      b.description?.ar,
      b.slug,
      b.city,
      b.category,
      b.tags?.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function BusinessesExplorer({
  locale,
  dict,
  businesses,
  categories,
  detailsBasePath = "/businesses",
  businessIdsWithStories = new Set<string>(),
  engagementByBusiness,
  onToggleLike,
  onToggleSave,
  serverPagination,
}: {
  locale: Locale;
  dict: Dictionary;
  businesses: Business[];
  categories: Category[];
  /** Route prefix for business details links. Example: "/businesses" or "/explorer" */
  detailsBasePath?: string;
  /** Set of business IDs that have active stories */
  businessIdsWithStories?: Set<string>;
  /** Optional engagement payload to render Home-style feed cards. */
  engagementByBusiness?: Record<
    string,
    {
      categoryName?: string;
      categoryIconId?: string;
      initialLikeCount: number;
      initialLiked: boolean;
      initialSaved: boolean;
      commentCount: number;
    }
  >;
  /** Optional server action to toggle likes. */
  onToggleLike?: (businessId: string) => Promise<{ liked: boolean; count: number }>;
  /** Optional server action to toggle saves. */
  onToggleSave?: (businessId: string) => Promise<{ saved: boolean }>;
  serverPagination?: { page: number; perPage: number; total: number; totalPages: number };
}) {
  const ITEMS_PER_PAGE = 12;
  const EXPLORER_CACHE_TTL_MS = 60_000;
  const EXPLORER_CACHE_MAX_ENTRIES = 120;
  // Unified search state
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState("");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [aiResults, setAiResults] = useState<Business[] | null>(null);
  
  // Active search mode - only one can be active at a time
  type SearchMode = "none" | "advanced" | "image" | "chat";
  const [activeMode, setActiveMode] = useState<SearchMode>("none");
  
  // AI Search
  const { isReady, searchSimilar, findVisuallySimilar } = useAISearch();
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [serverBusinesses, setServerBusinesses] = useState<Business[]>(businesses);
  const [serverEngagementByBusiness, setServerEngagementByBusiness] = useState(engagementByBusiness ?? {});
  const [serverStoryIds, setServerStoryIds] = useState<Set<string>>(new Set(Array.from(businessIdsWithStories)));
  const [serverPage, setServerPage] = useState(serverPagination?.page ?? 1);
  const [serverTotal, setServerTotal] = useState(serverPagination?.total ?? businesses.length);
  const [serverTotalPages, setServerTotalPages] = useState(serverPagination?.totalPages ?? 1);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const serverReqRef = useRef(false);

  type ExplorerPayload = {
    businesses: Business[];
    engagementByBusiness: Record<string, {
      categoryName?: string;
      categoryIconId?: string;
      initialLikeCount: number;
      initialLiked: boolean;
      initialSaved: boolean;
      commentCount: number;
    }>;
    storyBusinessIds: string[];
    pagination: { page: number; total: number; totalPages: number };
  };

  const serverCacheRef = useRef(createTtlCache<ExplorerPayload>(EXPLORER_CACHE_TTL_MS, EXPLORER_CACHE_MAX_ENTRIES));
  const explorerEtagByKeyRef = useRef(new Map<string, string>());
  const explorerStalePayloadByKeyRef = useRef(new Map<string, ExplorerPayload>());
  const searchAbortRef = useRef<AbortController | null>(null);
  const loadMoreAbortRef = useRef<AbortController | null>(null);

  const rememberExplorerStalePayload = useCallback((key: string, payload: ExplorerPayload) => {
    if (explorerStalePayloadByKeyRef.current.size >= EXPLORER_CACHE_MAX_ENTRIES) {
      const firstKey = explorerStalePayloadByKeyRef.current.keys().next().value;
      if (firstKey) explorerStalePayloadByKeyRef.current.delete(firstKey);
    }
    explorerStalePayloadByKeyRef.current.set(key, payload);
  }, [EXPLORER_CACHE_MAX_ENTRIES]);

  const rememberExplorerEtag = useCallback((key: string, etag: string | null) => {
    if (!etag) return;
    if (explorerEtagByKeyRef.current.size >= EXPLORER_CACHE_MAX_ENTRIES) {
      const firstKey = explorerEtagByKeyRef.current.keys().next().value;
      if (firstKey) explorerEtagByKeyRef.current.delete(firstKey);
    }
    explorerEtagByKeyRef.current.set(key, etag);
  }, [EXPLORER_CACHE_MAX_ENTRIES]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    try {
      const results = await searchSimilar(searchQuery, businesses, locale);
      setAiResults(results);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Toggle search mode - ensures only one panel is open at a time
  const toggleMode = (mode: SearchMode) => {
    if (activeMode === mode) {
      setActiveMode("none");
    } else {
      setActiveMode(mode);
      // Clear image when switching away from image mode
      if (mode !== "image" && uploadedImage) {
        setUploadedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActiveMode("image");
    setUploadedImage(file);
    setIsAiSearching(true);
    try {
      const results = await findVisuallySimilar(file, businesses);
      setAiResults(results);
    } finally {
      setIsAiSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setUploadedImage(null);
    setAiResults(null);
    setCity("");
    setTags("");
    setCategoryId("");
    setSortBy("relevance");
    setActiveMode("none");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChatSearch = async (overrideMessage?: string) => {
    const userMessage = (overrideMessage || chatInput).trim();
    if (!userMessage) return;
    
    setChatInput("");
    const newHistory = [...chatMessages, { role: "user" as const, content: userMessage }];
    setChatMessages(newHistory);
    setIsTyping(true);
    
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage,
          locale,
          conversationHistory: chatMessages.slice(-6),
        }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        // Map result IDs to full business objects preserving server-side ranking
        const resultIds: string[] = Array.isArray(data.resultIds) ? data.resultIds : [];
        const idOrder = new Map<string, number>(resultIds.map((id, i) => [id, i]));
        const orderedResults = businesses
          .filter(b => idOrder.has(b.id))
          .sort((a, b) => (idOrder.get(a.id) ?? 999) - (idOrder.get(b.id) ?? 999));
        
        if (orderedResults.length > 0) {
          setAiResults(orderedResults);
        }
        
        setChatMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      } else {
        // Fallback to client-side search
        const results = await searchSimilar(userMessage, businesses, locale);
        setAiResults(results);
        
        const fallbackMsg = results.length > 0
          ? (locale === "ar"
            ? `وجدت ${results.length} نتيجة لـ "${userMessage}". انظر القائمة أدناه.`
            : `Found ${results.length} results for "${userMessage}". See list below.`)
          : (locale === "ar"
            ? `عذراً، لم أجد نتائج لـ "${userMessage}".`
            : `Sorry, no results found for "${userMessage}".`);
        
        setChatMessages(prev => [...prev, { role: "assistant", content: fallbackMsg }]);
      }
    } catch (error) {
      console.error('Chat search error:', error);
      // Fallback to client-side search on network error
      try {
        const results = await searchSimilar(userMessage, businesses, locale);
        setAiResults(results);
        const fallbackMsg = locale === "ar"
          ? `وجدت ${results.length} نتيجة. (بحث محلي)`
          : `Found ${results.length} results. (Local search)`;
        setChatMessages(prev => [...prev, { role: "assistant", content: fallbackMsg }]);
      } catch {
        const errorMsg = locale === "ar" 
          ? "خطأ في البحث. يرجى المحاولة مرة أخرى."
          : "Search error. Please try again.";
        setChatMessages(prev => [...prev, { role: "assistant", content: errorMsg }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const filtered = useMemo(() => {
    const sourceBusinesses = aiResults || (serverPagination ? serverBusinesses : businesses);

    if (serverPagination && !aiResults) {
      return sourceBusinesses;
    }

    const tokens = normalize(searchQuery)
      .split(" ")
      .filter(Boolean);

    const tagTokens = normalize(tags)
      .split(/[ ,]+/)
      .filter(Boolean);

    const cityToken = normalize(city);

    return sourceBusinesses.filter((b) => {
      if (categoryId && b.categoryId !== categoryId) return false;
      if (cityToken && normalize(b.city ?? "").includes(cityToken) === false) return false;

      if (tagTokens.length) {
        const t = (b.tags ?? []).map((x) => normalize(x));
        for (const need of tagTokens) {
          if (!t.some((x) => x.includes(need))) return false;
        }
      }

      if (tokens.length) {
        const h = haystack(b, locale);
        for (const t of tokens) {
          if (!h.includes(t)) return false;
        }
      }

      return true;
    });
  }, [businesses, serverBusinesses, serverPagination, aiResults, searchQuery, city, tags, categoryId, locale]);

  const sorted = useMemo(() => {
    if (sortBy === "relevance") return filtered;

    const withIndex = filtered.map((b, index) => ({ b, index }));

    const toDate = (value?: string) => (value ? Date.parse(value) : 0);
    const nameOf = (b: Business) => (locale === "ar" ? b.name.ar : b.name.en);
    const cityOf = (b: Business) => b.city ?? "";

    withIndex.sort((a, b) => {
      const aB = a.b;
      const bB = b.b;

      let diff = 0;
      switch (sortBy) {
        case "name-asc":
          diff = nameOf(aB).localeCompare(nameOf(bB));
          break;
        case "name-desc":
          diff = nameOf(bB).localeCompare(nameOf(aB));
          break;
        case "city-asc":
          diff = cityOf(aB).localeCompare(cityOf(bB));
          break;
        case "created-desc":
          diff = toDate(bB.createdAt) - toDate(aB.createdAt);
          break;
        case "created-asc":
          diff = toDate(aB.createdAt) - toDate(bB.createdAt);
          break;
        case "updated-desc":
          diff = toDate(bB.updatedAt) - toDate(aB.updatedAt);
          break;
        case "verified-first":
          diff = Number(Boolean(bB.isVerified)) - Number(Boolean(aB.isVerified));
          break;
        case "special-first":
          diff = Number(Boolean(bB.isSpecial)) - Number(Boolean(aB.isSpecial));
          break;
        case "featured-first":
          diff =
            Number(Boolean(bB.homepageTop || bB.homepageFeatured)) -
            Number(Boolean(aB.homepageTop || aB.homepageFeatured));
          break;
        default:
          diff = 0;
      }

      return diff !== 0 ? diff : a.index - b.index;
    });

    return withIndex.map((x) => x.b);
  }, [filtered, sortBy, locale]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, city, tags, categoryId, sortBy, aiResults]);

  const buildServerParams = useCallback((page: number) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("perPage", String(serverPagination?.perPage ?? ITEMS_PER_PAGE));
    params.set("locale", locale);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (city.trim()) params.set("city", city.trim());
    if (tags.trim()) params.set("tags", tags.trim());
    if (categoryId) params.set("categoryId", categoryId);
    params.set("sortBy", sortBy);
    return params;
  }, [serverPagination?.perPage, locale, searchQuery, city, tags, categoryId, sortBy]);

  const applyPageOnePayload = useCallback((data: ExplorerPayload) => {
    setServerBusinesses(data.businesses);
    setServerEngagementByBusiness(data.engagementByBusiness ?? {});
    setServerStoryIds(new Set<string>(data.storyBusinessIds ?? []));
    setServerPage(Number(data.pagination?.page ?? 1));
    setServerTotal(Number(data.pagination?.total ?? 0));
    setServerTotalPages(Number(data.pagination?.totalPages ?? 1));
    setVisibleCount(Math.max(ITEMS_PER_PAGE, data.businesses.length));
  }, [ITEMS_PER_PAGE]);

  useEffect(() => {
    if (!serverPagination) return;
    if (aiResults) return;

    const handle = setTimeout(() => {
      serverReqRef.current = true;
      setIsServerLoading(true);
      const params = buildServerParams(1);
      const cacheKey = params.toString();
      const cached = serverCacheRef.current.get(cacheKey);
      if (cached) {
        applyPageOnePayload(cached);
        serverReqRef.current = false;
        setIsServerLoading(false);
        return;
      }

      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      const previousEtag = explorerEtagByKeyRef.current.get(cacheKey);
      const requestHeaders = new Headers();
      if (previousEtag) requestHeaders.set("If-None-Match", previousEtag);

      fetch(`/api/explorer/businesses?${cacheKey}`, { signal: controller.signal, headers: requestHeaders })
        .then(async (response) => {
          if (response.status === 304) {
            const stale = explorerStalePayloadByKeyRef.current.get(cacheKey);
            if (!stale) return null;
            serverCacheRef.current.set(cacheKey, stale);
            applyPageOnePayload(stale);
            return null;
          }

          if (!response.ok) return null;
          const etag = response.headers.get("etag");
          const data = await response.json();
          return { data, etag };
        })
        .then((data) => {
          if (!data) return;
          rememberExplorerEtag(cacheKey, data.etag);
          const body = data.data;
          if (!body?.ok || !Array.isArray(body.businesses)) return;

          const payload = {
            businesses: body.businesses as Business[],
            engagementByBusiness: (body.engagementByBusiness ?? {}) as typeof serverEngagementByBusiness,
            storyBusinessIds: (body.storyBusinessIds ?? []) as string[],
            pagination: {
              page: Number(body.pagination?.page ?? 1),
              total: Number(body.pagination?.total ?? 0),
              totalPages: Number(body.pagination?.totalPages ?? 1),
            },
          };

          serverCacheRef.current.set(cacheKey, payload);
          rememberExplorerStalePayload(cacheKey, payload);
          applyPageOnePayload(payload);
        })
        .catch(() => {})
        .finally(() => {
          serverReqRef.current = false;
          setIsServerLoading(false);
        });
    }, 450);

    return () => {
      clearTimeout(handle);
      searchAbortRef.current?.abort();
    };
  }, [
    serverPagination,
    aiResults,
    searchQuery,
    city,
    tags,
    categoryId,
    sortBy,
    locale,
    buildServerParams,
    applyPageOnePayload,
    rememberExplorerEtag,
    rememberExplorerStalePayload,
  ]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;

        if (serverPagination && !aiResults) {
          if (serverReqRef.current || isServerLoading) return;
          if (serverPage >= serverTotalPages) return;

          serverReqRef.current = true;
          setIsServerLoading(true);

          const nextPage = serverPage + 1;
          const params = buildServerParams(nextPage);
          const cacheKey = params.toString();
          const cached = serverCacheRef.current.get(cacheKey);

          if (cached) {
            setServerBusinesses((prev) => {
              const seen = new Set(prev.map((item) => item.id));
              const merged = [...prev];
              for (const item of cached.businesses) {
                if (seen.has(item.id)) continue;
                merged.push(item);
              }
              return merged;
            });
            setServerEngagementByBusiness((prev) => ({ ...prev, ...cached.engagementByBusiness }));
            setServerStoryIds((prev) => {
              const next = new Set(prev);
              for (const id of cached.storyBusinessIds) next.add(id);
              return next;
            });
            setServerPage(cached.pagination.page);
            setServerTotal(cached.pagination.total);
            setServerTotalPages(cached.pagination.totalPages);
            serverReqRef.current = false;
            setIsServerLoading(false);
            return;
          }

          loadMoreAbortRef.current?.abort();
          const controller = new AbortController();
          loadMoreAbortRef.current = controller;
          const previousEtag = explorerEtagByKeyRef.current.get(cacheKey);
          const requestHeaders = new Headers();
          if (previousEtag) requestHeaders.set("If-None-Match", previousEtag);

          fetch(`/api/explorer/businesses?${cacheKey}`, { signal: controller.signal, headers: requestHeaders })
            .then(async (response) => {
              if (response.status === 304) {
                const stale = explorerStalePayloadByKeyRef.current.get(cacheKey);
                if (!stale) return null;
                serverCacheRef.current.set(cacheKey, stale);
                setServerBusinesses((prev) => {
                  const seen = new Set(prev.map((item) => item.id));
                  const merged = [...prev];
                  for (const item of stale.businesses) {
                    if (seen.has(item.id)) continue;
                    merged.push(item);
                  }
                  return merged;
                });
                setServerEngagementByBusiness((prev) => ({ ...prev, ...stale.engagementByBusiness }));
                setServerStoryIds((prev) => {
                  const next = new Set(prev);
                  for (const id of stale.storyBusinessIds) next.add(id);
                  return next;
                });
                setServerPage(stale.pagination.page);
                setServerTotal(stale.pagination.total);
                setServerTotalPages(stale.pagination.totalPages);
                return null;
              }

              if (!response.ok) return null;
              const etag = response.headers.get("etag");
              const data = await response.json();
              return { data, etag };
            })
            .then((data) => {
              if (!data) return;
              rememberExplorerEtag(cacheKey, data.etag);
              const body = data.data;
              if (!body?.ok || !Array.isArray(body.businesses)) return;

              const payload = {
                businesses: body.businesses as Business[],
                engagementByBusiness: (body.engagementByBusiness ?? {}) as typeof serverEngagementByBusiness,
                storyBusinessIds: (body.storyBusinessIds ?? []) as string[],
                pagination: {
                  page: Number(body.pagination?.page ?? nextPage),
                  total: Number(body.pagination?.total ?? 0),
                  totalPages: Number(body.pagination?.totalPages ?? serverTotalPages),
                },
              };

              serverCacheRef.current.set(cacheKey, payload);
              rememberExplorerStalePayload(cacheKey, payload);

              setServerBusinesses((prev) => {
                const seen = new Set(prev.map((item) => item.id));
                const merged = [...prev];
                for (const item of payload.businesses) {
                  if (seen.has(item.id)) continue;
                  merged.push(item);
                }
                return merged;
              });

              setServerEngagementByBusiness((prev) => ({
                ...prev,
                ...payload.engagementByBusiness,
              }));

              setServerStoryIds((prev) => {
                const next = new Set(prev);
                for (const id of payload.storyBusinessIds) {
                  next.add(id);
                }
                return next;
              });

              setServerPage(payload.pagination.page);
              setServerTotal(payload.pagination.total);
              setServerTotalPages(payload.pagination.totalPages);
            })
            .catch(() => {})
            .finally(() => {
              serverReqRef.current = false;
              setIsServerLoading(false);
            });

          return;
        }

        setVisibleCount((current) => {
          if (current >= sorted.length) return current;
          return Math.min(current + ITEMS_PER_PAGE, sorted.length);
        });
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    sorted.length,
    serverPagination,
    aiResults,
    isServerLoading,
    serverPage,
    serverTotalPages,
    searchQuery,
    city,
    tags,
    categoryId,
    sortBy,
    locale,
    buildServerParams,
    rememberExplorerEtag,
    rememberExplorerStalePayload,
  ]);

  const visibleBusinesses = useMemo(
    () => (serverPagination && !aiResults
      ? sorted
      : sorted.slice(0, Math.min(visibleCount, sorted.length))),
    [sorted, visibleCount, serverPagination, aiResults],
  );

  return (
    <div>
      {/* Unified Search Interface */}
      <div className="sbc-card rounded-2xl overflow-hidden">
        <div className="p-5 space-y-4">
          {/* Main Search Bar with AI */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isAiSearching) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder={locale === "ar" ? "ابحث عن نشاط تجاري... (بحث ذكي)" : "Search businesses... (Smart search)"}
                disabled={isAiSearching}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                disabled={!searchQuery.trim() || isAiSearching}
              >
                {isAiSearching ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiSearch className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Quick Action Buttons - Toggle Group */}
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={activeMode === "advanced" ? "primary" : "secondary"}
                size="sm"
                onClick={() => toggleMode("advanced")}
                className={activeMode === "advanced" ? "ring-2 ring-(--accent) ring-offset-1 ring-offset-(--background)" : ""}
              >
                <FiFilter className="h-3.5 w-3.5" />
                {locale === "ar" ? "فلاتر متقدمة" : "Advanced Filters"}
              </Button>
              
              <Button
                type="button"
                variant={activeMode === "image" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  if (activeMode === "image") {
                    toggleMode("image");
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                disabled={isAiSearching}
                className={activeMode === "image" ? "ring-2 ring-(--accent) ring-offset-1 ring-offset-(--background)" : ""}
              >
                <FiUpload className="h-3.5 w-3.5" />
                {locale === "ar" ? "بحث بالصورة" : "Search by Image"}
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
                disabled={isAiSearching}
              />

              <Button
                type="button"
                variant={activeMode === "chat" ? "primary" : "secondary"}
                size="sm"
                onClick={() => toggleMode("chat")}
                className={activeMode === "chat" ? "ring-2 ring-(--accent) ring-offset-1 ring-offset-(--background)" : ""}
              >
                <FiMessageCircle className="h-3.5 w-3.5" />
                {locale === "ar" ? "محادثة ذكية" : "AI Chat"}
              </Button>

              {(searchQuery || uploadedImage || aiResults || city || tags || categoryId || activeMode !== "none") && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                >
                  <FiX className="h-3.5 w-3.5" />
                  {locale === "ar" ? "مسح الكل" : "Clear All"}
                </Button>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {uploadedImage && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-(--surface-border) bg-(--muted)">
              <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={URL.createObjectURL(uploadedImage)}
                  alt="Preview"
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uploadedImage.name}</p>
                <p className="text-xs text-(--muted-foreground)">
                  {locale === "ar" ? "بحث بصري نشط" : "Visual search active"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedImage(null);
                  setAiResults(null);
                  setActiveMode("none");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex items-center justify-center"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Advanced Filters */}
          {activeMode === "advanced" && (
            <div className="space-y-3 p-4 rounded-xl border border-(--surface-border) bg-(--background) animate-in slide-in-from-top duration-200">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FiFilter className="h-4 w-4" />
                {locale === "ar" ? "الفلاتر المتقدمة" : "Advanced Filters"}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={locale === "ar" ? "المدينة" : "City"}
                />
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={locale === "ar" ? "الوسوم (مثال: مطعم، قهوة)" : "Tags (e.g. cafe, food)"}
                />
                <CategorySelect
                  categories={categories}
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder={locale === "ar" ? "كل التصنيفات" : "All categories"}
                  searchPlaceholder={locale === "ar" ? "ابحث عن تصنيف..." : "Search categories..."}
                  locale={locale}
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-3 text-sm text-foreground shadow-(--shadow) outline-none backdrop-blur transition focus:border-(--accent)"
                >
                  <option value="relevance">
                    {locale === "ar" ? "الترتيب: حسب الصلة" : "Sort: Relevance"}
                  </option>
                  <option value="name-asc">
                    {locale === "ar" ? "الاسم: أ-ي" : "Name: A-Z"}
                  </option>
                  <option value="name-desc">
                    {locale === "ar" ? "الاسم: ي-أ" : "Name: Z-A"}
                  </option>
                  <option value="city-asc">
                    {locale === "ar" ? "المدينة: أ-ي" : "City: A-Z"}
                  </option>
                  <option value="created-desc">
                    {locale === "ar" ? "الأحدث" : "Newest"}
                  </option>
                  <option value="created-asc">
                    {locale === "ar" ? "الأقدم" : "Oldest"}
                  </option>
                  <option value="updated-desc">
                    {locale === "ar" ? "آخر تحديث" : "Recently Updated"}
                  </option>
                  <option value="verified-first">
                    {locale === "ar" ? "الموثق أولاً" : "Verified First"}
                  </option>
                  <option value="special-first">
                    {locale === "ar" ? "المميز أولاً" : "Special First"}
                  </option>
                  <option value="featured-first">
                    {locale === "ar" ? "المُبرز أولاً" : "Featured First"}
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* AI Chat Interface */}
          {activeMode === "chat" && (
            <div className="space-y-3 p-4 rounded-xl border border-(--surface-border) bg-(--background) animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <FiMessageCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                  {locale === "ar" ? "المحادثة الذكية" : "AI Chat Assistant"}
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400">
                    {locale === "ar" ? "ذكاء اصطناعي" : "AI-Powered"}
                  </span>
                </h3>
                {chatMessages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setChatMessages([]);
                      setAiResults(null);
                    }}
                    className="text-xs text-(--muted-foreground) hover:text-red-500 transition flex items-center gap-1"
                  >
                    <FiTrash2 className="h-3 w-3" />
                    {locale === "ar" ? "مسح المحادثة" : "Clear chat"}
                  </button>
                )}
              </div>
              
              <div className="h-[350px] overflow-y-auto rounded-xl border border-(--surface-border) bg-(--surface) p-4 scroll-smooth">
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                        <FiMessageCircle className="h-8 w-8 text-blue-500/60" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">
                        {locale === "ar" ? "مرحباً! كيف أقدر أساعدك؟" : "Hi! How can I help you?"}
                      </h4>
                      <p className="text-(--muted-foreground) text-xs max-w-sm mb-5">
                        {locale === "ar" 
                          ? "اسألني عن أي نشاط تجاري وسأجد لك أفضل النتائج بذكاء"
                          : "Ask me about any business and I'll find the best results for you"}
                      </p>
                      {/* Quick Suggestions */}
                      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                        {(locale === "ar" ? [
                          "أفضل مطاعم في مسقط",
                          "كافيهات قريبة",
                          "صالونات مميزة",
                          "محلات ملابس",
                        ] : [
                          "Best restaurants in Muscat",
                          "Nearby cafes",
                          "Top salons",
                          "Clothing stores",
                        ]).map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleChatSearch(suggestion)}
                            className="text-xs px-3 py-1.5 rounded-full border border-(--surface-border) bg-(--background) hover:bg-(--accent) hover:text-(--accent-foreground) transition-colors flex items-center gap-1"
                          >
                            <FiArrowRight className="h-3 w-3" />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom duration-300`}
                        >
                          {msg.role === "assistant" && (
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 me-2">
                              <FiMessageCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              msg.role === "user"
                                ? "bg-(--accent) text-(--accent-foreground)"
                                : "bg-(--muted) text-(--foreground) border border-(--surface-border)"
                            }`}
                          >
                            {msg.role === "assistant" ? (
                              <div className="whitespace-pre-wrap break-words [&_strong]:font-semibold [&_strong]:text-(--foreground) leading-relaxed text-[13px]">
                                {msg.content.split('\n').map((line, i) => {
                                  // Bold text
                                  const parts = line.split(/\*\*(.+?)\*\*/g);
                                  return (
                                    <span key={i}>
                                      {parts.map((part, j) =>
                                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                      )}
                                      {i < msg.content.split('\n').length - 1 && <br />}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start animate-in fade-in duration-200">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 me-2">
                            <FiMessageCircle className="h-3 w-3 text-white" />
                          </div>
                          <div className="bg-(--muted) text-(--foreground) rounded-2xl px-4 py-3 border border-(--surface-border) shadow-sm">
                            <div className="flex gap-1.5 items-center">
                              <span className="text-xs text-(--muted-foreground) me-1">
                                {locale === "ar" ? "جاري البحث" : "Searching"}
                              </span>
                              <span className="w-1.5 h-1.5 bg-(--foreground) rounded-full animate-bounce" style={{animationDelay: "0ms"}}></span>
                              <span className="w-1.5 h-1.5 bg-(--foreground) rounded-full animate-bounce" style={{animationDelay: "150ms"}}></span>
                              <span className="w-1.5 h-1.5 bg-(--foreground) rounded-full animate-bounce" style={{animationDelay: "300ms"}}></span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isTyping && chatInput.trim()) {
                      e.preventDefault();
                      handleChatSearch();
                    }
                  }}
                  placeholder={locale === "ar" ? "اسأل عن أي نشاط تجاري..." : "Ask about any business..."}
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleChatSearch();
                  }}
                  disabled={!chatInput.trim() || isTyping}
                  className="min-w-[44px]"
                >
                  {isTyping ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-(--surface-border) text-sm">
            <div className="flex items-center gap-2">
              {aiResults && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  <FiZap className="h-3 w-3" />
                  {locale === "ar" ? "بحث ذكي" : "AI Search"}
                </span>
              )}
              <span className="text-(--muted-foreground)">
                {locale === "ar" 
                  ? `${filtered.length} نتيجة`
                  : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            
            {!isReady && (
              <div className="text-xs text-(--muted-foreground) flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                {locale === "ar" ? "جاري تحميل AI..." : "Loading AI..."}
              </div>
            )}
          </div>
        </div>
      </div>

      {onToggleLike && onToggleSave && engagementByBusiness ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBusinesses.map((b) => {
            const engagement = (serverPagination ? serverEngagementByBusiness[b.id] : engagementByBusiness?.[b.id]) ?? {
              initialLikeCount: 0,
              initialLiked: false,
              initialSaved: false,
              commentCount: 0,
            };

            return (
              <BusinessFeedCard
                key={b.id}
                business={b}
                locale={locale}
                categoryName={engagement.categoryName}
                categoryIconId={engagement.categoryIconId}
                initialLikeCount={engagement.initialLikeCount}
                initialLiked={engagement.initialLiked}
                initialSaved={engagement.initialSaved}
                commentCount={engagement.commentCount}
                onToggleLike={onToggleLike}
                onToggleSave={onToggleSave}
                detailsBasePath={detailsBasePath}
                hasStories={serverPagination ? serverStoryIds.has(b.id) : businessIdsWithStories.has(b.id)}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBusinesses.map((b) => {
            const name = locale === "ar" ? b.name.ar : b.name.en;
            const description = b.description ? (locale === "ar" ? b.description.ar : b.description.en) : "";
            const img = b.media?.cover || b.media?.banner || b.media?.logo;
            const logo = b.media?.logo;
            const hasStories = serverPagination ? serverStoryIds.has(b.id) : businessIdsWithStories.has(b.id);

            const href = b.username
              ? `/@${b.username}`
              : `/${locale}${detailsBasePath}/${b.slug}`;

            return (
              <Link
                key={b.id}
                href={href}
                className="group sbc-card sbc-card--interactive overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-square w-full bg-linear-to-br from-accent/10 via-accent-2/10 to-transparent">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={name} className="h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Business Logo with story ring */}
                      {logo && (
                        <div className={`rounded-full p-[2px] flex-shrink-0 ${hasStories ? "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600" : ""}`}>
                          <div className={`rounded-full ${hasStories ? "p-[2px] bg-black/50" : ""}`}>
                            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/30 shadow-lg">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={logo} alt={name} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="truncate text-base font-semibold text-white drop-shadow">
                        {name}
                      </div>
                      {b.isVerified ? (
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-blue-200"
                          aria-label={locale === "ar" ? "نشاط موثق" : "Verified business"}
                          title={locale === "ar" ? "نشاط موثق" : "Verified business"}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 1.5l2.39 1.25 2.64.32 1.86 1.86.32 2.64L18.5 10l-1.29 2.43-.32 2.64-1.86 1.86-2.64.32L10 18.5l-2.43-1.29-2.64-.32-1.86-1.86-.32-2.64L1.5 10l1.25-2.39.32-2.64 1.86-1.86 2.64-.32L10 1.5zm-1 10.2l-2.2-2.2-1.4 1.4 3.6 3.6 6-6-1.4-1.4-4.6 4.6z" />
                          </svg>
                        </span>
                      ) : null}
                    </div>
                    {b.isSpecial ? (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.95a1 1 0 00.95.69h4.153c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.95c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.176 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.285-3.95a1 1 0 00-.364-1.118l-3.36-2.44c-.783-.57-.38-1.81.588-1.81h4.153a1 1 0 00.95-.69l1.286-3.95z" />
                        </svg>
                        {locale === "ar" ? "مميز" : "Special"}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="p-5">
                  {description ? (
                    <MarkdownRenderer
                      content={description}
                      className="text-sm text-(--muted-foreground) [&>p]:m-0 [&>p]:line-clamp-2 [&>p]:overflow-hidden [&>p]:text-ellipsis [&>p]:break-words [&_a]:text-(--accent) [&_a]:underline"
                    />
                  ) : (
                    <p className="text-sm text-(--muted-foreground)">
                      {locale === "ar" ? "لا يوجد وصف" : "No description"}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--muted-foreground)">
                    <span className="font-mono">/{b.slug}</span>
                    {b.city ? <span className="sbc-chip rounded-full px-2 py-0.5">{b.city}</span> : null}
                    {b.tags?.slice(0, 5).map((t) => (
                      <span key={t} className="sbc-chip rounded-full px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {(serverPagination && !aiResults ? serverPage < serverTotalPages : visibleBusinesses.length < sorted.length) ? (
        <div className="mt-6">
          <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />
          <div className="mt-3 text-center text-xs text-(--muted-foreground)">
            {locale === "ar"
              ? `عرض ${visibleBusinesses.length} من ${serverPagination && !aiResults ? serverTotal : sorted.length}`
              : `Showing ${visibleBusinesses.length} of ${serverPagination && !aiResults ? serverTotal : sorted.length}`}
            {isServerLoading ? (locale === "ar" ? "... جارٍ التحميل" : "... loading") : ""}
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="mt-10 text-center text-(--muted-foreground)">
          {dict.businesses.empty}
        </div>
      ) : null}
    </div>
  );
}
