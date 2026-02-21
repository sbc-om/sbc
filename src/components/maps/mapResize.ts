type LeafletLikeMap = {
  invalidateSize: () => void;
  getContainer: () => HTMLElement;
};

export function attachMapResizeStabilizer(
  map: LeafletLikeMap,
  delays: number[] = [120, 320],
): () => void {
  const refresh = () => {
    try {
      map.invalidateSize();
    } catch {
      return;
    }
  };

  refresh();
  const frameId = window.requestAnimationFrame(refresh);
  const timers = delays.map((delay) => window.setTimeout(refresh, delay));
  const observer = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(() => refresh())
    : null;

  observer?.observe(map.getContainer());
  window.addEventListener("resize", refresh);

  return () => {
    window.cancelAnimationFrame(frameId);
    for (const timer of timers) window.clearTimeout(timer);
    observer?.disconnect();
    window.removeEventListener("resize", refresh);
  };
}
