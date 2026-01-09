import React from "react";

import { cn } from "@/lib/cn";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClass: Record<ContainerSize, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

export function Container({
  children,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: ContainerSize;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6", sizeClass[size], className)}>
      {children}
    </div>
  );
}
