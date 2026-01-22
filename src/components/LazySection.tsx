"use client";

import { Suspense, type ReactNode } from "react";
import { FadeInSection } from "./FadeInSection";

type LazySection = {
  children: ReactNode;
  /** Fallback to show while loading */
  fallback?: ReactNode;
  /** Fade-in animation props */
  fadeIn?: {
    duration?: number;
    delay?: number;
    slideFrom?: "bottom" | "top" | "left" | "right" | "none";
  };
  /** Additional CSS classes */
  className?: string;
};

/**
 * Wrapper component for lazy-loaded sections with fade-in animation
 * Combines Suspense for code splitting with intersection observer for smooth entry
 */
export function LazySection({
  children,
  fallback,
  fadeIn = { duration: 600, delay: 0, slideFrom: "bottom" },
  className = "",
}: LazySection) {
  return (
    <FadeInSection
      duration={fadeIn.duration}
      delay={fadeIn.delay}
      slideFrom={fadeIn.slideFrom}
      className={className}
    >
      <Suspense fallback={fallback || <div className="min-h-[200px]" />}>
        {children}
      </Suspense>
    </FadeInSection>
  );
}
