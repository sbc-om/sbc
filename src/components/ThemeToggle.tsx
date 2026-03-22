"use client";

import { useEffect, useMemo, useState } from "react";
import { RiMoonClearLine, RiSunLine } from "react-icons/ri";
import { buttonVariants } from "@/components/ui/Button";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === "dark";

  root.classList.toggle("dark", isDark);
  // Helps form controls/scrollbars match theme.
  root.style.colorScheme = isDark ? "dark" : "light";
}

function persistTheme(theme: Theme) {
  window.localStorage.setItem("theme", theme);
  document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") return saved;
  // Default to light when no explicit saved preference exists.
  return "light";
}

export function ThemeToggle({ locale, className }: { locale: "en" | "ar"; className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only run on client after mount to avoid hydration mismatch
    // Defer to a microtask to satisfy react-hooks/set-state-in-effect.
    queueMicrotask(() => {
      setTheme(getInitialTheme());
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (mounted) {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const label = useMemo(() => {
    if (!mounted) return locale === "ar" ? "تبديل المظهر" : "Toggle theme";
    if (locale === "ar") return theme === "dark" ? "مظهر فاتح" : "مظهر داكن";
    return theme === "dark" ? "Light theme" : "Dark theme";
  }, [locale, theme, mounted]);

  // Render a placeholder until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        className={buttonVariants({
          variant: "secondary",
          size: "icon",
          className: `rounded-xl hover:translate-y-0 active:scale-100 ${className ?? ""}`,
        })}
        disabled
      >
        <RiSunLine className="h-4 w-4 opacity-50" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        const next: Theme = theme === "dark" ? "light" : "dark";
        setTheme(next);
        persistTheme(next);
        applyTheme(next);
      }}
      className={buttonVariants({
        variant: "secondary",
        size: "icon",
        className: `rounded-xl hover:translate-y-0 active:scale-100 ${className ?? ""}`,
      })}
    >
      {theme === "dark" ? (
        <RiSunLine aria-hidden="true" className="h-4 w-4 text-amber-500" />
      ) : (
        <RiMoonClearLine aria-hidden="true" className="h-4 w-4 text-indigo-500" />
      )}
    </button>
  );
}
