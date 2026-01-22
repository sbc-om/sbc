"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePerformance";

type FadeInSectionProps = {
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Delay before animation starts (in ms) */
  delay?: number;
  /** Duration of fade-in animation (in ms) */
  duration?: number;
  /** Distance to slide from (in pixels) */
  slideDistance?: number;
  /** Direction to slide from */
  slideFrom?: "bottom" | "top" | "left" | "right" | "none";
  /** Threshold for intersection observer (0-1) */
  threshold?: number;
  /** Root margin for early triggering */
  rootMargin?: string;
};

export function FadeInSection({
  children,
  className = "",
  delay = 0,
  duration = 600,
  slideDistance = 20,
  slideFrom = "bottom",
  threshold = 0.1,
  rootMargin = "0px 0px -50px 0px",
}: FadeInSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const currentRef = sectionRef.current;
    if (!currentRef) return;

    // If user prefers reduced motion, show immediately
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, prefersReducedMotion]);

  const getTransform = () => {
    if (slideFrom === "none" || prefersReducedMotion) return "translate(0, 0)";
    
    switch (slideFrom) {
      case "bottom":
        return `translate(0, ${slideDistance}px)`;
      case "top":
        return `translate(0, -${slideDistance}px)`;
      case "left":
        return `translate(-${slideDistance}px, 0)`;
      case "right":
        return `translate(${slideDistance}px, 0)`;
      default:
        return "translate(0, 0)";
    }
  };

  // If reduced motion is preferred, skip animations
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate(0, 0)" : getTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
        willChange: isVisible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
