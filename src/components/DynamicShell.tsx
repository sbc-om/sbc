"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RealtimeEngagementHealthIndicator } from "@/components/RealtimeEngagementHealthIndicator";

function getRouteSection(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length > 1 ? segments[1] : "";
}

interface DynamicShellProps {
  /** Pre-rendered sidebar (server→client via props) */
  sidebar: ReactNode;
  /** Pre-rendered mobile bottom nav */
  mobileNav: ReactNode;
  /** Page content */
  children: ReactNode;
}

/**
 * Instantly switches between dashboard and public shell layouts based on
 * the current URL pathname.  All heavy chrome components are pre-rendered
 * on the server and passed in as React-node props; this component only
 * controls which DOM structure wraps `children`.
 *
 * Because `usePathname()` fires on every soft-navigation AND on browser
 * back/forward, the shell swap is immediate — no full-page reload needed.
 */
export function DynamicShell({
  sidebar,
  mobileNav,
  children,
}: DynamicShellProps) {
  const pathname = usePathname();
  const section = getRouteSection(pathname);
  const isChatPage = section === "chat";

  return (
    <div
      className="min-h-dvh bg-transparent text-foreground"
      style={
        {
          "--page-bottom-offset": isChatPage
            ? "0px"
            : "calc(var(--mobile-nav-height, 72px) + env(safe-area-inset-bottom) + 22px)",
        } as Record<string, string>
      }
    >
      {sidebar}
      <RealtimeEngagementHealthIndicator />
      <div
        className="min-h-dvh"
        style={{ marginInlineStart: "var(--sidebar-width, 0)" }}
      >
        <main className="w-full">{children}</main>
      </div>
      {mobileNav}
    </div>
  );
}
