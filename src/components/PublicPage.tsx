import React from "react";

import { PageContainer } from "@/components/PageContainer";
import { Container } from "@/components/Container";
import { cn } from "@/lib/cn";

/**
 * Standard wrapper for public (header + footer) pages.
 * Header is fixed, so we offset content from the top.
 * Ensures consistent top/bottom spacing and identical side paddings/width.
 */
export function PublicPage({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <PageContainer
      withPadding={false}
      className={cn(
        // Header is fixed (and slightly taller on mobile). Give enough top space so
        // public pages (e.g. loyalty, business pages, customer card) never render
        // underneath the header/menu when logged out.
        "pt-24 pb-10 sm:pt-28",
        className,
      )}
    >
      <Container size="lg" className={containerClassName}>
        {children}
      </Container>
    </PageContainer>
  );
}
