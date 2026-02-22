export type TtlCache<T> = {
  get: (key: string) => T | null;
  set: (key: string, value: T) => void;
  clear: () => void;
};

export function createTtlCache<T>(ttlMs: number, maxEntries: number): TtlCache<T> {
  const cache = new Map<string, { cachedAt: number; value: T }>();

  return {
    get(key: string) {
      const entry = cache.get(key);
      if (!entry) return null;
      if (Date.now() - entry.cachedAt > ttlMs) {
        cache.delete(key);
        return null;
      }
      return entry.value;
    },
    set(key: string, value: T) {
      if (cache.size >= maxEntries) {
        const firstKey = cache.keys().next().value;
        if (firstKey) cache.delete(firstKey);
      }
      cache.set(key, { cachedAt: Date.now(), value });
    },
    clear() {
      cache.clear();
    },
  };
}
