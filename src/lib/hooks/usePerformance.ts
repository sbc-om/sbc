"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to detect viewport size
 */
export function useViewportSize() {
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

/**
 * Hook to detect if user has scrolled past a certain point
 */
export function useScrollThreshold(threshold: number = 100): boolean {
  const [isPastThreshold, setIsPastThreshold] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsPastThreshold(window.scrollY > threshold);
    };

    handleScroll(); // Check initial position
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isPastThreshold;
}
