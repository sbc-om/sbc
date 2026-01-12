/* Loyalty Web Push Service Worker
 *
 * This is intentionally small and framework-agnostic.
 * It shows a notification when a push arrives and supports opening a URL.
 */

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
