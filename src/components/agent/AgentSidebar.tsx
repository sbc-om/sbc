"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiHome,
  HiOutlineHome,
  HiViewGrid,
  HiOutlineViewGrid,
  HiPlus,
  HiOutlinePlus,
  HiUserGroup,
  HiOutlineUserGroup,
  HiUserAdd,
  HiOutlineUserAdd,
} from "react-icons/hi";
import { HiOutlineArrowUturnLeft, HiOutlineWallet } from "react-icons/hi2";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/locales";

type NavItem = {
  key: string;
  label: string;
  path: string;
  Icon: React.ComponentType<{ className?: string }>;
  IconOutline: React.ComponentType<{ className?: string }>;
};

const texts = {
  en: {
    title: "Agent Panel",
    dashboard: "Dashboard",
    clients: "My Clients",
    addClient: "Add Client",
    businesses: "My Businesses",
    newBusiness: "Register Business",
    wallet: "Agent Wallet",
    backToApp: "Back to App",
  },
  ar: {
    title: "لوحة الوكيل",
    dashboard: "لوحة التحكم",
    clients: "عملائي",
    addClient: "إضافة عميل",
    businesses: "أعمالي",
    newBusiness: "تسجيل عمل",
    wallet: "محفظة الوكيل",
    backToApp: "العودة للتطبيق",
  },
};

/* ─── Professional mobile horizontal nav with fade edges & custom scrollbar ── */
function AgentMobileNav({
  navItems,
  locale,
  ar,
  t,
  isActive,
}: {
  navItems: NavItem[];
  locale: Locale;
  ar: boolean;
  t: (typeof texts)[Locale];
  isActive: (path: string) => boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const effectiveScroll = ar ? -scrollLeft : scrollLeft;
    setCanScrollStart(effectiveScroll > 2);
    setCanScrollEnd(effectiveScroll + clientWidth < scrollWidth - 2);
  }, [ar]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  // Scroll the active item into view on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeChild = el.querySelector("[data-active='true']") as HTMLElement | null;
    if (activeChild) {
      activeChild.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, []);

  return (
    <div className="relative">
      {/* Fade edge – start (left in LTR, right in RTL) */}
      <div
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 z-10 w-8 transition-opacity duration-300",
          ar ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r",
          "from-[var(--surface)] to-transparent",
          canScrollStart ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Fade edge – end */}
      <div
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 z-10 w-8 transition-opacity duration-300",
          ar ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l",
          "from-[var(--surface)] to-transparent",
          canScrollEnd ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={scrollRef}
        className="agent-mobile-scrollbar flex items-center gap-1.5 overflow-x-auto px-4 py-2.5"
      >
        {/* Panel badge */}
        <span className="me-1 shrink-0 select-none rounded-md bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
          {t.title}
        </span>

        {/* Separator dot */}
        <span className="shrink-0 h-3.5 w-px bg-(--surface-border) me-0.5" />

        {navItems.map((item) => {
          const active = isActive(item.path);
          const IconComponent = active ? item.Icon : item.IconOutline;
          return (
            <Link
              key={item.key}
              href={item.path}
              data-active={active}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all duration-200 whitespace-nowrap",
                active
                  ? "bg-accent text-white shadow-[0_2px_8px_rgba(var(--accent-rgb,99,102,241),0.35)]"
                  : "text-(--muted-foreground) hover:bg-(--chip-bg) hover:text-foreground active:scale-[0.97]",
              )}
            >
              <IconComponent className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Separator */}
        <span className="shrink-0 h-3.5 w-px bg-(--surface-border) mx-0.5" />

        <Link
          href={`/${locale}/dashboard`}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-(--muted-foreground) hover:bg-(--chip-bg) hover:text-foreground transition-all duration-200 whitespace-nowrap active:scale-[0.97]"
        >
          <HiOutlineArrowUturnLeft className={cn("h-4 w-4 shrink-0", ar && "scale-x-[-1]")} />
          <span>{t.backToApp}</span>
        </Link>
      </div>
    </div>
  );
}

export function AgentSidebar({ locale, mobile }: { locale: Locale; mobile?: boolean }) {
  const pathname = usePathname();
  const t = texts[locale];
  const ar = locale === "ar";

  const navItems: NavItem[] = [
    {
      key: "dashboard",
      label: t.dashboard,
      path: `/${locale}/agent`,
      Icon: HiHome,
      IconOutline: HiOutlineHome,
    },
    {
      key: "clients",
      label: t.clients,
      path: `/${locale}/agent/clients`,
      Icon: HiUserGroup,
      IconOutline: HiOutlineUserGroup,
    },
    {
      key: "add-client",
      label: t.addClient,
      path: `/${locale}/agent/clients/new`,
      Icon: HiUserAdd,
      IconOutline: HiOutlineUserAdd,
    },
    {
      key: "businesses",
      label: t.businesses,
      path: `/${locale}/agent/businesses`,
      Icon: HiViewGrid,
      IconOutline: HiOutlineViewGrid,
    },
    {
      key: "new-business",
      label: t.newBusiness,
      path: `/${locale}/agent/businesses/new`,
      Icon: HiPlus,
      IconOutline: HiOutlinePlus,
    },
    {
      key: "wallet",
      label: t.wallet,
      path: `/${locale}/agent/wallet`,
      Icon: HiOutlineWallet,
      IconOutline: HiOutlineWallet,
    },
  ];

  const isActive = (path: string) => {
    if (path === `/${locale}/agent`) return pathname === path;
    // Exact match takes priority; for prefix match, ensure no more-specific
    // sibling route is actually the one matching
    if (pathname === path) return true;
    if (pathname.startsWith(path + "/")) {
      // Check if another nav item is a more specific match
      const moreSpecific = navItems.some(
        (item) => item.path !== path && item.path.startsWith(path + "/") && pathname.startsWith(item.path)
      );
      return !moreSpecific;
    }
    return false;
  };

  if (mobile) {
    return <AgentMobileNav navItems={navItems} locale={locale} ar={ar} t={t} isActive={isActive} />;
  }

  return (
    <nav className="flex flex-col gap-1 p-3">
      {/* Agent panel title */}
      <div className="px-3 pb-3 mb-2 border-b border-(--surface-border)">
        <h2 className="text-sm font-semibold text-(--muted-foreground) uppercase tracking-wider">
          {t.title}
        </h2>
      </div>

      {navItems.map((item) => {
        const active = isActive(item.path);
        const IconComponent = active ? item.Icon : item.IconOutline;
        return (
          <Link
            key={item.key}
            href={item.path}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-accent text-white shadow-md"
                : "text-(--muted-foreground) hover:bg-(--chip-bg) hover:text-foreground"
            )}
          >
            <IconComponent className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Back to main app */}
      <div className="mt-4 pt-3 border-t border-(--surface-border)">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-(--muted-foreground) hover:bg-(--chip-bg) hover:text-foreground transition-all duration-200"
        >
          <HiOutlineArrowUturnLeft className={cn("h-5 w-5 shrink-0", ar && "scale-x-[-1]")} />
          <span>{t.backToApp}</span>
        </Link>
      </div>
    </nav>
  );
}
