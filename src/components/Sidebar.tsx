"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { OverlayScrollbars } from "overlayscrollbars";
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
  HiLocationMarker,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { IoBookmark, IoBookmarkOutline, IoWallet, IoWalletOutline } from "react-icons/io5";
import { HiPlus, HiOutlinePlus, HiBriefcase, HiOutlineBriefcase, HiUserGroup, HiOutlineUserGroup } from "react-icons/hi";
import { RiComputerLine, RiMoonClearLine, RiSunLine } from "react-icons/ri";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
  NOTIFICATION_PREFERENCES_EVENT,
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
  parseNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notifications/preferences";

function getOverlayScrollbarTheme() {
  return document.documentElement.classList.contains("dark")
    ? "os-theme-dark"
    : "os-theme-light";
}

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
  hardNavigate?: boolean;
};

export function Sidebar({ locale, dict, user }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, setCollapsed, isMobile } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuOpenedAtPath, setProfileMenuOpenedAtPath] = useState<string | null>(null);
  const [notificationUnread, setNotificationUnread] = useState(0);
  const [notificationPulse, setNotificationPulse] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const desktopNavScrollRef = useRef<HTMLElement | null>(null);
  const mobileNavScrollRef = useRef<HTMLElement | null>(null);
  const desktopNavScrollbarRef = useRef<ReturnType<typeof OverlayScrollbars> | null>(null);
  const mobileNavScrollbarRef = useRef<ReturnType<typeof OverlayScrollbars> | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuScrollRef = useRef<HTMLDivElement | null>(null);
  const profileMenuScrollbarRef = useRef<ReturnType<typeof OverlayScrollbars> | null>(null);

  // ── Theme state ────────────────────────────────────────────────────
  type ThemeMode = "light" | "dark" | "system";
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" || saved === "system" ? saved : "light";
  });

  const applyTheme = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    let isDark = mode === "dark";
    if (mode === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    root.classList.toggle("dark", isDark);
    root.style.colorScheme = isDark ? "dark" : "light";
  }, []);

  // Listen for system preference changes when in "system" mode.
  // NOTE: We intentionally do NOT call applyTheme on mount here.
  // The blocking <script> in <head> already applied the correct theme
  // from localStorage. Calling applyTheme with the default React state
  // ("light") would briefly remove the "dark" class and cause a flash.
  // Theme is only applied via handleThemeChange (user interaction) or
  // the system-preference listener below.
  useEffect(() => {
    if (themeMode !== "system") return;
    // Apply immediately in case system preference differs from blocking script
    applyTheme("system");
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [themeMode, applyTheme]);

  const handleThemeChange = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode);
      localStorage.setItem("theme", mode);
      document.cookie = `theme=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
      applyTheme(mode);
    },
    [applyTheme],
  );
  // ──────────────────────────────────────────────────────────────────

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
  const isNotificationsEnabled = notificationPreferences.notificationsEnabled;
  const displayNotificationUnread = isNotificationsEnabled ? notificationUnread : 0;
  const displayNotificationPulse = isNotificationsEnabled ? notificationPulse : false;

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

  useLayoutEffect(() => {
    if (!desktopNavScrollRef.current) return;

    desktopNavScrollbarRef.current?.destroy();
    desktopNavScrollbarRef.current = OverlayScrollbars(desktopNavScrollRef.current, {
      overflow: {
        x: "hidden",
        y: "scroll",
      },
      scrollbars: {
        theme: getOverlayScrollbarTheme(),
        autoHide: "never",
        clickScroll: true,
        dragScroll: true,
      },
    });

    return () => {
      desktopNavScrollbarRef.current?.destroy();
      desktopNavScrollbarRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (!isMobile || !mobileNavScrollRef.current) {
      mobileNavScrollbarRef.current?.destroy();
      mobileNavScrollbarRef.current = null;
      return;
    }

    mobileNavScrollbarRef.current?.destroy();
    mobileNavScrollbarRef.current = OverlayScrollbars(mobileNavScrollRef.current, {
      overflow: {
        x: "hidden",
        y: "scroll",
      },
      scrollbars: {
        theme: getOverlayScrollbarTheme(),
        autoHide: "never",
        clickScroll: true,
        dragScroll: true,
      },
    });

    return () => {
      mobileNavScrollbarRef.current?.destroy();
      mobileNavScrollbarRef.current = null;
    };
  }, [isMobile]);

  useLayoutEffect(() => {
    if (!isProfileMenuVisible || !profileMenuScrollRef.current) {
      profileMenuScrollbarRef.current?.destroy();
      profileMenuScrollbarRef.current = null;
      return;
    }

    profileMenuScrollbarRef.current = OverlayScrollbars(profileMenuScrollRef.current, {
      overflow: {
        x: "hidden",
        y: "scroll",
      },
      scrollbars: {
        theme: getOverlayScrollbarTheme(),
        autoHide: "never",
        clickScroll: true,
        dragScroll: true,
      },
    });

    return () => {
      profileMenuScrollbarRef.current?.destroy();
      profileMenuScrollbarRef.current = null;
    };
  }, [isProfileMenuVisible]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const apply = (prefs: NotificationPreferences) => {
      setNotificationPreferences(normalizeNotificationPreferences(prefs));
    };

    const local = parseNotificationPreferences(
      window.localStorage.getItem(NOTIFICATION_PREFERENCES_STORAGE_KEY),
    );
    if (local) apply(local);

    const syncFromServer = async () => {
      try {
        const res = await fetch("/api/settings/notifications", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as
          | { ok: true; settings: NotificationPreferences }
          | { ok: false; error?: string }
          | null;
        if (!res.ok || !data || !data.ok) return;
        const normalized = normalizeNotificationPreferences(data.settings);
        apply(normalized);
        window.localStorage.setItem(
          NOTIFICATION_PREFERENCES_STORAGE_KEY,
          JSON.stringify(normalized),
        );
      } catch {
        // keep previous prefs
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== NOTIFICATION_PREFERENCES_STORAGE_KEY) return;
      const parsed = parseNotificationPreferences(event.newValue);
      if (parsed) apply(parsed);
    };

    const onCustom = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationPreferences>;
      if (customEvent.detail) apply(customEvent.detail);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(NOTIFICATION_PREFERENCES_EVENT, onCustom as EventListener);
    void syncFromServer();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(NOTIFICATION_PREFERENCES_EVENT, onCustom as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!notificationPreferences.notificationsEnabled) return;

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
            if (notificationPreferences.soundsEnabled) {
              playNotificationSound();
            }
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
  }, [notificationPreferences.notificationsEnabled, notificationPreferences.soundsEnabled]);

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
      key: "map",
      label: locale === "ar" ? "الخريطة" : "Map",
      path: "/map",
      Icon: HiLocationMarker,
      IconOutline: HiOutlineLocationMarker,
      hardNavigate: true,
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

  const renderNavContent = (navScrollRef: React.RefObject<HTMLElement | null>) => (
    <>
      {/* Logo */}
      <div className={`sbc-sidebar-head ${iconOnly ? "px-0" : "px-3"} pt-4 ${collapsed ? "mb-4" : "mb-8"}`}>
        <div className={`sbc-sidebar-head-row ${iconOnly ? "flex flex-col items-center gap-2" : "flex items-center justify-between gap-2"}`}>
          <Link
            href={`/${locale}`}
            className={`sbc-sidebar-logo-link flex items-center gap-3 group min-w-0 ${iconOnly ? "justify-center" : "justify-start"}`}
            title={iconOnly ? "SBC" : undefined}
          >
            <Image
              src="/images/sbc.svg"
              alt="SBC"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0"
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
            className={`sbc-sidebar-notif-btn relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
              isActive("/notifications")
                ? "bg-linear-to-r from-accent/10 to-accent-2/10 text-accent"
                : "bg-(--chip-bg) text-(--muted-foreground) hover:text-foreground"
            } ${displayNotificationPulse ? "motion-safe:animate-pulse" : ""}`}
            aria-label={locale === "ar" ? "الإشعارات" : "Notifications"}
            title={locale === "ar" ? "الإشعارات" : "Notifications"}
          >
            {isActive("/notifications") ? <HiBell className="h-5 w-5" /> : <HiOutlineBell className="h-5 w-5" />}
            {displayNotificationUnread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-5 text-center shadow">
                {displayNotificationUnread > 99 ? "99+" : displayNotificationUnread}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav
        ref={navScrollRef}
        className={`sbc-sidebar-nav flex-1 min-h-0 space-y-1 overflow-y-auto overflow-x-hidden ${iconOnly ? "px-0" : "px-2"}`}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          const IconComponent = active ? item.Icon : item.IconOutline;
          const href = `/${locale}${item.path}`;
          const className = `sbc-sidebar-navlink flex min-w-0 items-center rounded-xl text-base transition-colors ${
            active
              ? "bg-linear-to-r from-accent/10 to-accent-2/10 font-bold text-accent"
              : "hover:bg-(--chip-bg) font-normal"
          } ${iconOnly ? "mx-auto h-12 w-12 justify-center px-0" : "w-full h-12 justify-start gap-4 px-3"}`;

          if (item.hardNavigate) {
            return (
              <a
                key={item.key}
                href={href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={className}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <IconComponent className="h-7 w-7 shrink-0 -translate-y-[1px]" />
                {(!collapsed || isMobile) && (
                  <span className="sbc-sidebar-label min-w-0 truncate whitespace-nowrap leading-tight">
                    {item.label}
                  </span>
                )}
              </a>
            );
          }

          return (
            <Link
              key={item.key}
              href={href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={className}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <IconComponent className="h-7 w-7 shrink-0 -translate-y-[1px]" />
              {(!collapsed || isMobile) && (
                <span className="sbc-sidebar-label min-w-0 truncate whitespace-nowrap leading-tight">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse (last menu option) - Desktop Only */}
      {!isMobile && (
        <div className={`sbc-sidebar-collapse-wrap mt-2 pt-2 mb-2 ${iconOnly ? "px-0" : "px-2"}`} style={{ borderColor: "var(--surface-border)" }}>
          <button
            onClick={toggleCollapsed}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-(--chip-bg) transition-all ${iconOnly ? "justify-center" : "justify-start"}`}
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
        className={`sbc-sidebar-profile-wrap mt-auto pt-4 relative ${iconOnly ? "px-0" : "px-2"}`}
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
          className={`sbc-sidebar-profile-btn flex items-center gap-3 rounded-xl hover:bg-(--chip-bg) transition-colors ${
            isProfileMenuVisible ? "bg-(--chip-bg)" : ""
          } ${iconOnly ? "mx-auto h-12 w-12 justify-center p-0" : "w-full justify-start p-3"}`}
          aria-haspopup="menu"
          aria-expanded={isProfileMenuVisible}
        >
          <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 bg-gradient-to-r from-accent to-accent-2 flex items-center justify-center">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-white">{avatarInitial}</span>
            )}
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1 min-w-0 text-start">
              <p className="text-sm font-semibold truncate">{user.displayName}</p>
              <p className="text-xs text-(--muted-foreground) truncate">{user.email}</p>
            </div>
          )}
        </button>

        {isProfileMenuVisible && (
          <div
            role="menu"
            aria-label="Profile menu"
            className={`absolute z-50 rounded-xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150 flex flex-col ${
              iconOnly ? "w-64" : "w-full"
            }`}
            style={{
              backgroundColor: "color-mix(in srgb, var(--background) 94%, var(--foreground))",
              maxHeight: "calc(100dvh - 9rem)",
              ...(iconOnly
                ? locale === "ar"
                  ? { right: "calc(100% + 0.5rem)", bottom: 0 }
                  : { left: "calc(100% + 0.5rem)", bottom: 0 }
                : locale === "ar"
                ? { right: 0, bottom: "calc(100% + 0.5rem)" }
                : { left: 0, bottom: "calc(100% + 0.5rem)" }),
            }}
          >
            <div className="px-2 py-2 shrink-0">
              <p className="text-xs text-(--muted-foreground)">{dict.nav.profile}</p>
            </div>

            <div ref={profileMenuScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pe-1">

            <Link
              role="menuitem"
              href={`/${locale}/profile`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
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
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
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
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
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
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
            >
              {(() => {
                const ChatIcon = isActive("/chat") ? HiChat : HiOutlineChat;
                return <ChatIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">{dict.nav.chat ?? (locale === "ar" ? "الدردشة" : "Chat")}</span>
            </Link>

            <Link
              role="menuitem"
              href={`/${locale}/tools`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
            >
              {(() => {
                const ToolsIcon = isActive("/tools") ? HiViewGrid : HiOutlineViewGrid;
                return <ToolsIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">{locale === "ar" ? "الأدوات" : "Tools"}</span>
            </Link>

            <Link
              role="menuitem"
              href={`/${locale}/about`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
            >
              {(() => {
                const AboutIcon = isActive("/about") ? HiCollection : HiOutlineCollection;
                return <AboutIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">{locale === "ar" ? "عن المشروع" : "About"}</span>
            </Link>

            <Link
              role="menuitem"
              href={`/${locale}/contact`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
            >
              {(() => {
                const ContactIcon = isActive("/contact") ? HiChat : HiOutlineChat;
                return <ContactIcon className="h-5 w-5 shrink-0" />;
              })()}
              <span className="min-w-0 truncate">{locale === "ar" ? "تواصل معنا" : "Contact"}</span>
            </Link>

            <Link
              role="menuitem"
              href={`/${locale}/notifications`}
              onClick={() => {
                setProfileMenuOpen(false);
                if (isMobile) setMobileOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
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
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
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
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
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
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--chip-bg) transition-colors text-sm"
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

            {/* Theme Switcher */}
            <div className="px-2 py-2">
              <p className="mb-2 text-xs font-medium text-(--muted-foreground)">
                {locale === "ar" ? "المظهر" : "Theme"}
              </p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-(--chip-bg) p-1">
                {(
                  [
                    {
                      mode: "light" as ThemeMode,
                      icon: RiSunLine,
                      label: locale === "ar" ? "فاتح" : "Light",
                      activeClass: "text-amber-500",
                    },
                    {
                      mode: "dark" as ThemeMode,
                      icon: RiMoonClearLine,
                      label: locale === "ar" ? "داكن" : "Dark",
                      activeClass: "text-indigo-500",
                    },
                    {
                      mode: "system" as ThemeMode,
                      icon: RiComputerLine,
                      label: locale === "ar" ? "النظام" : "System",
                      activeClass: "text-sky-500",
                    },
                  ] as const
                ).map(({ mode, icon: Icon, label, activeClass }) => {
                  const isSelected = themeMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="menuitem"
                      onClick={() => handleThemeChange(mode)}
                      aria-label={label}
                      title={label}
                      className={`flex h-8 items-center justify-center rounded-lg transition-all ${
                        isSelected
                          ? "bg-(--background) shadow-sm"
                          : "text-(--muted-foreground) hover:text-(--foreground)"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${isSelected ? activeClass : "text-(--muted-foreground)"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="my-1 border-t" style={{ borderColor: "var(--surface-border)" }} />

            </div>

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
        className={`sbc-sidebar fixed top-0 bottom-0 z-40 hidden shadow-none lg:flex flex-col ${
          iconOnly ? "overflow-visible" : "overflow-x-hidden"
        }`}
        style={{
          [locale === "ar" ? "right" : "left"]: 0,
          width: "var(--sidebar-width, 16rem)",
          backgroundColor: "var(--background)",
        }}
      >
        <div className="sbc-sidebar-inner flex h-full min-h-0 flex-col px-3 py-4">
          {renderNavContent(desktopNavScrollRef)}
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
            className={`fixed top-0 bottom-0 z-50 w-72 overflow-x-hidden shadow-none lg:hidden flex flex-col transition-transform duration-300 ease-in-out ${
              mobileOpen ? "translate-x-0" : (locale === "ar" ? "translate-x-full" : "-translate-x-full")
            }`}
            style={{
              [locale === "ar" ? "right" : "left"]: 0,
              backgroundColor: "var(--background)",
            }}
          >
            <div className="flex h-full flex-col px-3 py-4">
              {/* Close button for mobile */}
              <button
                onClick={() => setMobileOpen(false)}
                className="self-end mb-2 p-2 rounded-lg hover:bg-(--chip-bg) transition-colors"
                aria-label="Close menu"
              >
                <HiX className="h-6 w-6" />
              </button>
              <div className="min-h-0 flex flex-1 flex-col">
                {renderNavContent(mobileNavScrollRef)}
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
