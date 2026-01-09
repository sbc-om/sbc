"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/SidebarLayout";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { logoutAction } from "@/app/[locale]/auth/actions";
import { 
  HiHome, 
  HiOutlineHome,
  HiChat,
  HiOutlineChat,
  HiViewGrid,
  HiOutlineViewGrid,
  HiSearch,
  HiOutlineSearch,
  HiChartSquareBar,
  HiOutlineChartSquareBar,
  HiCog,
  HiOutlineCog,
  HiCollection,
  HiOutlineCollection,
  HiLogout,
  HiOutlineLogout,
  HiChevronLeft,
  HiChevronRight,
  HiMenu,
  HiX
} from "react-icons/hi";

interface SidebarProps {
  locale: Locale;
  dict: Dictionary;
  user: { username: string; role: string; email: string };
}

type NavItem = {
  key: string;
  label: string;
  path: string;
  Icon: ComponentType<{ className?: string }>;
  IconOutline: ComponentType<{ className?: string }>;
};

export function Sidebar({ locale, dict, user }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, setCollapsed, isMobile } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path: string) => pathname.startsWith(`/${locale}${path}`);

  const baseNavItems: NavItem[] = [
    {
      key: "home",
      label: dict.nav.home ?? (locale === "ar" ? "الرئيسية" : "Home"),
      path: "/home",
      Icon: HiHome,
      IconOutline: HiOutlineHome,
    },
    {
      key: "explore",
      label: dict.nav.explore ?? (locale === "ar" ? "استكشف" : "Explore"),
      path: "/explorer",
      Icon: HiViewGrid,
      IconOutline: HiOutlineViewGrid,
    },
    {
      key: "categories",
      label: dict.nav.categories ?? (locale === "ar" ? "التصنيفات" : "Categories"),
      path: "/categories",
      Icon: HiCollection,
      IconOutline: HiOutlineCollection,
    },
    {
      key: "dashboard",
      label: dict.nav.dashboard,
      path: "/dashboard",
      Icon: HiChartSquareBar,
      IconOutline: HiOutlineChartSquareBar,
    },
    {
      key: "chat",
      label: dict.nav.chat ?? (locale === "ar" ? "الدردشة" : "Chat"),
      path: "/chat",
      Icon: HiChat,
      IconOutline: HiOutlineChat,
    },
    {
      key: "businessRequest",
      label: dict.nav.businessRequest ?? (locale === "ar" ? "طلب إضافة عمل" : "Request Listing"),
      path: "/business-request",
      Icon: HiSearch,
      IconOutline: HiOutlineSearch,
    },
  ];

  const navItems: NavItem[] =
    user.role === "admin"
      ? [
          ...baseNavItems,
          {
            key: "admin",
            label: dict.nav.admin,
            path: "/admin",
            Icon: HiCog,
            IconOutline: HiOutlineCog,
          },
        ]
      : baseNavItems;

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={`px-3 pt-4 transition-all duration-300 ${collapsed ? "mb-4" : "mb-8"}`}>
        <Link href={`/${locale}`} className="flex items-center gap-3 group">
          <Image
            src="/images/sbc.svg"
            alt="SBC"
            width={40}
            height={40}
            className="h-10 w-10 transition-transform group-hover:scale-105 shrink-0"
            priority
          />
          {!collapsed && (
            <span className="font-bold text-xl bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent overflow-hidden">
              SBC
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const IconComponent = active ? item.Icon : item.IconOutline;
          return (
            <Link
              key={item.key}
              href={`/${locale}${item.path}`}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center gap-4 rounded-xl px-3 py-3 text-base transition-all ${
                active
                  ? "bg-linear-to-r from-accent/10 to-accent-2/10 font-bold text-accent"
                  : "hover:bg-(--surface) font-normal"
              }`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <IconComponent className="h-7 w-7 shrink-0" />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="mt-auto border-t pt-4 px-2" style={{ borderColor: "var(--surface-border)" }}>
        <Link
          href={`/${locale}/dashboard`}
          onClick={() => isMobile && setMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-(--surface) transition-colors"
          title={collapsed && !isMobile ? user.username : undefined}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-accent to-accent-2 shrink-0 ring-2 ring-accent/20">
            <span className="text-sm font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <p className="text-xs text-(--muted-foreground) truncate">{user.email}</p>
            </div>
          )}
        </Link>

        {/* Profile actions */}
        <div className="mt-2 space-y-1">
          <Link
            href={`/${locale}/settings`}
            onClick={() => isMobile && setMobileOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
            title={collapsed && !isMobile ? (dict.nav.settings ?? (locale === "ar" ? "الإعدادات" : "Settings")) : undefined}
          >
            {(isActive("/settings") ? HiCog : HiOutlineCog)({ className: "h-5 w-5 shrink-0" })}
            {(!collapsed || isMobile) && (
              <span className="min-w-0 truncate">
                {dict.nav.settings ?? (locale === "ar" ? "الإعدادات" : "Settings")}
              </span>
            )}
          </Link>

          <form action={logoutAction.bind(null, locale)}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
              title={collapsed && !isMobile ? dict.nav.logout : undefined}
            >
              {(HiOutlineLogout as any)({ className: "h-5 w-5 shrink-0" })}
              {(!collapsed || isMobile) && (
                <span className="min-w-0 truncate">{dict.nav.logout}</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Toggle Button - Desktop Only */}
      {!isMobile && (
        <div className="pt-3 border-t mt-3 px-2" style={{ borderColor: "var(--surface-border)" }}>
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-(--surface) transition-all hover:scale-105"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {locale === "ar" ? (
              collapsed ? <HiChevronLeft className="h-5 w-5" /> : <HiChevronRight className="h-5 w-5" />
            ) : (
              collapsed ? <HiChevronRight className="h-5 w-5" /> : <HiChevronLeft className="h-5 w-5" />
            )}
            {!collapsed && (
              <span className="text-sm font-medium">{locale === "ar" ? "إخفاء" : "Collapse"}</span>
            )}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 z-40 border-e hidden lg:flex flex-col transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
        style={{
          [locale === "ar" ? "right" : "left"]: 0,
          borderColor: "var(--surface-border)",
          backgroundColor: "var(--background)",
        }}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <NavContent />
        </div>
      </aside>

      {/* Mobile Sidebar - Overlay */}
      {isMobile && (
        <>
          {/* Mobile backdrop */}
          {mobileOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-in fade-in duration-200"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}
          
          {/* Mobile sidebar */}
          <aside
            className={`fixed top-0 bottom-0 z-50 w-72 border-e lg:hidden flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
              mobileOpen ? "translate-x-0" : (locale === "ar" ? "translate-x-full" : "-translate-x-full")
            }`}
            style={{
              [locale === "ar" ? "right" : "left"]: 0,
              borderColor: "var(--surface-border)",
              backgroundColor: "var(--background)",
            }}
          >
            <div className="flex h-full flex-col px-3 py-4">
              {/* Close button for mobile */}
              <button
                onClick={() => setMobileOpen(false)}
                className="self-end mb-2 p-2 rounded-lg hover:bg-(--surface) transition-colors"
                aria-label="Close menu"
              >
                <HiX className="h-6 w-6" />
              </button>
              <NavContent />
            </div>
          </aside>
        </>
      )}
    </>
  );
}
