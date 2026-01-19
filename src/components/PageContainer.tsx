import React from "react";

export function PageContainer({
  children,
  className = "",
  withPadding = true,
}: {
  children: React.ReactNode;
  className?: string;
  withPadding?: boolean;
}) {
  return (
    <div
      className={`${withPadding ? "pt-10" : ""} pb-[var(--page-bottom-offset,5rem)] lg:pb-10 ${className}`}
    >
      {children}
    </div>
  );
}
