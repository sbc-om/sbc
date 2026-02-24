"use client";

import { useEffect, useMemo, useState } from "react";
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

export function ThemeToggle({ locale }: { locale: "en" | "ar" }) {
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
        className={buttonVariants({ variant: "secondary", size: "icon", className: "rounded-xl" })}
        disabled
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4 opacity-50"
        >
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
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
      className={buttonVariants({ variant: "secondary", size: "icon", className: "rounded-xl" })}
    >
      {theme === "dark" ? (
        // Sun icon
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4"
        >
          <path
            d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 2v2.5M12 19.5V22M4.22 4.22 6 6M18 18l1.78 1.78M2 12h2.5M19.5 12H22M4.22 19.78 6 18M18 6l1.78-1.78"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Moon icon
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4"
        >
          <path
            d="M21 13.2A8 8 0 1 1 10.8 3a6.5 6.5 0 0 0 10.2 10.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
