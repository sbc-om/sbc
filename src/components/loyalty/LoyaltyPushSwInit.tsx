"use client";

import { useEffect } from "react";

/**
 * Registers the Loyalty Web Push service worker globally.
 *
 * Notes:
 * - This does NOT request notification permission.
 * - Subscribing still requires a user gesture via `LoyaltyPushOptIn`.
 */
export function LoyaltyPushSwInit() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supported) return;

      try {
        // Ensure the SW is installed so a later push subscription can work
        // without needing to open a specific page.
        await navigator.serviceWorker.register("/loyalty-push-sw.js", { scope: "/" });

        // Best-effort: wait until ready to avoid race conditions in other components.
        await navigator.serviceWorker.ready;
      } catch {
        // ignore (unsupported environment / user settings)
      }

      if (cancelled) return;
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
