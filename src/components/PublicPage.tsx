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
    <PageContainer withPadding={false} className={cn("pt-28 pb-10", className)}>
      <Container size="lg" className={containerClassName}>
        {children}
      </Container>
    </PageContainer>
  );
}
