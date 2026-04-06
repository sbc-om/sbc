"use client";

import { useState, useEffect, useLayoutEffect, useRef, createContext, useContext } from "react";

type SidebarContextType = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  isMobile: boolean;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarLayout");
  }
  return context;
}

export function SidebarLayout({
  children,
  initialCollapsed = false,
}: {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}) {
  // Keep the first client render identical to SSR to avoid hydration mismatches.
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const initializedRef = useRef(false);

  // Sync viewport/localStorage state before paint to avoid visible refresh jumps.
  useLayoutEffect(() => {
    const mobile = window.innerWidth < 1024;
    const shouldAutoCollapse = window.innerWidth < 1200;
    let nextCollapsed = initialCollapsed;

    try {
      const storedCollapsed = window.localStorage.getItem("sidebarCollapsed");
      if (storedCollapsed === "true" || storedCollapsed === "false") {
        nextCollapsed = storedCollapsed === "true";
      } else {
        window.localStorage.setItem("sidebarCollapsed", String(initialCollapsed));
      }
    } catch {
      // Ignore localStorage read/write failures and keep SSR value.
    }

    if (shouldAutoCollapse && !mobile) {
      nextCollapsed = true;
    }

    const root = document.documentElement;
    const nextWidth = mobile ? "0rem" : nextCollapsed ? "5rem" : "16rem";
    root.style.setProperty("--sidebar-width", nextWidth);
    root.dataset.sidebarCollapsed = nextCollapsed ? "true" : "false";

    setIsMobile(mobile);
    setCollapsed(nextCollapsed);
    initializedRef.current = true;

    const onResize = () => {
      const nowMobile = window.innerWidth < 1024;
      const nowNarrow = window.innerWidth < 1160;
      setIsMobile(nowMobile);
      if (nowNarrow && !nowMobile) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initialCollapsed]);

  // Update CSS variable for sidebar width and a dataset flag used by CSS.
  useEffect(() => {
    if (!initializedRef.current) return;

    const root = document.documentElement;
    let width: string;
    if (isMobile) {
      width = "0rem"; // Mobile: no margin
    } else if (collapsed) {
      width = "5rem"; // Desktop collapsed
    } else {
      width = "16rem"; // Desktop expanded
    }
    root.style.setProperty("--sidebar-width", width);
    root.dataset.sidebarCollapsed = collapsed ? "true" : "false";
  }, [collapsed, isMobile]);

  // Save to localStorage when changed (only for desktop)
  useEffect(() => {
    if (!initializedRef.current) return;
    if (!isMobile) {
      try {
        localStorage.setItem("sidebarCollapsed", String(collapsed));
      } catch {
        // ignore storage failures
      }
      document.cookie = `sidebarCollapsed=${collapsed ? "1" : "0"}; Path=/; Max-Age=31536000; SameSite=Lax`;
    }
  }, [collapsed, isMobile]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}
