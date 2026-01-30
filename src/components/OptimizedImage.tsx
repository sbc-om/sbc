"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type OptimizedImageProps = ImageProps & {
  /** Show a loading skeleton */
  showSkeleton?: boolean;
  /** Custom loading background color */
  skeletonColor?: string;
};

export function OptimizedImage({
  showSkeleton = true,
  skeletonColor = "rgba(var(--foreground-rgb), 0.1)",
  className = "",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showSkeleton && isLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: `linear-gradient(90deg, ${skeletonColor} 0%, rgba(var(--foreground-rgb), 0.15) 50%, ${skeletonColor} 100%)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 2s infinite",
          }}
        />
      )}
      <Image
        {...props}
        className={`transition-opacity duration-500 ${isLoading ? "opacity-0" : "opacity-100"} ${className}`}
        onLoad={() => setIsLoading(false)}
        loading={props.loading || "lazy"}
      />
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
  );
}
