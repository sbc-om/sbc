"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import { logoutAction } from "@/app/[locale]/auth/actions";
import { 
  HiHome, 
  HiOutlineHome,
  HiCollection,
  HiOutlineCollection,
  HiChat,
  HiOutlineChat,
  HiLogout,
  HiOutlineLogout,
  HiViewGrid,
  HiOutlineViewGrid,
  HiSearch,
  HiOutlineSearch,
  HiUser,
  HiOutlineUser,
} from "react-icons/hi";

interface MobileNavProps {
  locale: Locale;
  dict: Dictionary;
}

export function MobileNav({ locale, dict }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(`/${locale}${path}`);

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
      key: "chat",
      label: dict.nav.chat ?? (locale === "ar" ? "الدردشة" : "Chat"),
      path: "/chat",
      Icon: HiChat,
      IconOutline: HiOutlineChat,
    },
    {
      key: "profile",
      label: locale === "ar" ? "حسابي" : "Profile",
      path: "/dashboard",
      Icon: HiUser,
      IconOutline: HiOutlineUser,
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

        <form action={logoutAction.bind(null, locale)} className="flex-1">
          <button
            type="submit"
            className="flex w-full flex-col items-center gap-1 px-4 py-2 min-w-0"
          >
            <HiOutlineLogout className="h-6 w-6 text-(--muted-foreground)" />
            <span className="text-xs truncate font-normal text-(--muted-foreground)">
              {dict.nav.logout}
            </span>
          </button>
        </form>
      </div>
    </nav>
  );
}
