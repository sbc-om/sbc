"use client";

import { useRef, useCallback, useEffect, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DashboardCardProps {
  children: ReactNode;
  borderClassName: string;
  glowColor?: string;
  className?: string;
  style?: CSSProperties;
}

export function DashboardCard({
  children,
  borderClassName,
  glowColor = "rgba(0, 121, 244, 0.16)",
  className,
  style,
}: DashboardCardProps) {
  const ref = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty("--dash-glow-x", `${x}px`);
      el.style.setProperty("--dash-glow-y", `${y}px`);
      el.style.setProperty("--dash-glow-opacity", "1");
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--dash-glow-opacity", "0");
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        "group relative isolate overflow-hidden rounded-3xl border bg-(--surface) p-4 shadow-(--shadow) transition-[box-shadow,border-color,background-color] duration-300 ease-out sm:p-5 lg:p-6",
        "hover:shadow-[var(--shadow-hover)]",
        borderClassName,
        className,
      )}
      style={
        {
          "--dash-glow-x": "50%",
          "--dash-glow-y": "50%",
          "--dash-glow-opacity": "0",
          ...style,
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300"
        style={{
          opacity: "var(--dash-glow-opacity)",
          background: `radial-gradient(420px circle at var(--dash-glow-x) var(--dash-glow-y), ${glowColor}, transparent 56%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/15 to-transparent dark:from-white/8" />
      <div className="relative">{children}</div>
    </section>
  );
}
