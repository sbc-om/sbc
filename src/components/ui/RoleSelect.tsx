"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Role } from "@/lib/db/types";

interface RoleSelectProps {
  value: Role;
  onChange: (value: Role) => void;
  placeholder: string;
  locale: "en" | "ar";
  disabled?: boolean;
}

const ROLES: { value: Role; labelEn: string; labelAr: string }[] = [
  { value: "user", labelEn: "User", labelAr: "مستخدم" },
  { value: "admin", labelEn: "Admin", labelAr: "مدير" },
];

export function RoleSelect({
  value,
  onChange,
  placeholder,
  locale,
  disabled,
}: RoleSelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selected = ROLES.find((r) => r.value === value);
  const displayText = selected 
    ? (locale === "ar" ? selected.labelAr : selected.labelEn)
    : placeholder;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || disabled) return;

    const updatePosition = () => {
      const triggerEl = triggerRef.current;
      if (!triggerEl) return;

      const rect = triggerEl.getBoundingClientRect();
      const viewportPadding = 8;
      const gap = 8;
      const width = rect.width;
      const top = Math.max(
        viewportPadding,
        Math.min(rect.bottom + gap, window.innerHeight - viewportPadding)
      );

      if (locale === "ar") {
        const right = Math.max(viewportPadding, window.innerWidth - rect.right);
        setPanelStyle({
          position: "fixed",
          top,
          right,
          width,
          zIndex: 99999,
        });
        return;
      }

      const left = Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - width - viewportPadding)
      );
      setPanelStyle({
        position: "fixed",
        top,
        left,
        width,
        zIndex: 99999,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, disabled, locale]);

  useEffect(() => {
    if (!open || disabled) return;

    const handleAnyScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("scroll", handleAnyScroll, true);
    return () => window.removeEventListener("scroll", handleAnyScroll, true);
  }, [open, disabled]);

  useEffect(() => {
    if (!open || disabled) return;

    const handlePointerDownOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (roleValue: Role) => {
    onChange(roleValue);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`h-9 w-full rounded-lg border border-(--surface-border) bg-(--surface) px-3 text-sm text-foreground shadow-(--shadow) outline-none backdrop-blur transition focus:border-accent flex items-center justify-between ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-(--chip-bg)"
        }`}
      >
        <span className={!selected ? "text-(--muted-foreground)" : ""}>
          {displayText}
        </span>
        <svg
          className={`h-4 w-4 text-(--muted-foreground) transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel (portaled to <body> to avoid clipping/stacking issues) */}
      {open && !disabled && mounted &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            role="listbox"
            className="sbc-card overflow-hidden"
          >
            {/* Options List */}
            <div className="p-2 flex flex-col gap-1">
              {ROLES.map((role) => {
                const isSelected = role.value === value;
                const label = locale === "ar" ? role.labelAr : role.labelEn;

                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleSelect(role.value)}
                    className={`w-full text-start rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-accent text-(--accent-foreground) font-medium"
                        : "text-foreground hover:bg-(--chip-bg)"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{label}</span>
                      {isSelected && (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
