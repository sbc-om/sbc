"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface User {
  id: string;
  email: string;
  role: "admin" | "user";
}

interface UserSelectProps {
  users: User[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  locale: "en" | "ar";
  required?: boolean;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function UserSelect({
  users,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  locale,
  required,
  allowEmpty,
  emptyLabel,
}: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const canPortal = typeof document !== "undefined";

  const selected = users.find((u) => u.id === value);
  const displayText = selected 
    ? selected.email
    : value === "" && allowEmpty
      ? emptyLabel || placeholder
      : placeholder;

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        u.email.toLowerCase().includes(searchLower) ||
        u.id.toLowerCase().includes(searchLower)
      );
    });
  }, [users, search]);

  useEffect(() => {
    if (!open) return;

    // Avoid the browser scrolling the page when focusing an element appended to <body>.
    // (This can happen on the first open after refresh.)
    const id = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

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
  }, [open, locale]);

  useEffect(() => {
    if (!open) return;

    // Close on any scroll outside the dropdown (prevents the "sticky" feel).
    // We still allow scrolling inside the dropdown list itself.
    const handleAnyScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && panelRef.current?.contains(target)) return;
      setOpen(false);
      setSearch("");
    };

    window.addEventListener("scroll", handleAnyScroll, true);
    return () => window.removeEventListener("scroll", handleAnyScroll, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDownOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setSearch("");
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      setSearch("");
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (userId: string) => {
    onChange(userId);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input for form submission */}
      <input type="hidden" name="ownerId" value={value} required={required && !allowEmpty} />
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="h-11 w-full rounded-xl border border-(--surface-border) bg-(--surface) px-4 text-sm text-foreground shadow-(--shadow) outline-none backdrop-blur transition focus:border-accent flex items-center justify-between cursor-pointer hover:bg-(--chip-bg)"
      >
        <span className={!selected && value !== "" ? "text-(--muted-foreground)" : ""}>
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
      {open && canPortal &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            role="listbox"
            className="sbc-card overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-(--surface-border)">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--muted-foreground)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-(--surface-border) bg-background ps-9 pe-3 text-sm text-foreground outline-none placeholder:text-(--muted-foreground) focus:border-accent"
                  ref={searchInputRef}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
              {/* Empty Option */}
              {allowEmpty && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className={`w-full text-start rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    value === ""
                      ? "bg-accent text-(--accent-foreground) font-medium"
                      : "text-foreground hover:bg-(--chip-bg)"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-(--muted-foreground) italic">
                      {emptyLabel || (locale === "ar" ? "بدون صاحب" : "No owner")}
                    </span>
                    {value === "" && (
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
              )}

              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-(--muted-foreground)">
                  {locale === "ar" ? "لا توجد نتائج" : "No results found"}
                </div>
              ) : (
                filtered.map((user) => {
                  const isSelected = user.id === value;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelect(user.id)}
                      className={`w-full text-start rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? "bg-accent text-(--accent-foreground) font-medium"
                          : "text-foreground hover:bg-(--chip-bg)"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{user.email}</div>
                          <div className="mt-0.5 text-xs opacity-70 truncate">
                            {user.role === "admin"
                              ? locale === "ar"
                                ? "مدير"
                                : "Admin"
                              : locale === "ar"
                                ? "مستخدم"
                                : "User"} • {user.id}
                          </div>
                        </div>
                        {isSelected && (
                          <svg
                            className="h-4 w-4 shrink-0"
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
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
