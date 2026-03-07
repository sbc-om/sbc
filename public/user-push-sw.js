/* User Web Push Service Worker
 *
 * This is intentionally small and framework-agnostic.
 * It shows a notification when a push arrives, supports opening a URL,
 * and runtime-caches map tiles for the Oman-focused map views.
 */

const MAP_TILE_CACHE = "sbc-map-tiles-v1";
const MAP_TILE_HOSTS = new Set([
  "a.basemaps.cartocdn.com",
  "b.basemaps.cartocdn.com",
  "c.basemaps.cartocdn.com",
  "d.basemaps.cartocdn.com",
  "a.tile.openstreetmap.org",
  "b.tile.openstreetmap.org",
  "c.tile.openstreetmap.org",
]);

function isMapTileRequest(url) {
  return MAP_TILE_HOSTS.has(url.hostname);
}

async function cacheMapTile(request, response) {
  if (!response || !(response.ok || response.type === "opaque")) return response;
  const cache = await caches.open(MAP_TILE_CACHE);
  await cache.put(request, response.clone());
  return response;
}

async function warmMapTiles(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return;

  const cache = await caches.open(MAP_TILE_CACHE);
  await Promise.allSettled(
    urls.slice(0, 36).map(async (url) => {
      if (typeof url !== "string") return;
      const request = new Request(url, { mode: "cors", credentials: "omit" });
      const cached = await cache.match(request);
      if (cached) return;
      const response = await fetch(request);
      if (response.ok || response.type === "opaque") {
        await cache.put(request, response.clone());
      }
    })
  );
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("sbc-map-tiles-") && name !== MAP_TILE_CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // ignore
  }

  const title = typeof data.title === "string" ? data.title : "Notification";
  const body = typeof data.body === "string" ? data.body : "";
  const url = typeof data.url === "string" ? data.url : undefined;
  const icon = typeof data.iconUrl === "string" ? data.iconUrl : undefined;

  const options = {
    body,
    icon,
    badge: icon,
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification && event.notification.data ? event.notification.data.url : undefined;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (url) {
        // Focus an existing tab if possible.
        for (const client of allClients) {
          if (client.url === url && "focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }

      // Fallback: focus any open client.
      if (allClients.length > 0 && "focus" in allClients[0]) return allClients[0].focus();
      return undefined;
    })()
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "SBC_MAP_WARM_TILES") return;
  event.waitUntil(warmMapTiles(event.data.urls));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!isMapTileRequest(url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(MAP_TILE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        return cacheMapTile(request, response);
      } catch (error) {
        const fallback = await cache.match(request);
        if (fallback) return fallback;
        throw error;
      }
    })()
  );
});
