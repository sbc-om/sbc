type LeafletLikeMap = {
  invalidateSize: () => void;
  getContainer: () => HTMLElement;
};

/**
 * Stabilise Leaflet map dimensions across layout shifts, tab switches, and
 * mobile browser chrome animations (iOS Safari address-bar, etc.).
 *
 * Fires `invalidateSize()` eagerly on mount, after several staggered delays,
 * whenever the container resizes, and whenever the page becomes visible again.
 */
export function attachMapResizeStabilizer(
  map: LeafletLikeMap,
  delays: number[] = [100, 300, 600, 1200],
): () => void {
  const refresh = () => {
    try {
      map.invalidateSize();
    } catch {
      return;
    }
  };

  /* ── Immediate + rAF ── */
  refresh();
  const frameId = window.requestAnimationFrame(refresh);

  /* ── Staggered timers (covers slow mobile renders) ── */
  const timers = delays.map((delay) => window.setTimeout(refresh, delay));

  /* ── ResizeObserver for container size changes ── */
  const observer =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => refresh())
      : null;
  observer?.observe(map.getContainer());

  /* ── Window resize (orientation change, keyboard, etc.) ── */
  window.addEventListener("resize", refresh);

  /* ── Visibility change (tab switch / app resume) ── */
  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      // Two-phase refresh: immediate + delayed (browser may still be
      // finishing the layout after coming back to the tab).
      refresh();
      window.setTimeout(refresh, 200);
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.cancelAnimationFrame(frameId);
    for (const timer of timers) window.clearTimeout(timer);
    observer?.disconnect();
    window.removeEventListener("resize", refresh);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
