"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { logoutAction } from "@/app/[locale]/auth/actions";
import { 
  HiHome, 
  HiOutlineHome,
  HiShoppingBag,
  HiOutlineShoppingBag,
  HiCollection,
  HiOutlineCollection,
  HiChat,
  HiOutlineChat,
  HiViewGrid,
  HiOutlineViewGrid,
  HiUser,
  HiOutlineUser,
  HiCog,
  HiOutlineCog,
  HiChartSquareBar,
  HiOutlineChartSquareBar,
  HiOutlineLogout,
  HiCash,
  HiOutlineCash,
  HiBriefcase,
  HiOutlineBriefcase,
  HiLocationMarker,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { IoBookmark, IoBookmarkOutline } from "react-icons/io5";

interface MobileNavProps {
  locale: Locale;
  dict: Dictionary;
  user: { role: string };
}

export function MobileNav({ locale, dict, user }: MobileNavProps) {
  const pathname = usePathname();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuOpenedAtPath, setProfileMenuOpenedAtPath] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  const isActive = (path: string) => pathname.startsWith(`/${locale}${path}`);

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
    const root = document.documentElement;
    const updateHeight = () => {
      const height = navRef.current?.offsetHeight ?? 0;
      root.style.setProperty("--mobile-nav-height", `${height}px`);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && navRef.current) {
      observer = new ResizeObserver(() => updateHeight());
      observer.observe(navRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateHeight);
      observer?.disconnect();
    };
  }, []);

  const navItems = [
    {
      key: "home",
      label: locale === "ar" ? "الرئيسية" : "Home",
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
  ];

  return (
    <nav
      ref={navRef}
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t backdrop-blur-lg"
      style={{
        backgroundColor: "rgba(var(--surface-rgb), 0.95)",
        borderColor: "var(--surface-border)",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const IconComponent = active ? item.Icon : item.IconOutline;
          const href = `/${locale}${item.path}`;

          if (item.hardNavigate) {
            return (
              <a
                key={item.key}
                href={href}
                className="flex flex-col items-center gap-1 px-4 py-2 min-w-0 flex-1"
              >
                <IconComponent className={`h-6 w-6 ${active ? "text-foreground" : "text-(--muted-foreground)"}`} />
                <span className={`text-xs truncate ${active ? "font-semibold" : "font-normal text-(--muted-foreground)"}`}>
                  {item.label}
                </span>
              </a>
            );
          }

          return (
            <Link
              key={item.key}
              href={href}
              className="flex flex-col items-center gap-1 px-4 py-2 min-w-0 flex-1"
            >
              <IconComponent className={`h-6 w-6 ${active ? "text-foreground" : "text-(--muted-foreground)"}`} />
              <span className={`text-xs truncate ${active ? "font-semibold" : "font-normal text-(--muted-foreground)"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Profile dropdown */}
        <div ref={profileMenuRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen((v) => {
                const next = !v;
                if (next) setProfileMenuOpenedAtPath(pathname);
                return next;
              });
            }}
            className="flex w-full flex-col items-center gap-1 px-4 py-2 min-w-0"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuVisible}
          >
            {(() => {
              const ProfileIcon = isActive("/profile") ? HiUser : HiOutlineUser;
              return (
                <ProfileIcon
                  className={`h-6 w-6 ${isActive("/profile") ? "text-foreground" : "text-(--muted-foreground)"}`}
                />
              );
            })()}
            <span
              className={`text-xs truncate ${isActive("/profile") ? "font-semibold" : "font-normal text-(--muted-foreground)"}`}
            >
              {dict.nav.profile}
            </span>
          </button>

          {isProfileMenuVisible && (
            <div
              role="menu"
              aria-label="Profile menu"
              className="absolute bottom-full mb-2 w-56 max-w-[calc(100vw-16px)] rounded-xl border bg-background shadow-xl p-2"
              style={{
                borderColor: "var(--surface-border)",
                ...(locale === "ar" ? { left: 8 } : { right: 8 }),
              }}
            >
              <Link
                role="menuitem"
                href={`/${locale}/profile`}
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
              >
                <HiOutlineUser className="h-5 w-5 shrink-0" />
                <span className="min-w-0 truncate">{dict.nav.profile}</span>
              </Link>

              <Link
                role="menuitem"
                href={`/${locale}/dashboard`}
                onClick={() => setProfileMenuOpen(false)}
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
                  onClick={() => setProfileMenuOpen(false)}
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
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
              >
                {(() => {
                  const ChatIcon = isActive("/chat") ? HiChat : HiOutlineChat;
                  return <ChatIcon className="h-5 w-5 shrink-0" />;
                })()}
                <span className="min-w-0 truncate">{dict.nav.chat ?? (locale === "ar" ? "الدردشة" : "Chat")}</span>
              </Link>

              <div className="my-1 border-t" style={{ borderColor: "var(--surface-border)" }} />

              <Link
                role="menuitem"
                href={`/${locale}/settings`}
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
              >
                {(() => {
                  const SettingsIcon = isActive("/settings") ? HiCog : HiOutlineCog;
                  return <SettingsIcon className="h-5 w-5 shrink-0" />;
                })()}
                <span className="min-w-0 truncate">{dict.nav.settings}</span>
              </Link>

              {user.role === "admin" && (
                <Link
                  role="menuitem"
                  href={`/${locale}/admin`}
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
                >
                  {(() => {
                    const AdminIcon = isActive("/admin") ? HiCog : HiOutlineCog;
                    return <AdminIcon className="h-5 w-5 shrink-0" />;
                  })()}
                  <span className="min-w-0 truncate">{dict.nav.admin}</span>
                </Link>
              )}

              <Link
                role="menuitem"
                href={`/${locale}/saved`}
                onClick={() => setProfileMenuOpen(false)}
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
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
              >
                {(() => {
                  const WalletIcon = isActive("/wallet") ? HiCash : HiOutlineCash;
                  return <WalletIcon className="h-5 w-5 shrink-0" />;
                })()}
                <span className="min-w-0 truncate">
                  {locale === "ar" ? "المحفظة" : "Wallet"}
                </span>
              </Link>

              <div className="my-1 border-t" style={{ borderColor: "var(--surface-border)" }} />

              <form
                action={logoutAction.bind(null, locale)}
                onSubmit={() => { localStorage.removeItem("wa-login-state"); setProfileMenuOpen(false); }}
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
      </div>
    </nav>
  );
}
