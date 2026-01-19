import React from "react";

import { PageContainer } from "@/components/PageContainer";
import { Container } from "@/components/Container";
import { cn } from "@/lib/cn";

/**
 * Standard wrapper for authenticated (sidebar) pages.
 * Ensures consistent top/bottom spacing and identical side paddings/width.
 */
export function AppPage({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <PageContainer withPadding={false} className={cn("pt-6", className)}>
      <Container size="lg" className={containerClassName}>
        {children}
      </Container>
    </PageContainer>
  );
}
