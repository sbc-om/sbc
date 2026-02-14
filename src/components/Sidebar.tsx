"use client";

import { useEffect, useRef, useState } from "react";
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
  HiShoppingBag,
  HiOutlineShoppingBag,
  HiChartSquareBar,
  HiOutlineChartSquareBar,
  HiCog,
  HiOutlineCog,
  HiCollection,
  HiOutlineCollection,
  HiOutlineLogout,
  HiChevronLeft,
  HiChevronRight,
  HiUser,
  HiOutlineUser,
  HiX,
  HiBell,
  HiOutlineBell,
} from "react-icons/hi";
import { IoBookmark, IoBookmarkOutline, IoWallet, IoWalletOutline } from "react-icons/io5";
import { HiPlus, HiOutlinePlus, HiBriefcase, HiOutlineBriefcase, HiUserGroup, HiOutlineUserGroup } from "react-icons/hi";

interface SidebarProps {
  locale: Locale;
  dict: Dictionary;
  user: { displayName: string; role: string; email: string; avatarUrl: string | null; hasBusiness?: boolean };
}

function playNotificationSound() {
  try {
    const webkitAudioContext = (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const AudioContextCtor = window.AudioContext || webkitAudioContext;
    if (!AudioContextCtor) return;

    const audioContext = new AudioContextCtor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gainNode.gain.value = 0.18;

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.22);
    oscillator.stop(audioContext.currentTime + 0.22);
  } catch {
    // ignore audio errors
  }
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuOpenedAtPath, setProfileMenuOpenedAtPath] = useState<string | null>(null);
  const [notificationUnread, setNotificationUnread] = useState(0);
  const [notificationPulse, setNotificationPulse] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const iconOnly = collapsed && !isMobile;

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path: string) => pathname.startsWith(`/${locale}${path}`);

  const avatarInitial = (user.displayName?.trim() || user.email.split("@")[0] || "U")
    .slice(0, 1)
    .toUpperCase();

  // Avoid setState-on-navigation-effect lint by tying visibility to the pathname
  // at the time the menu was opened.
  const isProfileMenuVisible = profileMenuOpen && profileMenuOpenedAtPath === pathname;

  // Close profile menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isProfileMenuVisible) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isProfileMenuVisible]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pulseTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      eventSource = new EventSource("/api/notifications/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            type?: "connected" | "read" | "new";
            unreadCount?: number;
          };

          if (typeof data.unreadCount === "number") {
            setNotificationUnread(data.unreadCount);
          }

          if (data.type === "new") {
            playNotificationSound();
            setNotificationPulse(true);
            if (pulseTimeout) clearTimeout(pulseTimeout);
            pulseTimeout = setTimeout(() => setNotificationPulse(false), 850);
          }
        } catch {
          // ignore malformed events
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    };

    connect();

    return () => {
      if (pulseTimeout) clearTimeout(pulseTimeout);
      if (eventSource) eventSource.close();
    };
  }, []);

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
      key: "store",
      label: (dict.nav as Record<string, string | undefined>).store ?? (locale === "ar" ? "المتجر" : "Store"),
      path: "/store",
      Icon: HiShoppingBag,
      IconOutline: HiOutlineShoppingBag,
    },
    {
      key: "wallet",
      label: (dict.nav as Record<string, string | undefined>).wallet ?? (locale === "ar" ? "المحفظة" : "Wallet"),
      path: "/wallet",
      Icon: IoWallet,
      IconOutline: IoWalletOutline,
    },
    // Only show business request if user doesn't have a business
    ...(!user.hasBusiness ? [{
      key: "businessRequest",
      label: dict.nav.businessRequest ?? (locale === "ar" ? "طلب إضافة عمل" : "Request Listing"),
      path: "/business-request",
      Icon: HiPlus,
      IconOutline: HiOutlinePlus,
    }] : []),
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
      : user.role === "agent"
      ? [
          ...baseNavItems,
          {
            key: "agent",
            label: locale === "ar" ? "لوحة الوكيل" : "Agent Panel",
            path: "/agent",
            Icon: HiUserGroup,
            IconOutline: HiOutlineUserGroup,
          },
        ]
      : baseNavItems;

  const navContent = (
    <>
      {/* Logo */}
      <div className={`px-3 pt-4 transition-all duration-300 ${collapsed ? "mb-4" : "mb-8"}`}>
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/${locale}`}
            className={`flex items-center gap-3 group min-w-0 ${iconOnly ? "justify-center" : "justify-start"}`}
            title={iconOnly ? "SBC" : undefined}
          >
            <Image
              src="/images/sbc.svg"
              alt="SBC"
              width={40}
              height={40}
              className="h-10 w-10 transition-transform group-hover:scale-105 shrink-0"
              priority
            />
            {!collapsed && (
              <span className="sbc-sidebar-brand font-bold text-xl bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent overflow-hidden">
                SBC
              </span>
            )}
          </Link>

          <Link
            href={`/${locale}/notifications`}
            onClick={() => isMobile && setMobileOpen(false)}
            className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
              isActive("/notifications")
                ? "border-accent/40 bg-linear-to-r from-accent/10 to-accent-2/10 text-accent"
                : "border-(--surface-border) bg-(--chip-bg) text-(--muted-foreground) hover:text-foreground"
            } ${notificationPulse ? "motion-safe:animate-pulse" : ""}`}
            aria-label={locale === "ar" ? "الإشعارات" : "Notifications"}
            title={locale === "ar" ? "الإشعارات" : "Notifications"}
          >
            {isActive("/notifications") ? <HiBell className="h-5 w-5" /> : <HiOutlineBell className="h-5 w-5" />}
            {notificationUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-5 text-center shadow">
                {notificationUnread > 99 ? "99+" : notificationUnread}
              </span>
            )}
          </Link>
        </div>
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
              className={`sbc-sidebar-navlink flex items-center rounded-xl py-3 text-base transition-all ${
                active
                  ? "bg-linear-to-r from-accent/10 to-accent-2/10 font-bold text-accent"
                  : "hover:bg-(--surface) font-normal"
              } ${iconOnly ? "justify-center px-2" : "justify-start gap-4 px-3"}`}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <IconComponent className="h-7 w-7 shrink-0" />
              {(!collapsed || isMobile) && <span className="sbc-sidebar-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse (last menu option) - Desktop Only */}
      {!isMobile && (
        <div className="mt-2 px-2 pt-2 mb-2" style={{ borderColor: "var(--surface-border)" }}>
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
              <span className="sbc-sidebar-collapse-text text-sm font-medium">{locale === "ar" ? "إخفاء" : "Collapse"}</span>
            )}
          </button>
        </div>
      )}

      {/* User Profile (separate section) */}
      <div
        ref={profileMenuRef}
        className="mt-auto border-t pt-4 px-2 relative"
        style={{ borderColor: "var(--surface-border)" }}
      >
        <button
          type="button"
          onClick={() => {
            setProfileMenuOpen((v) => {
              const next = !v;
              if (next) setProfileMenuOpenedAtPath(pathname);
              return next;
            });
          }}
          className={`w-full flex items-center rounded-xl py-2 hover:bg-(--surface) transition-colors text-left ${
            iconOnly ? "justify-center px-2" : "justify-start gap-3 px-3"
          }`}
          title={collapsed && !isMobile ? user.displayName : undefined}
          aria-haspopup="menu"
          aria-expanded={isProfileMenuVisible}
        >
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-accent to-accent-2 shrink-0 ring-2 ring-accent/20">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.displayName || user.email}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span className="text-sm font-bold text-white">{avatarInitial}</span>
            )}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.displayName}</p>
              <p className="text-xs text-(--muted-foreground) truncate">{user.email}</p>
            </div>
          )}
        </button>

        {isProfileMenuVisible && (
          <div
            role="menu"
            aria-label="Profile menu"
            className="absolute bottom-full mb-2 w-64 rounded-xl border bg-background shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150"
            style={{
              borderColor: "var(--surface-border)",
              ...(locale === "ar" ? { right: 0 } : { left: 0 }),
            }}
          >
            <div className="px-2 py-2">
              <p className="text-xs text-(--muted-foreground)">{dict.nav.profile}</p>
            </div>

            <Link
              role="menuitem"
              href={`/${locale}/profile`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
            >
              {(() => {
                const ProfileIcon = isActive("/profile") ? HiUser : HiOutlineUser;
                return <ProfileIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">{dict.nav.profile}</span>
            </Link>

            <Link
              role="menuitem"
              href={`/${locale}/dashboard`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
            >
              {(() => {
                const DashboardIcon = isActive("/dashboard") ? HiChartSquareBar : HiOutlineChartSquareBar;
                return <DashboardIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">{dict.nav.dashboard}</span>
            </Link>

            {user.role === "agent" && (
              <Link
                role="menuitem"
                href={`/${locale}/agent`}
                onClick={() => {
                  setProfileMenuOpen(false);
                  if (isMobile) setMobileOpen(false);
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
              >
                {(() => {
                  const AgentIcon = isActive("/agent") ? HiBriefcase : HiOutlineBriefcase;
                  return <AgentIcon className="h-5 w-5 shrink-0" />;
                })()}
                <span className="min-w-0 truncate">{locale === "ar" ? "لوحة الوكيل" : "Agent Panel"}</span>
              </Link>
            )}

            <Link
              role="menuitem"
              href={`/${locale}/chat`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
            >
              {(() => {
                const ChatIcon = isActive("/chat") ? HiChat : HiOutlineChat;
                return <ChatIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">{dict.nav.chat ?? (locale === "ar" ? "الدردشة" : "Chat")}</span>
            </Link>

            <Link
              role="menuitem"
              href={`/${locale}/notifications`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
            >
              {(() => {
                const NotificationIcon = isActive("/notifications") ? HiBell : HiOutlineBell;
                return <NotificationIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">{locale === "ar" ? "الإشعارات" : "Notifications"}</span>
            </Link>

            <div className="my-1 border-t" style={{ borderColor: "var(--surface-border)" }} />

            <Link
              role="menuitem"
              href={`/${locale}/settings`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
            >
              {(() => {
                const SettingsIcon = isActive("/settings") ? HiCog : HiOutlineCog;
                return <SettingsIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">{dict.nav.settings}</span>
            </Link>

            <Link
              role="menuitem"
              href={`/${locale}/saved`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
            >
              {(() => {
                const SavedIcon = isActive("/saved") ? IoBookmark : IoBookmarkOutline;
                return <SavedIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">
                {locale === "ar" ? "المحفوظات" : "Saved"}
              </span>
            </Link>

            <Link
              role="menuitem"
              href={`/${locale}/wallet`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
            >
              {(() => {
                const WalletIcon = isActive("/wallet") ? IoWallet : IoWalletOutline;
                return <WalletIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">
                {locale === "ar" ? "المحفظة" : "Wallet"}
              </span>
            </Link>

            <div className="my-1 border-t" style={{ borderColor: "var(--surface-border)" }} />

            <form
              action={logoutAction.bind(null, locale)}
              onSubmit={() => {
                localStorage.removeItem("wa-login-state");
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-red-600 hover:bg-red-500/10 hover:text-red-700 transition-colors text-sm"
              >
                <HiOutlineLogout className="h-5 w-5 shrink-0" />
                <span className="min-w-0 truncate">{dict.nav.logout}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="sbc-sidebar fixed top-0 bottom-0 z-40 border-e shadow-none hidden lg:flex flex-col transition-[width] duration-300"
        style={{
          [locale === "ar" ? "right" : "left"]: 0,
          width: "var(--sidebar-width, 16rem)",
          borderColor: "var(--surface-border)",
          backgroundColor: "var(--background)",
        }}
      >
        <div className="flex h-full flex-col px-3 py-4">
          {navContent}
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
            className={`fixed top-0 bottom-0 z-50 w-72 border-e shadow-none lg:hidden flex flex-col transition-transform duration-300 ease-in-out ${
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
              {navContent}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
