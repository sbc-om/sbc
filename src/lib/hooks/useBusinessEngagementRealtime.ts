"use client";

import { useEffect, useState } from "react";

type EngagementCounts = { likes: number; comments: number };
type CountsMap = Record<string, EngagementCounts>;
type Listener = (counts: EngagementCounts) => void;
type HealthListener = (status: RealtimeEngagementHealth) => void;

export type RealtimeEngagementHealthMode = "idle" | "sse" | "fallback";
export type RealtimeEngagementHealth = {
  mode: RealtimeEngagementHealthMode;
  subscribedBusinesses: number;
  reconnectAttempts: number;
  streamErrors: number;
  visible: boolean;
  lastUpdateAt: number;
};

const listenersByBusinessId = new Map<string, Set<Listener>>();
const latestCountsByBusinessId = new Map<string, EngagementCounts>();
const activeBusinessIds = new Set<string>();
const healthListeners = new Set<HealthListener>();

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let fallbackPollTimer: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;
let streamErrorStreak = 0;
let activeIdsSignature = "";
let visibilityListenerInitialized = false;
let lastReportedAt = 0;
let lastReportedKey = "";

const FAST_RECONNECT_MS = 60;
const RECONNECT_BASE_MS = 500;
const RECONNECT_MAX_MS = 15000;
const FALLBACK_POLL_MS = 5000;
const FALLBACK_ERROR_THRESHOLD = 2;
const HEALTH_LOG_MIN_INTERVAL_MS = 60000;
const HEALTH_LOG_MAX_INTERVAL_MS = 300000;

let health: RealtimeEngagementHealth = {
  mode: "idle",
  subscribedBusinesses: 0,
  reconnectAttempts: 0,
  streamErrors: 0,
  visible: true,
  lastUpdateAt: Date.now(),
};

function isPageVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible";
}

function emitHealth(patch?: Partial<RealtimeEngagementHealth>) {
  if (patch) {
    health = {
      ...health,
      ...patch,
      subscribedBusinesses: activeBusinessIds.size,
      visible: isPageVisible(),
      lastUpdateAt: Date.now(),
    };
  } else {
    health = {
      ...health,
      subscribedBusinesses: activeBusinessIds.size,
      visible: isPageVisible(),
      lastUpdateAt: Date.now(),
    };
  }

  for (const listener of healthListeners) {
    listener(health);
  }

  reportHealthIfNeeded();
}

function makeHealthKey(state: RealtimeEngagementHealth): string {
  return [
    state.mode,
    state.subscribedBusinesses,
    state.visible ? 1 : 0,
    state.reconnectAttempts,
    state.streamErrors,
  ].join("|");
}

function reportHealthIfNeeded() {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const key = makeHealthKey(health);
  const keyChanged = key !== lastReportedKey;
  const dueByTime = now - lastReportedAt >= HEALTH_LOG_MAX_INTERVAL_MS;
  const withinCooldown = now - lastReportedAt < HEALTH_LOG_MIN_INTERVAL_MS;

  if (!keyChanged && !dueByTime) return;
  if (withinCooldown && !dueByTime) return;

  lastReportedAt = now;
  lastReportedKey = key;

  void fetch("/api/realtime/engagement-health", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: health.mode,
      subscribedBusinesses: health.subscribedBusinesses,
      reconnectAttempts: health.reconnectAttempts,
      streamErrors: health.streamErrors,
      visible: health.visible,
      source: "client-hook",
      path: window.location.pathname,
    }),
  }).catch(() => {
    // no-op: diagnostics logging must never break UX
  });
}

export function subscribeRealtimeEngagementHealth(listener: HealthListener) {
  healthListeners.add(listener);
  listener(health);
  return () => {
    healthListeners.delete(listener);
  };
}

export function getRealtimeEngagementHealth(): RealtimeEngagementHealth {
  return health;
}

function getBackoffDelayMs(): number {
  reconnectAttempts += 1;
  emitHealth({ reconnectAttempts });
  const exponential = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** (reconnectAttempts - 1));
  const jitter = Math.floor(Math.random() * 250);
  return exponential + jitter;
}

function closeStream() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    if (activeBusinessIds.size === 0) {
      emitHealth({ mode: "idle" });
    }
  }
}

function stopFallbackPolling() {
  if (fallbackPollTimer) {
    clearInterval(fallbackPollTimer);
    fallbackPollTimer = null;
    emitHealth({ mode: eventSource ? "sse" : activeBusinessIds.size > 0 ? "sse" : "idle" });
  }
}

function notifyBusiness(businessId: string, counts: EngagementCounts) {
  latestCountsByBusinessId.set(businessId, counts);
  const listeners = listenersByBusinessId.get(businessId);
  if (!listeners) return;
  for (const listener of listeners) {
    listener(counts);
  }
}

function applyCountsMap(map: CountsMap | undefined) {
  if (!map) return;
  for (const [businessId, counts] of Object.entries(map)) {
    if (!businessId) continue;
    if (!counts || typeof counts.likes !== "number" || typeof counts.comments !== "number") continue;
    notifyBusiness(businessId, counts);
  }
}

function buildIdsParam(): string {
  return Array.from(activeBusinessIds).sort().join(",");
}

