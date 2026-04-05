"use client";

import { useEffect } from "react";

/**
 * Attaches a mouse-following radial glow to every `.sbc-card` element.
 * Uses CSS custom properties and a single document-level pointer listener
 * for performance (no per-card React state).
 */
export function CardGlowInit() {
  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (e.pointerType === "touch") return;

      const target = e.target;
      if (!(target instanceof Element)) return;

      const card = target.closest<HTMLElement>(".sbc-card");
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty("--card-glow-x", `${x}px`);
      card.style.setProperty("--card-glow-y", `${y}px`);
      card.style.setProperty("--card-glow-opacity", "1");
    }

    function onPointerLeave(e: PointerEvent) {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const card = target.closest<HTMLElement>(".sbc-card");
      if (card) {
        card.style.setProperty("--card-glow-opacity", "0");
      }
    }

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onPointerLeave, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerLeave);
    };
  }, []);

  return null;
}
