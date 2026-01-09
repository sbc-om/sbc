"use client";

import { useEffect, useRef } from "react";
import { OverlayScrollbars } from "overlayscrollbars";

function getScrollbarTheme() {
  // These themes come from OverlayScrollbars' default CSS.
  // Keep it aligned with our `dark` class toggling.
  return document.documentElement.classList.contains("dark")
    ? "os-theme-dark"
    : "os-theme-light";
}

export function OverlayScrollbarsInit() {
  const instanceRef = useRef<ReturnType<typeof OverlayScrollbars> | null>(null);

  useEffect(() => {
    // Avoid double-init (React StrictMode/dev can re-run effects).
    if (instanceRef.current) return;

    const el = document.body;

    const instance = OverlayScrollbars(el, {
      scrollbars: {
        theme: getScrollbarTheme(),
        autoHide: "leave",
        autoHideDelay: 800,
        dragScroll: true,
        clickScroll: true,
      },
    });

    instanceRef.current = instance;

    // Keep theme in sync when `.dark` toggles.
    const observer = new MutationObserver(() => {
      const nextTheme = getScrollbarTheme();
      instance.options({
        scrollbars: {
          theme: nextTheme,
        },
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  return null;
}
