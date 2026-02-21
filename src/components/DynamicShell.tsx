"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RealtimeEngagementHealthIndicator } from "@/components/RealtimeEngagementHealthIndicator";

/**
 * Routes rendered in the public shell even for logged-in users.
 * Keep in sync with ALWAYS_PUBLIC_SECTIONS in layout.tsx.
 */
const ALWAYS_PUBLIC_SECTIONS = new Set([
  "map",
  "about",
  "contact",
  "faq",
  "terms",
  "rules",
  "login",
  "register",
  "businesses",
  "business-card",
  "marketing-platform",
  "loyalty",
  "email",
  "domain",
  "u",
]);

function getRouteSection(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  return segments.length > 1 ? segments[1] : "";
}

function isAlwaysPublicPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const section = segments.length > 1 ? segments[1] : "";
  const subSection = segments.length > 2 ? segments[2] : "";

  if (section === "loyalty" && subSection === "manage") {
    return false;
  }

  return ALWAYS_PUBLIC_SECTIONS.has(section);
}

interface DynamicShellProps {
  /** Pre-rendered sidebar (server→client via props) */
  sidebar: ReactNode;
  /** Pre-rendered public header */
  header: ReactNode;
  /** Pre-rendered public footer */
  footer: ReactNode;
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
  header,
  footer,
  mobileNav,
  children,
}: DynamicShellProps) {
  const pathname = usePathname();
  const section = getRouteSection(pathname);
  const isDashboard = !isAlwaysPublicPath(pathname);
  const isChatPage = section === "chat";

  if (isDashboard) {
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
          className="min-h-dvh transition-[margin] duration-300 ease-in-out"
          style={{ marginInlineStart: "var(--sidebar-width, 0)" }}
        >
          <main className="w-full">{children}</main>
        </div>
        {mobileNav}
      </div>
    );
  }

  // Public shell
  return (
    <div className="min-h-dvh bg-transparent text-foreground flex flex-col">
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
