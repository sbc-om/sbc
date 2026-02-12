"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  borderClassName: string;
  glowColor?: string;
}

export function DashboardCard({ children, borderClassName, glowColor = "rgba(var(--accent-rgb, 99 102 241) / 0.15)" }: DashboardCardProps) {
  const ref = useRef<HTMLElement>(null);
  const [glow, setGlow] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setGlow({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setGlow((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={
        "group relative overflow-hidden rounded-2xl border-2 bg-(--surface) p-6 backdrop-blur-sm shadow-sm transition-shadow duration-300 ease-out " +
        borderClassName +
        " hover:shadow-lg"
      }
    >
      {/* Radial glow that follows the cursor */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity: glow.opacity,
          background: `radial-gradient(600px circle at ${glow.x}px ${glow.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      {/* Content */}
      <div className="relative">{children}</div>
    </section>
  );
}