function connectStream() {
  if (activeBusinessIds.size === 0) {
    closeStream();
    activeIdsSignature = "";
    emitHealth({ mode: "idle" });
    return;
  }

  if (!isPageVisible()) {
    closeStream();
    emitHealth({ mode: fallbackPollTimer ? "fallback" : "idle" });
    return;
  }

  const idsParam = buildIdsParam();
  if (!idsParam) {
    closeStream();
    activeIdsSignature = "";
    emitHealth({ mode: "idle" });
    return;
  }

  if (eventSource && activeIdsSignature === idsParam) {
    emitHealth({ mode: fallbackPollTimer ? "fallback" : "sse" });
    return;
  }

  closeStream();
  activeIdsSignature = idsParam;
  eventSource = new EventSource(`/api/business-engagement/stream?ids=${encodeURIComponent(idsParam)}`);
  emitHealth({ mode: "sse" });

  eventSource.onopen = () => {
    reconnectAttempts = 0;
    streamErrorStreak = 0;
    stopFallbackPolling();
    emitHealth({ mode: "sse", reconnectAttempts: 0, streamErrors: 0 });
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as { type?: "connected" | "update"; counts?: CountsMap };
      if (data.type === "connected" || data.type === "update") {
        applyCountsMap(data.counts);
      }
    } catch {
      // ignore malformed payloads
    }
  };

  eventSource.onerror = () => {
    streamErrorStreak += 1;
    emitHealth({ streamErrors: streamErrorStreak });
    closeStream();
    if (streamErrorStreak >= FALLBACK_ERROR_THRESHOLD) {
      startFallbackPolling();
    }
    scheduleReconnect(getBackoffDelayMs());
  };
}

async function fetchCountsSnapshot() {
  if (activeBusinessIds.size === 0) return;
  if (!isPageVisible()) return;

  const idsParam = buildIdsParam();
  if (!idsParam) return;

  try {
    const res = await fetch(`/api/business-engagement/counts?ids=${encodeURIComponent(idsParam)}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as { ok?: boolean; counts?: CountsMap };
    if (!data.ok) return;
    applyCountsMap(data.counts);
  } catch {
    // ignore fallback polling errors
  }
}

function startFallbackPolling() {
  if (fallbackPollTimer) return;
  emitHealth({ mode: "fallback" });
  fallbackPollTimer = setInterval(() => {
    void fetchCountsSnapshot();
  }, FALLBACK_POLL_MS);
}

function scheduleReconnect(delayMs = 80) {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (activeBusinessIds.size === 0) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectStream();
  }, delayMs);
}

function initializeVisibilityListener() {
  if (visibilityListenerInitialized) return;
  if (typeof document === "undefined") return;

  visibilityListenerInitialized = true;
  document.addEventListener("visibilitychange", () => {
    emitHealth();
    if (isPageVisible()) {
      scheduleReconnect(FAST_RECONNECT_MS);
      if (streamErrorStreak >= FALLBACK_ERROR_THRESHOLD) {
        startFallbackPolling();
        void fetchCountsSnapshot();
      }
    } else {
      closeStream();
      stopFallbackPolling();
    }
  });
}

function subscribeBusinessId(businessId: string, listener: Listener) {
  initializeVisibilityListener();

  if (!listenersByBusinessId.has(businessId)) {
    listenersByBusinessId.set(businessId, new Set());
  }

  listenersByBusinessId.get(businessId)!.add(listener);

  const alreadyActive = activeBusinessIds.has(businessId);
  activeBusinessIds.add(businessId);
  emitHealth({ mode: eventSource ? "sse" : fallbackPollTimer ? "fallback" : "idle" });

  const cached = latestCountsByBusinessId.get(businessId);
  if (cached) {
    listener(cached);
  }

  if (!alreadyActive) {
    scheduleReconnect(FAST_RECONNECT_MS);
  }

  return () => {
    const listeners = listenersByBusinessId.get(businessId);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        listenersByBusinessId.delete(businessId);
      }
    }

    if (!listenersByBusinessId.has(businessId) && activeBusinessIds.has(businessId)) {
      activeBusinessIds.delete(businessId);
      emitHealth({ mode: activeBusinessIds.size === 0 ? "idle" : eventSource ? "sse" : fallbackPollTimer ? "fallback" : "idle" });
      if (activeBusinessIds.size === 0) {
        activeIdsSignature = "";
        closeStream();
        stopFallbackPolling();
      } else {
        scheduleReconnect(FAST_RECONNECT_MS);
      }
    }

    if (activeBusinessIds.size === 0 && !reconnectTimer) {
      activeIdsSignature = "";
      closeStream();
      stopFallbackPolling();
      emitHealth({ mode: "idle" });
    }
  };
}

export function useBusinessEngagementRealtime(
  businessId: string,
  initial: EngagementCounts
): EngagementCounts {
  const [counts, setCounts] = useState<EngagementCounts>(() => initial);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCounts(initial);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [businessId, initial]);

  useEffect(() => {
    if (!businessId) return;
    return subscribeBusinessId(businessId, setCounts);
  }, [businessId]);

  return counts;
}

export function useBusinessEngagementRealtimeHealth(): RealtimeEngagementHealth {
  const [state, setState] = useState<RealtimeEngagementHealth>(getRealtimeEngagementHealth());

  useEffect(() => {
    return subscribeRealtimeEngagementHealth(setState);
  }, []);

  return state;
}
