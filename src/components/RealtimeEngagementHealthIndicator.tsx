"use client";

import { useMemo, useState } from "react";

import { useBusinessEngagementRealtimeHealth } from "@/lib/hooks/useBusinessEngagementRealtime";

function shouldEnableDebug(): boolean {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get("rtdebug") === "1") {
    localStorage.setItem("sbc_realtime_debug", "1");
    return true;
  }

  if (params.get("rtdebug") === "0") {
    localStorage.removeItem("sbc_realtime_debug");
    return false;
  }

  return localStorage.getItem("sbc_realtime_debug") === "1";
}

export function RealtimeEngagementHealthIndicator() {
  const health = useBusinessEngagementRealtimeHealth();
  const [enabled] = useState(() => shouldEnableDebug());

  const badge = useMemo(() => {
    if (health.mode === "sse") return { label: "SSE", cls: "bg-emerald-500/15 text-emerald-600" };
    if (health.mode === "fallback") return { label: "FB", cls: "bg-amber-500/15 text-amber-600" };
    return { label: "IDLE", cls: "bg-slate-500/15 text-slate-600" };
  }, [health.mode]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-3 right-3 z-[120] pointer-events-none">
      <div className="rounded-xl border border-(--surface-border) bg-(--surface) px-2.5 py-1.5 text-[10px] font-medium shadow-[var(--shadow)] backdrop-blur">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-1.5 py-0.5 font-semibold ${badge.cls}`}>{badge.label}</span>
          <span className="text-(--muted-foreground)">{health.subscribedBusinesses} ids</span>
          <span className="text-(--muted-foreground)">r{health.reconnectAttempts}</span>
          <span className="text-(--muted-foreground)">e{health.streamErrors}</span>
        </div>
      </div>
    </div>
  );
}
