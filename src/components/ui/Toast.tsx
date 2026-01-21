"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { HiOutlineInformationCircle, HiOutlineShare } from "react-icons/hi2";

import { cn } from "@/lib/cn";

type ToastVariant = "default" | "success" | "error";

type ToastInput = {
  message: string;
  description?: string;
  variant?: ToastVariant;
  icon?: "share" | "info";
  durationMs?: number;
};
function ToastIcon({ name }: { name: "share" | "info" }) {
  if (name === "share") {
    return <HiOutlineShare className="h-6 w-6" aria-hidden="true" />;
  }

  return <HiOutlineInformationCircle className="h-6 w-6" aria-hidden="true" />;
}


type ToastItem = ToastInput & {
  id: string;
};

type ToastApi = {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

function toastStyle(variant: ToastVariant | undefined) {
  void variant;
  return {
    className: "text-foreground border-(--surface-border)",
    style: {
      background:
        "linear-gradient(135deg, rgba(var(--surface-rgb, 255,255,255), 0.92), rgba(var(--surface-rgb, 255,255,255), 0.68))",
    } as React.CSSProperties,
  };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const durationMs = input.durationMs ?? 2200;
      setItems((prev) => [...prev, { ...input, id }]);
      if (durationMs > 0) {
        const timer = window.setTimeout(() => dismiss(id), durationMs);
        timers.current.set(id, timer);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-6 z-50 flex flex-col items-center gap-2">
        {items.map((item) => (
          (() => {
            const styles = toastStyle(item.variant);
            return (
          <div
            key={item.id}
            className={cn(
                  "pointer-events-auto inline-flex max-w-[90vw] rounded-lg border px-4 py-3 text-center text-sm shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition",
              styles.className,
            )}
            style={styles.style}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center justify-center text-[color:var(--accent)]">
                <ToastIcon name={item.icon ?? "info"} />
              </span>
              <div className="font-medium">{item.message}</div>
            </div>
            {item.description ? (
              <div className="mt-0.5 text-xs text-[color:rgba(var(--foreground-rgb,0,0,0),0.78)]">
                {item.description}
              </div>
            ) : null}
          </div>
            );
          })()
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
