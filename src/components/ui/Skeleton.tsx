"use client";

import { type ReactNode } from "react";

type SkeletonProps = {
  /** Width of skeleton (CSS value) */
  width?: string | number;
  /** Height of skeleton (CSS value) */
  height?: string | number;
  /** Border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton items to render */
  count?: number;
};

const roundedClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export function Skeleton({
  width = "100%",
  height = "1rem",
  rounded = "md",
  className = "",
  count = 1,
}: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {skeletons.map((i) => (
        <div
          key={i}
          className={`animate-pulse bg-gradient-to-r from-[rgba(var(--foreground-rgb),0.08)] via-[rgba(var(--foreground-rgb),0.12)] to-[rgba(var(--foreground-rgb),0.08)] bg-[length:200%_100%] ${roundedClasses[rounded]} ${className}`}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
            animation: "shimmer 2s infinite ease-in-out",
          }}
        >
          <style jsx>{`
            @keyframes shimmer {
              0% {
                background-position: -200% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }
          `}</style>
        </div>
      ))}
    </>
  );
}

/**
 * Skeleton for business cards
 */
export function BusinessCardSkeleton() {
  return (
    <div className="sbc-card rounded-2xl p-6 space-y-4">
      <Skeleton height={48} rounded="lg" />
      <Skeleton height={80} rounded="md" />
      <div className="flex gap-2">
        <Skeleton width={60} height={24} rounded="full" />
        <Skeleton width={60} height={24} rounded="full" />
      </div>
      <Skeleton height={40} rounded="lg" />
    </div>
  );
}

/**
 * Skeleton for text content
 */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

/**
 * Wrapper to show loading state
 */
type LoadingWrapperProps = {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
};

export function LoadingWrapper({
  isLoading,
  skeleton,
  children,
}: LoadingWrapperProps) {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  return <>{children}</>;
}
