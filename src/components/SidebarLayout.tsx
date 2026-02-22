"use client";

import { useState, useEffect, createContext, useContext } from "react";

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

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Keep first client render aligned with SSR, then hydrate responsive/user preference state.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsMobile(window.innerWidth < 1024);
      setCollapsed(localStorage.getItem("sidebarCollapsed") === "true");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Update CSS variable for sidebar width
  useEffect(() => {
    let width: string;
    if (isMobile) {
      width = "0rem"; // Mobile: no margin
    } else if (collapsed) {
      width = "5rem"; // Desktop collapsed
    } else {
      width = "16rem"; // Desktop expanded
    }
    
    const root = document.documentElement;
    root.style.setProperty("--sidebar-width", width);
    // Keep a dataset flag so CSS can match the collapsed state (useful for avoiding flashes).
    root.dataset.sidebarCollapsed = collapsed ? "true" : "false";
  }, [collapsed, isMobile]);

  // Save to localStorage when changed (only for desktop)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("sidebarCollapsed", String(collapsed));
    }
  }, [collapsed, isMobile]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}
