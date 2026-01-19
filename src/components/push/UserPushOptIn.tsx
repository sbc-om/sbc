"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type State =
  | { kind: "unsupported" }
  | { kind: "not-configured" }
  | { kind: "idle"; subscribed: boolean; permission: NotificationPermission }
  | { kind: "busy"; subscribed: boolean; permission: NotificationPermission }
  | { kind: "error"; message: string; subscribed: boolean; permission: NotificationPermission };

export function UserPushOptIn({ dir = "ltr" }: { dir?: "ltr" | "rtl" }) {
  const [state, setState] = useState<State>({ kind: "idle", subscribed: false, permission: "default" });

  const t = useMemo(() => {
    return {
      title: dir === "rtl" ? "الإشعارات" : "Notifications",
      subtitle:
        dir === "rtl"
          ? "فعّل الإشعارات لتستلم أحدث التحديثات من المنصة."
          : "Enable notifications to receive important updates from the platform.",
      enable: dir === "rtl" ? "تفعيل الإشعارات" : "Enable notifications",
      disable: dir === "rtl" ? "إيقاف الإشعارات" : "Disable notifications",
      notSupported:
        dir === "rtl"
          ? "المتصفح لا يدعم Web Push على هذا الجهاز."
          : "Web Push is not supported in this browser on this device.",
      notConfigured:
        dir === "rtl"
          ? "الإشعارات غير مفعلة على الخادم بعد."
          : "Notifications are not configured on the server yet.",
      permissionDenied:
        dir === "rtl"
          ? "تم رفض الإذن. يمكنك تغييره من إعدادات المتصفح."
          : "Permission is denied. You can change it in your browser settings.",
    };
  }, [dir]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supported) {
        if (!cancelled) setState({ kind: "unsupported" });
        return;
      }

      const vapidRes = await fetch("/api/push/vapid", { cache: "no-store" });
      if (!vapidRes.ok) {
        if (!cancelled) setState({ kind: "not-configured" });
        return;
      }

      // Use the global service worker registration if it exists
      let reg = await navigator.serviceWorker.getRegistration("/");
      if (!reg) {
        reg = await navigator.serviceWorker.register("/user-push-sw.js", { scope: "/" });
      }
      const sub = await reg.pushManager.getSubscription();
      const permission = Notification.permission;

      if (!cancelled) setState({ kind: "idle", subscribed: Boolean(sub), permission });

      if (sub) {
        await fetch("/api/push/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub }),
        });
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    if (state.kind === "unsupported" || state.kind === "not-configured") return;

    const permission = Notification.permission;
    if (permission === "denied") {
      setState({ kind: "idle", subscribed: false, permission });
      return;
    }

    setState({ kind: "busy", subscribed: state.kind === "idle" ? state.subscribed : false, permission });

    try {
      const p = permission === "default" ? await Notification.requestPermission() : permission;
      if (p !== "granted") {
        setState({ kind: "idle", subscribed: false, permission: p });
        return;
      }

      const vapidRes = await fetch("/api/push/vapid", { cache: "no-store" });
      const vapidJson = (await vapidRes.json()) as { ok: true; publicKey: string } | { ok: false; error: string };
      if (!vapidRes.ok || !vapidJson.ok) throw new Error("WEB_PUSH_NOT_CONFIGURED");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidJson.publicKey),
      });

      const saveRes = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });

      if (!saveRes.ok) throw new Error(`SUBSCRIBE_HTTP_${saveRes.status}`);

      setState({ kind: "idle", subscribed: true, permission: "granted" });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "SUBSCRIBE_FAILED",
        subscribed: false,
        permission: Notification.permission,
      });
    }
  }

  async function disable() {
    if (state.kind === "unsupported" || state.kind === "not-configured") return;

    setState({
      kind: "busy",
      subscribed: state.kind === "idle" ? state.subscribed : false,
      permission: state.kind === "idle" ? state.permission : "default",
    });

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await fetch("/api/push/subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });

        await sub.unsubscribe();
      }

      setState({ kind: "idle", subscribed: false, permission: Notification.permission });
    } catch (e) {
      setState({
        kind: "error",
        message: e instanceof Error ? e.message : "UNSUBSCRIBE_FAILED",
        subscribed: state.kind === "idle" ? state.subscribed : false,
        permission: Notification.permission,
      });
    }
  }

  const containerDirClass = dir === "rtl" ? "text-right" : "text-left";

  return (
    <div className={cn("rounded-2xl border border-(--surface-border) bg-(--surface) p-5", containerDirClass)} dir={dir}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{t.title}</div>
          <div className="mt-1 text-xs text-(--muted-foreground)">{t.subtitle}</div>
        </div>
        {state.kind === "idle" || state.kind === "busy" || state.kind === "error" ? (
          <div className="shrink-0">
            {state.subscribed ? (
              <Button type="button" size="sm" variant="secondary" disabled={state.kind === "busy"} onClick={disable}>
                {t.disable}
              </Button>
            ) : (
              <Button type="button" size="sm" variant="primary" disabled={state.kind === "busy"} onClick={enable}>
                {t.enable}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {state.kind === "unsupported" ? (
        <div className="mt-3 text-xs text-(--muted-foreground)">{t.notSupported}</div>
      ) : null}

      {state.kind === "not-configured" ? (
        <div className="mt-3 text-xs text-(--muted-foreground)">{t.notConfigured}</div>
      ) : null}

      {state.kind === "idle" && state.permission === "denied" ? (
        <div className="mt-3 text-xs text-(--muted-foreground)">{t.permissionDenied}</div>
      ) : null}

      {state.kind === "error" ? (
        <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
          {state.message}
        </div>
      ) : null}
    </div>
  );
}
