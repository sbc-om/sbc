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
  const [mounted, setMounted] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load collapsed state from localStorage (only for desktop)
  useEffect(() => {
    if (!isMobile) {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    }
  }, [isMobile]);

  // Update CSS variable for sidebar width
  useEffect(() => {
    if (!mounted) return;
    
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
  }, [collapsed, isMobile, mounted]);

  // Save to localStorage when changed (only for desktop)
  useEffect(() => {
    if (!isMobile && mounted) {
      localStorage.setItem("sidebarCollapsed", String(collapsed));
    }
  }, [collapsed, isMobile, mounted]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}
