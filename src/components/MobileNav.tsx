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
  HiOutlineLogout,
} from "react-icons/hi";

interface MobileNavProps {
  locale: Locale;
  dict: Dictionary;
}

export function MobileNav({ locale, dict }: MobileNavProps) {
  const pathname = usePathname();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuOpenedAtPath, setProfileMenuOpenedAtPath] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

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
      key: "chat",
      label: dict.nav.chat ?? (locale === "ar" ? "الدردشة" : "Chat"),
      path: "/chat",
      Icon: HiChat,
      IconOutline: HiOutlineChat,
    },
  ];

  return (
    <nav
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
          return (
            <Link
              key={item.key}
              href={`/${locale}${item.path}`}
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

              <div className="my-1 border-t" style={{ borderColor: "var(--surface-border)" }} />

              <form
                action={logoutAction.bind(null, locale)}
                onSubmit={() => setProfileMenuOpen(false)}
              >
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-(--surface) transition-colors text-sm"
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
